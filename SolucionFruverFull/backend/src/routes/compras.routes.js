import { Router } from 'express'
import Purchase from '../models/Purchase.js'
import Product from '../models/Product.js'
import { requireAuth } from '../middlewares/auth.js'

const r = Router()
r.use(requireAuth)

// Listado con populate (para ver compras)
r.get('/', async (req, res) => {
  const items = await Purchase.find()
    .sort({ createdAt: -1 })
    .populate('proveedorId', 'nombre')
    .populate('productos.productoId', 'nombre')
  res.json(items)
})

// Crear compra + sumar stock
r.post('/', async (req, res) => {
  try {
    const { proveedorId, productos = [], observaciones = '' } = req.body || {}

    if (!proveedorId) return res.status(400).json({ error: 'proveedorId requerido' })
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'productos vacíos' })
    }

    // Validar items
    for (const it of productos) {
      if (!it?.productoId) return res.status(400).json({ error: 'productoId requerido' })
      if (!(Number(it.cantidad) > 0)) return res.status(400).json({ error: 'cantidad > 0 requerida' })
      if (!(Number(it.precioUnitario) >= 0)) return res.status(400).json({ error: 'precioUnitario >= 0 requerido' })
    }

    // Sumar stock
    for (const it of productos) {
      await Product.findByIdAndUpdate(
        it.productoId,
        { $inc: { stock: Number(it.cantidad) } },
        { new: false }
      )
    }

    // Total y persistencia
    const total = productos.reduce((acc, it) => acc + Number(it.cantidad) * Number(it.precioUnitario), 0)
    const doc = await Purchase.create({ proveedorId, productos, observaciones, total, usuarioId: req.user?.uid })
  // Incrementa stock por ítem de la compra

    res.status(201).json(doc)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'error creando compra' })
  }
})

export default r
