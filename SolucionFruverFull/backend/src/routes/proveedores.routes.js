// backend/src/routes/proveedores.routes.js
import { Router } from 'express'
import Provider from '../models/Provider.js'

// 🔐 Middlewares
import requireAuth from '../middlewares/requireAuth.js'
import requireAdmin from '../middlewares/requireAdmin.js'
import requireRole from '../middlewares/requireRole.js'

const router = Router()

// --- Acceso ---
// 1) Toda la ruta requiere estar autenticado
router.use(requireAuth)

// 2) Lecturas: admin/cajero/comprador | Escrituras: solo admin
router.use((req, res, next) => {
  const m = req.method
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') {
    return requireRole('admin', 'cajero', 'comprador')(req, res, next)
  }
  return requireAdmin(req, res, next)
})

/**
 * GET /proveedores?page=&limit=&q=
 * Lista con paginación y búsqueda por nombre/email/nit
 */
router.get('/', async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100)
    const q     = (req.query.q || '').trim()

    const filter = {}
    if (q) {
      filter.$or = [
        { nombre: { $regex: q, $options: 'i' } },
        { email:  { $regex: q, $options: 'i' } },
        { nit:    { $regex: q, $options: 'i' } },
      ]
    }

    const total = await Provider.countDocuments(filter)
    const items = await Provider.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const pages = Math.max(Math.ceil(total / limit), 1)
    res.json({ items, total, page, pages, limit })
  } catch (e) {
    res.status(500).json({ error: 'Error listando proveedores' })
  }
})

/**
 * GET /proveedores/:id
 * Obtiene un proveedor
 */
router.get('/:id', async (req, res) => {
  try {
    const it = await Provider.findById(req.params.id)
    if (!it) return res.status(404).json({ error: 'No encontrado' })
    res.json(it)
  } catch {
    res.status(400).json({ error: 'Solicitud inválida' })
  }
})

/**
 * POST /proveedores
 * Crea proveedor (solo admin)
 */
router.post('/', async (req, res) => {
  try {
    const { nombre } = req.body
    if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' })

    const it = await Provider.create(req.body)
    res.status(201).json(it)
  } catch (e) {
    res.status(400).json({ error: 'No se pudo crear el proveedor' })
  }
})

/**
 * PUT /proveedores/:id
 * Actualiza proveedor (solo admin)
 */
router.put('/:id', async (req, res) => {
  try {
    const it = await Provider.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!it) return res.status(404).json({ error: 'No encontrado' })
    res.json(it)
  } catch {
    res.status(400).json({ error: 'No se pudo actualizar' })
  }
})

/**
 * DELETE /proveedores/:id
 * Elimina proveedor (solo admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const out = await Provider.findByIdAndDelete(req.params.id)
    if (!out) return res.status(404).json({ error: 'No encontrado' })
    res.json({ ok: true })
  } catch {
    res.status(400).json({ error: 'No se pudo eliminar' })
  }
})

export default router


