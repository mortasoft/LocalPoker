import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import lobbyRoutes from './routes/lobbyRoutes';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*', // En producción restringir al origen de la app móvil/web
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/lobbies', lobbyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
