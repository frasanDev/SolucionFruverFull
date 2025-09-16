import mongoose from 'mongoose'
const saleItemSchema = new mongoose.Schema({
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  cantidad: { type: Number, required: true },
  unidad: { type: String, default: 'unidad' },
  precioUnitario: { type: Number, required: true }
}, { _id: false })

const saleSchema = new mongoose.Schema({
  productos: [saleItemSchema],
  metodoPago: { type: String, default: 'efectivo' },
  observaciones: String,
  total: Number,
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

export default mongoose.model('Sale', saleSchema)
