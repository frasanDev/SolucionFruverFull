// backend/src/mongo.js

import mongoose from 'mongoose'

export async function connectDB(){
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('Falta MONGO_URI')
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  console.log('✅ Conectado a MongoDB')
}
