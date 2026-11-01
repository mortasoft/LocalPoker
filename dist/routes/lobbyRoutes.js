"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lobbyController_1 = require("../controllers/lobbyController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Allow reading lobbies without auth (optional), but let's make it authenticated to keep it consistent
router.get('/', authMiddleware_1.authMiddleware, lobbyController_1.listLobbies);
router.post('/', authMiddleware_1.authMiddleware, lobbyController_1.createLobby);
exports.default = router;
