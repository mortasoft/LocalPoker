import { Response } from 'express';
import { lobbyManager } from '../engine/lobbyManager';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export function listLobbies(req: AuthenticatedRequest, res: Response): void {
  const lobbies = lobbyManager.getAllLobbies();
  res.json(lobbies);
}

export function createLobby(req: AuthenticatedRequest, res: Response): void {
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
    const table = lobbyManager.createLobby(roomCode, sb, bb);
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
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Error al crear la sala.' });
  }
}
