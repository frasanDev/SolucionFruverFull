import 'dotenv/config'
import mongoose from 'mongoose'
import Venta from '../src/models/Venta.model.js'
import { connectDB } from '../src/mongo.js'

async function main() {
  await connectDB()
  const res = await Venta.updateMany(
    { $or: [ { anulada: { $exists: false } }, { anulada: null } ] },
    { $set: { anulada: false, anuladoPor: null, anuladoAt: null, motivoAnulacion: '' } }
  )
  console.log(JSON.stringify({ ok: true, matched: res.matchedCount ?? res.n, modified: res.modifiedCount ?? res.nModified }))
  await mongoose.disconnect()
}
main().catch(async (e) => { console.error(e); await mongoose.disconnect(); process.exit(1) })
