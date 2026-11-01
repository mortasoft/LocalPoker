import { Table } from './Table';

class LobbyManager {
  private lobbies: Map<string, Table> = new Map();

  createLobby(id: string, smallBlind: number = 10, bigBlind: number = 20): Table {
    if (this.lobbies.has(id)) {
      throw new Error(`El lobby con ID ${id} ya existe.`);
    }
    const table = new Table(id, smallBlind, bigBlind);
    this.lobbies.set(id, table);
    return table;
  }

  getLobby(id: string): Table | undefined {
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

  deleteLobby(id: string): boolean {
    return this.lobbies.delete(id);
  }
}

export const lobbyManager = new LobbyManager();
