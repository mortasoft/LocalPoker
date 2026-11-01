"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLobbies = listLobbies;
exports.createLobby = createLobby;
const lobbyManager_1 = require("../engine/lobbyManager");
function listLobbies(req, res) {
    const lobbies = lobbyManager_1.lobbyManager.getAllLobbies();
    res.json(lobbies);
}
function createLobby(req, res) {
    const { smallBlind, bigBlind } = req.body;
    const sb = parseInt(smallBlind) || 10;
    const bb = parseInt(bigBlind) || 20;
    // Generate a random 6-character room code, e.g. PK-A8F2
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomCode = 'PK-';
    for (let i = 0; i < 4; i++) {
        roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    try {
        const table = lobbyManager_1.lobbyManager.createLobby(roomCode, sb, bb);
        res.status(201).json({
            message: 'Sala creada con éxito.',
            lobby: {
                id: table.id,
                smallBlind: table.smallBlindAmount,
                bigBlind: table.bigBlindAmount,
                playerCount: 0,
                maxPlayers: 8,
                stage: table.stage,
            },
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Error al crear la sala.' });
    }
}
