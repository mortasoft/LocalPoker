"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketIO = setupSocketIO;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const lobbyManager_1 = require("../engine/lobbyManager");
const Player_1 = require("../engine/Player");
const JWT_SECRET = process.env.JWT_SECRET || 'secret-secreto-super-poker';
// Maps socket.id to metadata
const socketData = new Map();
function setupSocketIO(io) {
    // Middleware to authenticate socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            return next(new Error('Autenticación fallida: Token no proporcionado.'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            socket.user = decoded;
            next();
        }
        catch (err) {
            return next(new Error('Autenticación fallida: Token inválido.'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.user;
        console.log(`Cliente conectado: ${user.username} (Socket: ${socket.id})`);
        socketData.set(socket.id, { userId: user.id, lobbyId: null });
        // 1. Join a lobby
        socket.on('join_lobby', async (lobbyId) => {
            try {
                const table = lobbyManager_1.lobbyManager.getLobby(lobbyId);
                if (!table) {
                    socket.emit('error_message', 'La sala no existe.');
                    return;
                }
                // Check if player is already in this lobby (reconnecting)
                let player = table.getPlayer(user.id);
                if (player) {
                    player.isActive = true;
                    console.log(`Jugador ${user.username} reconectó a la sala ${lobbyId}`);
                }
                else {
                    // If table is full
                    if (table.players.length >= 8) {
                        socket.emit('error_message', 'La sala está llena.');
                        return;
                    }
                    // Fetch fresh chips from database
                    const dbUser = await db_1.prisma.user.findUnique({ where: { id: user.id } });
                    const chips = dbUser ? dbUser.chips : 10000;
                    player = new Player_1.Player(user.id, user.username, chips);
                    table.addPlayer(player);
                    console.log(`Jugador ${user.username} se unió a la sala ${lobbyId}`);
                }
                // Update socket association
                socketData.set(socket.id, { userId: user.id, lobbyId });
                socket.join(lobbyId);
                // Broadcast updated state to all in lobby
                broadcastTableState(io, table);
            }
            catch (err) {
                socket.emit('error_message', err.message || 'Error al unirse al lobby.');
            }
        });
        // 2. Player toggles ready
        socket.on('player_ready', () => {
            const metadata = socketData.get(socket.id);
            if (!metadata || !metadata.lobbyId) {
                socket.emit('error_message', 'No estás en ninguna sala.');
                return;
            }
            const table = lobbyManager_1.lobbyManager.getLobby(metadata.lobbyId);
            if (!table)
                return;
            const player = table.getPlayer(metadata.userId);
            if (!player)
                return;
            player.isReady = !player.isReady;
            console.log(`Jugador ${player.username} marcó listura como: ${player.isReady}`);
            // Check if we can auto-start game
            // Start if all active players are ready AND there are >= 2 players
            const activePlayers = table.players.filter(p => p.isActive);
            const readyPlayers = activePlayers.filter(p => p.isReady);
            if (activePlayers.length >= 2 && readyPlayers.length === activePlayers.length && table.stage === 'WAITING') {
                try {
                    table.startGame();
                    console.log(`Partida iniciada automáticamente en sala ${table.id}`);
                    // Send custom event to each player with their pocket cards and broadcast full state
                    sendPrivateCardsAndBroadcast(io, table);
                }
                catch (err) {
                    io.to(table.id).emit('error_message', err.message || 'Error al iniciar la partida.');
                }
            }
            else {
                broadcastTableState(io, table);
            }
        });
        // 3. Player actions (fold, check, call, raise)
        socket.on('game_action', async (data) => {
            const metadata = socketData.get(socket.id);
            if (!metadata || !metadata.lobbyId) {
                socket.emit('error_message', 'No estás en ninguna sala.');
                return;
            }
            const table = lobbyManager_1.lobbyManager.getLobby(metadata.lobbyId);
            if (!table)
                return;
            try {
                table.executeAction(metadata.userId, data.action, data.amount);
                console.log(`Acción ejecutada: ${user.username} -> ${data.action} ${data.amount ?? ''}`);
                // If game enters Showdown, we persist chips immediately and set a auto-reset timer
                if (table.stage === 'SHOWDOWN') {
                    await persistChips(table);
                    sendPrivateCardsAndBroadcast(io, table);
                    // Auto reset table back to WAITING stage after 12 seconds
                    setTimeout(() => {
                        resetTableToWaiting(io, table);
                    }, 12000);
                }
                else {
                    sendPrivateCardsAndBroadcast(io, table);
                }
            }
            catch (err) {
                socket.emit('error_message', err.message || 'Acción inválida.');
            }
        });
        // 4. Leave Lobby
        socket.on('leave_lobby', () => {
            handleUserLeave(io, socket);
        });
        // 5. Chat message
        socket.on('chat_message', (message) => {
            const metadata = socketData.get(socket.id);
            if (!metadata || !metadata.lobbyId)
                return;
            if (message && message.trim().length > 0) {
                io.to(metadata.lobbyId).emit('chat_message', {
                    sender: user.username,
                    text: message.trim(),
                    timestamp: Date.now(),
                });
            }
        });
        socket.on('disconnect', () => {
            console.log(`Cliente desconectado: ${user.username} (Socket: ${socket.id})`);
            const metadata = socketData.get(socket.id);
            if (metadata && metadata.lobbyId) {
                const table = lobbyManager_1.lobbyManager.getLobby(metadata.lobbyId);
                if (table) {
                    const player = table.getPlayer(metadata.userId);
                    if (player) {
                        // Mark inactive instead of instant remove, so they have a chance to reconnect
                        player.isActive = false;
                        console.log(`Jugador ${player.username} marcado como Inactivo.`);
                        // If game is in WAITING, remove immediately
                        if (table.stage === 'WAITING') {
                            table.removePlayer(player.id);
                            broadcastTableState(io, table);
                        }
                        else {
                            // If it's active game and it's their turn, execute auto-fold/check to keep game moving
                            if (table.currentTurn !== -1 && table.players[table.currentTurn].id === player.id) {
                                try {
                                    executeAutoAction(io, table, player);
                                }
                                catch (err) {
                                    console.error('Error al auto-accionar jugador desconectado:', err);
                                }
                            }
                            else {
                                broadcastTableState(io, table);
                            }
                        }
                    }
                }
            }
            socketData.delete(socket.id);
        });
    });
}
function handleUserLeave(io, socket) {
    const metadata = socketData.get(socket.id);
    if (!metadata || !metadata.lobbyId)
        return;
    const table = lobbyManager_1.lobbyManager.getLobby(metadata.lobbyId);
    if (table) {
        const player = table.getPlayer(metadata.userId);
        if (player) {
            // If game is active, we just mark inactive (retaining chips/fold state), they can fold or run out
            if (table.stage !== 'WAITING' && table.stage !== 'SHOWDOWN') {
                player.isActive = false;
                player.isFolded = true;
                // If it was their turn, auto advance
                if (table.currentTurn !== -1 && table.players[table.currentTurn].id === player.id) {
                    executeAutoAction(io, table, player);
                }
                else {
                    // If betting is complete due to their fold
                    if (table.isBettingRoundComplete()) {
                        table.advanceStage(); // call internal advance stage
                        if (table.stage === 'SHOWDOWN') {
                            persistChips(table).then(() => {
                                sendPrivateCardsAndBroadcast(io, table);
                                setTimeout(() => resetTableToWaiting(io, table), 12000);
                            });
                            return;
                        }
                    }
                    sendPrivateCardsAndBroadcast(io, table);
                }
            }
            else {
                table.removePlayer(player.id);
                broadcastTableState(io, table);
            }
        }
    }
    socket.leave(metadata.lobbyId);
    socketData.set(socket.id, { userId: metadata.userId, lobbyId: null });
}
function executeAutoAction(io, table, player) {
    // If player can check, check. Otherwise, fold.
    const canCheck = player.currentBet === table.currentHighestBet;
    const action = canCheck ? 'check' : 'fold';
    table.executeAction(player.id, action);
    console.log(`Auto-acción para jugador desconectado ${player.username}: ${action}`);
    if (table.stage === 'SHOWDOWN') {
        persistChips(table).then(() => {
            sendPrivateCardsAndBroadcast(io, table);
            setTimeout(() => resetTableToWaiting(io, table), 12000);
        });
    }
    else {
        sendPrivateCardsAndBroadcast(io, table);
    }
}
async function persistChips(table) {
    try {
        for (const player of table.players) {
            await db_1.prisma.user.update({
                where: { id: player.id },
                data: { chips: player.chips },
            });
        }
        console.log(`Fichas actualizadas en base de datos para la mesa ${table.id}`);
    }
    catch (err) {
        console.error('Error al persistir fichas en BD:', err);
    }
}
function resetTableToWaiting(io, table) {
    // If stage is still Showdown, we reset
    if (table.stage === 'SHOWDOWN') {
        table.stage = 'WAITING';
        table.communityCards = [];
        table.showdownResults = null;
        // Remove players who disconnected (isActive === false)
        const toRemove = table.players.filter(p => !p.isActive);
        for (const p of toRemove) {
            table.removePlayer(p.id);
        }
        // Reset player states
        for (const p of table.players) {
            p.resetForNewRound();
            p.isReady = false; // require ready again
        }
        console.log(`Mesa ${table.id} reseteada a estado WAITING.`);
        broadcastTableState(io, table);
    }
}
/**
 * Returns clean representations of the table, masking card details of other players.
 */
