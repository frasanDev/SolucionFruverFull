// backend/src/bootstrap/ventaSchemaPatch.js
import mongoose from 'mongoose';
import Venta from '../models/Venta.model.js';

const schema = Venta.schema;

if (!schema.path('anulada')) {
  schema.add({
    anulada: { type: Boolean, default: false },
    anuladoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    anuladoAt: { type: Date, default: null },
    motivoAnulacion: { type: String, default: '' },
  });
  console.log('ℹ️ Venta.schema patched: campos de anulación agregados');
}

