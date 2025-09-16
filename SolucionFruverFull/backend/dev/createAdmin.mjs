import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const candidates = [
  '../src/models/User.js',
  '../src/models/Users.js',
  '../src/models/Usuario.js',
  '../src/models/Usuarios.js',
  '../src/models/user.js',
  '../src/models/user.model.js',
];

let User=null, usedPath=null;
for (const p of candidates) {
  try { const mod = await import(p); User = mod.default || mod; usedPath=p; break; } catch {}
}
if (!User) { console.error('Modelo de usuario no encontrado'); process.exit(1); }

await mongoose.connect(process.env.MONGO_URI);

const adminUsuario = 'admin';
const adminEmail   = 'admin@demo.com';
const plain        = 'admin123';
const hashed       = await bcrypt.hash(plain, 10);

const doc = {};
if (User.schema?.paths?.usuario)   doc.usuario   = adminUsuario;
if (User.schema?.paths?.email)     doc.email     = adminEmail;
if (User.schema?.paths?.correo)    doc.correo    = adminEmail;
if (User.schema?.paths?.nombre)    doc.nombre    = 'Admin Demo';
if (User.schema?.paths?.role)      doc.role      = 'admin';
if (User.schema?.paths?.rol)       doc.rol       = 'admin';
if (User.schema?.paths?.password)  doc.password  = hashed;
if (User.schema?.paths?.claveHash) doc.claveHash = hashed;

let user = await User.findOne({ 
  $or: [
    ...(User.schema?.paths?.usuario ? [{usuario: adminUsuario}] : []),
    ...(User.schema?.paths?.email   ? [{email: adminEmail}]   : []),
    ...(User.schema?.paths?.correo  ? [{correo: adminEmail}]  : []),
  ]
});

if (user) {
  if ('password'  in user) user.password  = hashed;
  if ('claveHash' in user) user.claveHash = hashed;
  if ('role'      in user) user.role      = 'admin';
  if ('rol'       in user) user.rol       = 'admin';
  await user.save();
} else {
  user = await User.create(doc);
}

console.log('✅ Admin listo', { id: String(user._id), modelPath: usedPath, usuario: user.usuario ?? null, email: user.email ?? user.correo ?? null, pass: plain });
await mongoose.disconnect();
process.exit(0);
