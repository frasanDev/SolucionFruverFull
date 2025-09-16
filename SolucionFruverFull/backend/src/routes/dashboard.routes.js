import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import Sale from '../models/Sale.js'
import Purchase from '../models/Purchase.js'

const r = Router()
r.use(requireAuth)

function todayRangeUTC () {
  const d = new Date().toISOString().slice(0, 10) // YYYY-MM-DD en UTC
  return {
    start: new Date(`${d}T00:00:00.000Z`),
    end:   new Date(`${d}T23:59:59.999Z`)
  }
}

r.get('/resumen', async (req, res) => {
  const { start, end } = todayRangeUTC()

  const ventas = await Sale.find({ createdAt: { $gte: start, $lt: end } }).lean()
  const compras = await Purchase.find({ createdAt: { $gte: start, $lt: end } }).lean()

  const sum = (arr, pick) => arr.reduce((a, x) => a + Number(pick(x) || 0), 0)
  const ventasTotal  = sum(ventas,  v => v.total)
  const ventasItems  = sum(ventas,  v => (v.productos||[]).reduce((a,it)=>a+Number(it.cantidad||0),0))
  const comprasTotal = sum(compras, c => c.total)
  const comprasItems = sum(compras, c => (c.productos||[]).reduce((a,it)=>a+Number(it.cantidad||0),0))

  res.json({
    fecha: new Date().toISOString().slice(0,10),
    ventas: { count: ventas.length, total: ventasTotal, items: ventasItems },
    compras:{ count: compras.length, total: comprasTotal, items: comprasItems },
    neto: ventasTotal - comprasTotal
  })
})

r.get('/ultimos', async (req, res) => {
  try {
    const ventas = await Sale.find().sort({ createdAt: -1 }).limit(5)
      .populate('productos.productoId', 'nombre')
    const compras = await Purchase.find().sort({ createdAt: -1 }).limit(5)
      .populate('proveedorId', 'nombre')
      .populate('productos.productoId', 'nombre')
    res.json({ ventas, compras })
  } catch (e) {
    res.status(500).json({ error: 'error cargando ultimos' })
  }
})
export default r
