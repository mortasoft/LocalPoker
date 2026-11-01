"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const JWT_SECRET = process.env.JWT_SECRET || 'secret-secreto-super-poker';
async function register(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
        return;
    }
    try {
        const existingUser = await db_1.prisma.user.findUnique({
            where: { username },
        });
        if (existingUser) {
            res.status(400).json({ error: 'El nombre de usuario ya está registrado.' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = await db_1.prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                chips: 10000, // Fichas iniciales por defecto
            },
        });
        // Sign JWT
        const token = jsonwebtoken_1.default.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, {
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
    }
    catch (err) {
        console.error('Error en registro:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
}
async function login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
        return;
    }
    try {
        const user = await db_1.prisma.user.findUnique({
            where: { username },
        });
        if (!user) {
            res.status(401).json({ error: 'Credenciales inválidas.' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: 'Credenciales inválidas.' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, JWT_SECRET, {
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
    }
    catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
}
async function getMe(req, res) {
    if (!req.user) {
        res.status(401).json({ error: 'No autorizado.' });
        return;
    }
    try {
        const user = await db_1.prisma.user.findUnique({
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
    }
    catch (err) {
        console.error('Error en getMe:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
}
