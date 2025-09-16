// backend/src/routes/productos.routes.js
import { Router } from 'express'
import Product from '../models/Product.js'

// Middlewares
import requireAuth from '../middlewares/requireAuth.js'
import requireAdmin from '../middlewares/requireAdmin.js'
import requireRole from '../middlewares/requireRole.js'

const router = Router()

/**
 * GET /productos?page=&limit=&q=&proveedorId=
 * Lectura: admin, cajero o comprador
 */
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'cajero', 'comprador'),
  async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1)
      const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100)
      const q = (req.query.q || '').trim()
      const proveedorId = req.query.proveedorId || null

      const filter = {}
      if (q) filter.$or = [{ nombre: { $regex: q, $options: 'i' } }]
      if (proveedorId) filter.proveedorId = proveedorId

      const total = await Product.countDocuments(filter)
      const items = await Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('proveedorId', 'nombre')

      const pages = Math.max(Math.ceil(total / limit), 1)
      res.json({ items, total, page, pages, limit })
    } catch (e) {
      res.status(500).json({ error: 'Error listando productos' })
    }
  }
)

/**
 * POST /productos
 * Crear: SOLO admin
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      nombre,
      precio,
      stock = 0,
      unidadBase = 'unidad',
      proveedorId = null,
    } = req.body

    if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' })

    const item = await Product.create({
      nombre,
      precio,
      stock,
      unidadBase,
      proveedorId,
    })
    res.status(201).json(item)
  } catch (e) {
    res.status(400).json({ error: 'No se pudo crear el producto' })
  }
})

/**
 * PUT /productos/:id
 * Actualizar: SOLO admin
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const item = await Product.findByIdAndUpdate(id, req.body, { new: true })
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json(item)
  } catch (e) {
    res.status(400).json({ error: 'No se pudo actualizar' })
  }
})

/**
 * DELETE /productos/:id
 * Eliminar: SOLO admin
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const out = await Product.findByIdAndDelete(id)
    if (!out) return res.status(404).json({ error: 'No encontrado' })
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: 'No se pudo eliminar' })
  }
})

export default router
