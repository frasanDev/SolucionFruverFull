// backend/src/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    usuario: { type: String, required: true, unique: true, trim: true },
    email:   { type: String, default: null, trim: true },
    // Hash de contraseña (bcrypt). IMPORTANTE: el campo se llama "pass"
    pass:    { type: String, required: true },

    // Rol simple para permisos
    rol:     { type: String, enum: ['admin', 'cajero', 'comprador'], default: 'cajero' }
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);

