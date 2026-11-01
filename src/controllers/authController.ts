import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-secreto-super-poker';

export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    return;
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      res.status(400).json({ error: 'El nombre de usuario ya está registrado.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        chips: 10000, // Fichas iniciales por defecto
      },
    });

    // Sign JWT
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'Usuario registrado con éxito.',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        chips: newUser.chips,
      },
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        username: user.username,
        chips: user.chips,
      },
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'No autorizado.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      chips: user.chips,
    });
  } catch (err) {
    console.error('Error en getMe:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
