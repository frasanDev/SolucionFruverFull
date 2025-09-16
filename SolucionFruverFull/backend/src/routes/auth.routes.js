// backend/src/routes/auth.routes.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = Router();

// POST /auth/login { usuario, clave }
router.post('/login', async (req, res) => {
  try {
    const { usuario, clave } = req.body || {};
    if (!usuario || !clave) {
      return res.status(400).json({ error: 'Faltan credenciales' });
    }

    // permite login por usuario o email
    const user = await User.findOne({ $or: [{ usuario }, { email: usuario }] });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    // OJO: comparamos contra "user.pass"
    const ok = await bcrypt.compare(clave, user.pass);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const payload = { id: user._id, usuario: user.usuario, rol: user.rol };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    res.json({ ok: true, token, user: payload });
  } catch (e) {
    res.status(500).json({ error: 'Error en login' });
  }
});

// GET /auth/me  (opcional, útil para el front)
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const m = auth.match(/^Bearer (.+)$/);
    if (!m) return res.status(401).json({ ok: false, message: 'No autenticado' });

    const token = m[1];
    const data = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    res.json({ ok: true, user: data });
  } catch {
    res.status(401).json({ ok: false, message: 'No autenticado' });
  }
});

export default router;
