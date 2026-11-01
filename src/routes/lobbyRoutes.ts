import { Router } from 'express';
import { listLobbies, createLobby } from '../controllers/lobbyController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Allow reading lobbies without auth (optional), but let's make it authenticated to keep it consistent
router.get('/', authMiddleware as any, listLobbies);
router.post('/', authMiddleware as any, createLobby);

export default router;
