import mongoose from 'mongoose'
const productSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  proveedorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', default: null },
  unidadBase: { type: String, default: 'unidad' }
}, { timestamps: true })
export default mongoose.model('Product', productSchema)
