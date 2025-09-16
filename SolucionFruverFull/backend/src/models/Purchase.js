import mongoose from 'mongoose'
const purchaseItemSchema = new mongoose.Schema({
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  cantidad: { type: Number, required: true },
  unidad: { type: String, default: 'unidad' },
  precioUnitario: { type: Number, required: true }
}, { _id: false })

const purchaseSchema = new mongoose.Schema({
  proveedorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  productos: [purchaseItemSchema],
  observaciones: String,
  total: Number,
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

export default mongoose.model('Purchase', purchaseSchema)
