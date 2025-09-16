import mongoose from 'mongoose';

const ventaItemSchema = new mongoose.Schema(
  {
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    nombre: { type: String, required: true },
    unidad: { type: String, required: true },          // 'kg' | 'lb' | 'unidad' | 'caja' | 'pack'
    precioBaseKg: { type: Number, default: 0 },
    precioUnitario: { type: Number, required: true },
    cantidadIngresada: { type: Number, required: true },
    unidadIngresada: { type: String, required: true }, // 'kg' | 'lb' | 'unit' | 'pack'
    cantidadKg: { type: Number, default: 0 },
    totalItem: { type: Number, required: true },
  },
  { _id: false }
);

const ventaSchema = new mongoose.Schema(
  {
    factura: { type: Number, index: true, required: true },
    cajero: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: { type: [ventaItemSchema], required: true },
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    efectivo: { type: Number, default: 0 },
    cambio: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Venta', ventaSchema);
