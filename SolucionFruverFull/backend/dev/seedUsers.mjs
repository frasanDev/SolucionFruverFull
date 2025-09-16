// backend/dev/seedUsers.mjs
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import UserNS from '../src/models/User.js';

// Compat ESM/CJS por si el modelo exporta default o named
const User = UserNS.default || UserNS;

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/solucionfruver';

async function main () {
  console.log('➡️  Conectando a', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado');

  // Limpia usuarios (solo para entorno de desarrollo)
  await User.deleteMany({});
  console.log('🧹 Usuarios borrados');

  // Hash por defecto
  const adminHash  = await bcrypt.hash('admin', 10);
  const cajeroHash = await bcrypt.hash('cajero', 10);

  // Crea admin y cajero
  await User.create([
    { usuario: 'admin',  pass: adminHash,  rol: 'admin',  email: 'admin@local' },
    { usuario: 'cajero', pass: cajeroHash, rol: 'cajero', email: 'cajero@local' },
  ]);

  const all = await User.find().lean();
  console.log('👤 Usuarios creados:', all.map(u => ({
    id: String(u._id),
    usuario: u.usuario,
    rol: u.rol
  })));

  await mongoose.disconnect();
  console.log('✅ Listo');
}

main().catch(err => {
  console.error('❌ Error en seedUsers:', err?.message || err);
  process.exit(1);
});
