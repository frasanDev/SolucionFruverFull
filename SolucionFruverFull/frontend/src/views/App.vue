<template>
  <div class="min-h-screen bg-slate-50 text-slate-800">
    <!-- NAV -->
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <nav class="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
        <div class="font-semibold">Solución Fruver</div>

        <!-- Links por rol -->
        <router-link v-if="canCaja" class="navlink" to="/caja">Caja</router-link>
        <router-link v-if="canVentas" class="navlink" to="/ventas">Ventas</router-link>
        <router-link v-if="canCierre" class="navlink" to="/cierre">Cierre</router-link>
        <router-link v-if="canProductos" class="navlink" to="/products">Productos</router-link>
        <router-link v-if="canProveedores" class="navlink" to="/providers">Proveedores</router-link>

        <span class="flex-1"></span>

        <!-- Solo admin -->
        <template v-if="isAdmin">
          <router-link class="navlink !text-amber-700" to="/admin/products" title="Administración de productos">
            Admin · Productos
          </router-link>
          <router-link class="navlink !text-amber-700" to="/admin/usuarios" title="Administración de usuarios">
            Admin · Usuarios
          </router-link>
        </template>

        <!-- Sesión -->
        <router-link v-if="!isLogged" class="btn" to="/login">Ingresar</router-link>
        <button v-else class="btn danger" @click="logout">Salir ({{ username }})</button>
      </nav>
    </header>

    <!-- CONTENIDO -->
    <main class="mx-auto max-w-6xl px-4 py-4">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Estado de sesión derivado de LocalStorage con sincronización entre pestañas
const isLogged = ref(!!localStorage.getItem('token'))
const rol = ref(localStorage.getItem('rol') || localStorage.getItem('role') || '')
const username = ref(localStorage.getItem('usuario') || localStorage.getItem('username') || '')

function syncAuthState () {
  isLogged.value = !!localStorage.getItem('token')
  rol.value = localStorage.getItem('rol') || localStorage.getItem('role') || ''
  username.value = localStorage.getItem('usuario') || localStorage.getItem('username') || ''
}

const isAdmin       = computed(() => rol.value === 'admin' || username.value === 'admin')

// Permisos de navegación (coherentes con meta.allowed del router)
const canCaja        = computed(() => isAdmin.value || rol.value === 'cajero')
const canVentas      = computed(() => isAdmin.value || rol.value === 'cajero')
const canCierre      = computed(() => isAdmin.value || rol.value === 'cajero')
const canProductos   = computed(() => isAdmin.value || rol.value === 'comprador')
const canProveedores = computed(() => isAdmin.value || rol.value === 'comprador')

function logout () {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('rol')
    localStorage.removeItem('usuario')
    localStorage.removeItem('username')
    syncAuthState()
    // Aviso a otras pestañas
    window.dispatchEvent(new StorageEvent('storage', { key: 'token' }))
  } catch {}
  router.push('/login')
}

onMounted(() => {
  window.addEventListener('storage', syncAuthState)
})
onBeforeUnmount(() => {
  window.removeEventListener('storage', syncAuthState)
})
</script>

<style scoped>
.navlink {
  padding: 6px 10px;
  border-radius: 8px;
  text-decoration: none;
  color: #0f172a;
  transition: background .15s ease;
}
.navlink:hover { background: #eef2ff; }
.router-link-exact-active.navlink { background: #e2e8f0; }

.btn {
  padding: 6px 10px;
  border-radius: 8px;
  background: #10b981;
  color: white;
  border: none;
}
.btn:hover { filter: brightness(0.95); }
.btn.danger { background: #ef4444; }
</style>
