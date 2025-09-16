// backend/src/controllers/usuarios.controller.js
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

// Normaliza la salida (sin pass)
function pickUser(u) {
  if (!u) return null
  const o = u.toObject ? u.toObject() : u
  return {
    _id: o._id,
    usuario: o.usuario,
    email: o.email || null,
    rol: o.rol || null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

// GET /usuarios
export async function listarUsuarios(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page || 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)))
    const q = (req.query.q || '').trim()

    const where = {}
    if (q) {
      where.$or = [
        { usuario: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { rol: new RegExp(q, 'i') },
      ]
    }

    const [items, total] = await Promise.all([
      User.find(where).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(where),
    ])

    res.json({ ok: true, total, page, pages: Math.max(1, Math.ceil(total / limit)), items: items.map(pickUser) })
  } catch (e) {
    res.status(400).json({ ok: false, message: 'Error listando usuarios' })
  }
}

// GET /usuarios/:id
export async function obtenerUsuario(req, res) {
  try {
    const u = await User.findById(req.params.id)
    if (!u) return res.status(404).json({ ok: false, message: 'No encontrado' })
    res.json({ ok: true, user: pickUser(u) })
  } catch {
    res.status(400).json({ ok: false, message: 'Error obteniendo usuario' })
  }
}

// POST /usuarios
export async function crearUsuario(req, res) {
  try {
    const { usuario, pass, email, rol } = req.body || {}
    if (!usuario || !pass) return res.status(400).json({ ok: false, message: 'usuario y pass requeridos' })

    const exists = await User.findOne({ usuario })
    if (exists) return res.status(409).json({ ok: false, message: 'Usuario ya existe' })

    const hash = await bcrypt.hash(String(pass), 10)
    const nuevo = await User.create({ usuario, pass: hash, email: email || null, rol: rol || 'cajero' })
    res.status(201).json({ ok: true, user: pickUser(nuevo) })
  } catch (e) {
    res.status(400).json({ ok: false, message: 'Error creando usuario' })
  }
}

// PUT /usuarios/:id
export async function actualizarUsuario(req, res) {
  try {
    const { id } = req.params
    const { usuario, email, rol, pass } = req.body || {}

    const $set = {}
    if (usuario) $set.usuario = String(usuario)
    if (email !== undefined) $set.email = email || null
    if (rol) $set.rol = String(rol)

    // Soporte para reset/cambio de contraseña
    if (pass) {
      const hash = await bcrypt.hash(String(pass), 10)
      $set.pass = hash
    }

    if (Object.keys($set).length === 0) {
      return res.status(400).json({ ok: false, message: 'Nada para actualizar' })
    }

    const upd = await User.findByIdAndUpdate(id, { $set }, { new: true })
    if (!upd) return res.status(404).json({ ok: false, message: 'No encontrado' })

    res.json({ ok: true, user: pickUser(upd) })
  } catch {
    res.status(400).json({ ok: false, message: 'Error actualizando usuario' })
  }
}

// DELETE /usuarios/:id
export async function eliminarUsuario(req, res) {
  try {
    const { id } = req.params
    // Evitar auto-eliminarse
    if (String(req.user?.id || req.user?._id || '') === String(id)) {
      return res.status(400).json({ ok: false, message: 'No puede eliminar su propio usuario' })
    }
    const del = await User.findByIdAndDelete(id)
    if (!del) return res.status(404).json({ ok: false, message: 'No encontrado' })
    res.json({ ok: true, deleted: pickUser(del) })
  } catch {
    res.status(400).json({ ok: false, message: 'Error eliminando' })
  }
}
