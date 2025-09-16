// backend/src/middlewares/requireAdmin.js
export default function requireAdmin(req, res, next) {
  try {
    const role = req.user?.rol ?? req.user?.role;
    const user = req.user?.usuario ?? req.user?.username;
    if (role === 'admin' || user === 'admin') return next();
    return res.status(403).json({ ok: false, message: 'Solo administradores' });
  } catch {
    return res.status(403).json({ ok: false, message: 'Solo administradores' });
  }
}

export { requireAdmin };