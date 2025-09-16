// backend/src/middlewares/requireRole.js
function requireRole(...allowed) {
  return (req, res, next) => {
    try {
      const u = req.user || {};
      const role = (u.rol || u.role || '').toLowerCase();
      const username = (u.usuario || u.username || '').toLowerCase();

      // Admin siempre pasa
      if (role === 'admin' || username === 'admin') return next();

      // Si no se pasaron roles, bloquear
      if (!allowed || allowed.length === 0) {
        return res.status(403).json({ ok: false, message: 'No autorizado' });
      }

      const allowSet = allowed.map(r => String(r).toLowerCase());
      if (allowSet.includes(role)) return next();

      return res
        .status(403)
        .json({ ok: false, message: `No autorizado (requiere: ${allowSet.join(', ')})` });
    } catch {
      return res.status(403).json({ ok: false, message: 'No autorizado' });
    }
  };
}

export default requireRole;
export { requireRole };
