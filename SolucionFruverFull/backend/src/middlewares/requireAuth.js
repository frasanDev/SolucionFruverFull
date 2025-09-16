// backend/src/middlewares/requireAuth.js
import jwt from 'jsonwebtoken';

export default function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!token) return res.status(401).json({ ok: false, message: 'No autenticado' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'clave-super-secreta');

    // Primero el payload crudo y al final las claves normalizadas (prevalecen)
    req.user = {
      ...payload,
      id:       payload.id || payload._id || payload.uid || payload.sub || payload.userId || null,
      usuario:  payload.usuario || payload.username || payload.user || null,
      rol:      payload.rol || payload.role || null,
    };

    return next();
  } catch {
    return res.status(401).json({ ok: false, message: 'No autenticado' });
  }
}
