"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const socketHandler_1 = require("./socket/socketHandler");
const PORT = process.env.PORT || 5000;
const server = http_1.default.createServer(app_1.default);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
(0, socketHandler_1.setupSocketIO)(io);
server.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 Servidor de Poker escuchando en puerto ${PORT}`);
    console.log(`   API REST: http://localhost:${PORT}/api`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`===========================================`);
});
