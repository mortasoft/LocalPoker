import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { setupSocketIO } from './socket/socketHandler';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocketIO(io);

server.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 Servidor de Poker escuchando en puerto ${PORT}`);
  console.log(`   API REST: http://localhost:${PORT}/api`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`===========================================`);
});
