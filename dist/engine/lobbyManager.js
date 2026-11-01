"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lobbyManager = void 0;
const Table_1 = require("./Table");
class LobbyManager {
    lobbies = new Map();
    createLobby(id, smallBlind = 10, bigBlind = 20) {
        if (this.lobbies.has(id)) {
            throw new Error(`El lobby con ID ${id} ya existe.`);
        }
        const table = new Table_1.Table(id, smallBlind, bigBlind);
        this.lobbies.set(id, table);
        return table;
    }
    getLobby(id) {
        return this.lobbies.get(id);
    }
    getAllLobbies() {
        return Array.from(this.lobbies.values()).map(table => ({
            id: table.id,
            playerCount: table.players.length,
            maxPlayers: 8, // Límite estándar por mesa
            smallBlind: table.smallBlindAmount,
            bigBlind: table.bigBlindAmount,
            stage: table.stage,
        }));
    }
    deleteLobby(id) {
        return this.lobbies.delete(id);
    }
}
exports.lobbyManager = new LobbyManager();
