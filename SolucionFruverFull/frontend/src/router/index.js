// frontend/src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

import Caja from '../views/Caja.vue'
import Productos from '../pages/Products.vue'
import Proveedores from '../pages/Proveedores.vue'
import Ventas from '../views/Ventas.vue'
import CierreView from '../views/Cierre.vue'   // 👈 alias único
import Login from '../views/Login.vue'

// Admin
import AdminProducts from '../views/AdminProducts.vue'
import AdminUsers from '../views/AdminUsers.vue'

const routes = [
  { path: '/', redirect: '/caja' },

  // Reglas por rol:
  // - admin: todo
  // - cajero: Caja, Ventas, Cierre
  // - comprador: Productos, Proveedores
  { path: '/caja',      component: Caja,        meta: { requiresAuth: true, allowed: ['admin', 'cajero'] } },
  { path: '/ventas',    component: Ventas,      meta: { requiresAuth: true, allowed: ['admin', 'cajero'] } },
  { path: '/cierre',    component: CierreView,  meta: { requiresAuth: true, allowed: ['admin', 'cajero'] } },
  { path: '/products',  component: Productos,   meta: { requiresAuth: true, allowed: ['admin', 'comprador'] } },
  { path: '/providers', component: Proveedores, meta: { requiresAuth: true, allowed: ['admin', 'comprador'] } },

  { path: '/login', component: Login, meta: { requiresAuth: false } },

  // Solo admin
  { path: '/admin/products', component: AdminProducts, meta: { requiresAuth: true, allowed: ['admin'] } },
  { path: '/admin/usuarios', component: AdminUsers,    meta: { requiresAuth: true, allowed: ['admin'] } },

  // 404 → Caja
  { path: '/:pathMatch(.*)*', redirect: '/caja' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const API = (import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000')

router.beforeEach(async (to) => {
  if (to.meta?.requiresAuth === false) return true
  const token = localStorage.getItem('token') || ''
  if (!token) return { path: '/login', query: { r: to.fullPath } }

  let rol = localStorage.getItem('role') || localStorage.getItem('rol') || ''
  let usuario = localStorage.getItem('usuario') || localStorage.getItem('username') || ''

  if (!rol || !usuario) {
    try {
      const ac = new AbortController()
      const t = setTimeout(() => ac.abort(), 1500)
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ac.signal,
      })
      clearTimeout(t)
      const data = await res.json().catch(() => ({}))
      const u = data?.user || {}
      usuario = u.usuario || u.username || usuario
      rol     = u.rol || u.role || rol
      if (usuario) {
        localStorage.setItem('usuario', usuario)
        localStorage.setItem('username', usuario)
      }
      if (rol) {
        localStorage.setItem('rol', rol)
        localStorage.setItem('role', rol)
      }
    } catch {}
  }

  if (rol === 'admin' || usuario === 'admin') return true

  const allowed = to.meta?.allowed
  if (Array.isArray(allowed) && !allowed.includes(rol)) {
    return { path: '/caja', query: { denied: 1 } }
  }
  return true
})

export default router
