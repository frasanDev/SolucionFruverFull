import usuariosRoutes from './routes/usuarios.routes.js'

// backend/src/index.js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { connectDB } from './mongo.js'
import authRoutes from './routes/auth.routes.js'
import productoRoutes from './routes/productos.routes.js'
import proveedorRoutes from './routes/proveedores.routes.js'
import ventaRoutes from './routes/ventas.routes.js'
import compraRoutes from './routes/compras.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import './bootstrap/ventaSchemaPatch.js';




const app = express()

const origins = (process.env.CORS_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean)
app.use(cors({ origin: (origin, cb)=> cb(null, !origin || origins.includes(origin)), credentials: true }))

app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_,res)=> res.json({ ok: true }))

app.use('/auth', authRoutes)
app.use('/productos', productoRoutes)
app.use('/proveedores', proveedorRoutes)
app.use('/ventas', ventaRoutes)
app.use('/compras', compraRoutes)
app.use('/usuarios', usuariosRoutes)
app.use((err, req, res, next)=>{
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Error interno' })
})

const PORT = process.env.PORT || 3000
connectDB().then(()=>{
app.use('/dashboard', dashboardRoutes)
  app.listen(PORT, ()=> console.log('✅ Backend escuchando en puerto', PORT))
}).catch(err => {
  console.error('❌ No se pudo conectar a MongoDB', err)
  process.exit(1)
})



