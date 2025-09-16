import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectDB } from '../src/mongo.js'
import User from '../src/models/User.js'

async function main() {
  await connectDB()

  const usuario = 'cajero'
  const plain = 'cajero123'
  const hashed = await bcrypt.hash(plain, 10)

  const base = {}
  if ('usuario'     in User.schema.paths) base.usuario     = usuario
  if ('email'       in User.schema.paths) base.email       = 'cajero@demo.local'
  if ('correo'      in User.schema.paths) base.correo      = 'cajero@demo.local'
  if ('claveHash'   in User.schema.paths) base.claveHash   = hashed
  if ('password'    in User.schema.paths) base.password    = hashed
  if ('passwordHash'in User.schema.paths) base.passwordHash= hashed
  if ('nombre'      in User.schema.paths) base.nombre      = 'Cajero Demo'
  if ('role'        in User.schema.paths) base.role        = 'user'
  if ('rol'         in User.schema.paths) base.rol         = 'user'

  let user = await User.findOne({ $or: [{ usuario }, { email: base.email }, { correo: base.correo }] })
  if (user) {
    if ('role' in user) user.role = 'user'
    if ('rol'  in user) user.rol  = 'user'
    await user.save()
  } else {
    user = await User.create(base)
  }

  console.log(JSON.stringify({ ok:true, id:String(user._id), usuario: user.usuario ?? null, email: user.email ?? user.correo ?? null, pass: plain }))
  await mongoose.disconnect()
}
main().catch(async (e)=>{ console.error(e); await mongoose.disconnect(); process.exit(1) })