function getMaskedTableState(table, recipientUserId) {
    return {
        id: table.id,
        stage: table.stage,
        communityCards: table.communityCards.map(c => c.toShortString()),
        pot: table.getTotalPot(),
        currentHighestBet: table.currentHighestBet,
        minRaise: table.minRaise,
        dealerIndex: table.dealerIndex,
        sbIndex: table.sbIndex,
        bbIndex: table.bbIndex,
        currentTurn: table.currentTurn,
        showdownResults: table.showdownResults,
        players: table.players.map(p => {
            const isSelf = p.id === recipientUserId;
            // Show cards if it is self OR if we are in showdown and player hasn't folded
            const showCards = isSelf || (table.stage === 'SHOWDOWN' && !p.isFolded);
            return {
                id: p.id,
                username: p.username,
                chips: p.chips,
                currentBet: p.currentBet,
                totalRoundBet: p.totalRoundBet,
                isFolded: p.isFolded,
                isAllIn: p.isAllIn,
                isReady: p.isReady,
                isActive: p.isActive,
                lastAction: p.lastAction,
                cards: showCards ? p.cards.map(c => c.toShortString()) : (p.cards.length > 0 ? ['?', '?'] : []),
            };
        }),
    };
}
function broadcastTableState(io, table) {
    // We send customized state to each socket in the room so cards are masked
    // Get all sockets currently in this room
    const socketsInRoom = io.sockets.adapter.rooms.get(table.id);
    if (!socketsInRoom)
        return;
    for (const socketId of socketsInRoom) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
            const metadata = socketData.get(socketId);
            if (metadata) {
                const state = getMaskedTableState(table, metadata.userId);
                socket.emit('table_update', state);
            }
        }
    }
}
function sendPrivateCardsAndBroadcast(io, table) {
    broadcastTableState(io, table);
}
