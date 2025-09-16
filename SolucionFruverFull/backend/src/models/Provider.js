import mongoose from 'mongoose'

const ProviderSchema = new mongoose.Schema({
  nombre:     { type: String, required: true, trim: true },
  contacto:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, trim: true, lowercase: true },
  direccion:  { type: String, required: true, trim: true },
  notas:      { type: String, required: true, trim: true },
  usuarioId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

export default mongoose.model('Provider', ProviderSchema)
