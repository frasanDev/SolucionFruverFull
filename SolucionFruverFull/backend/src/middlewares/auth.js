import jwt from 'jsonwebtoken'

export function signToken(payload){
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
}

export function requireAuth(req, res, next){
  try {
    const bearer = req.headers.authorization?.replace('Bearer ', '')
    const token = bearer || req.cookies?.token
    if (!token) return res.status(401).json({ error: 'No autorizado' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    req.user = decoded
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}
