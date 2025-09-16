<template>
  <div class="card" style="max-width:420px;margin:40px auto;">
    <h2>Iniciar sesión</h2>

    <form @submit.prevent="login">
      <div class="row">
        <label>Usuario</label>
        <input v-model="form.usuario" class="input" placeholder="admin / cajero / comprador" />
      </div>

      <div class="row">
        <label>Clave</label>
        <input v-model="form.clave" type="password" class="input" placeholder="admin / cajero / comprador" />
      </div>

      <button class="btn" style="width:100%" :disabled="loading">
        {{ loading ? 'Ingresando…' : 'Entrar' }}
      </button>

      <p v-if="error" style="color:#b91c1c;margin-top:10px">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const form   = reactive({ usuario: '', clave: '' })
const loading = ref(false)
const error   = ref('')

const API = (import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000')

async function login () {
  error.value = ''
  loading.value = true
  try {
    // 1) Login → token
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.token) throw new Error(data.error || 'Error en login')
    // Guarda token
    localStorage.setItem('token', data.token)

    // 2) Consultar /auth/me → usuario/rol
    const meRes = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${data.token}` }
    })
    const me = await meRes.json().catch(() => ({}))
    if (!meRes.ok || !me?.user) throw new Error(me?.message || 'No se pudo leer el perfil')

    const u = me.user
    const usuario = u.usuario || u.username || ''
    const rol     = u.rol || u.role || ''

    // Persistir ambos nombres de clave para compatibilidad
    localStorage.setItem('usuario', usuario)
    localStorage.setItem('username', usuario)
    localStorage.setItem('rol', rol)
    localStorage.setItem('role', rol)

    // Avisar al layout (mismo tab + otras pestañas)
    window.dispatchEvent(new CustomEvent('auth-changed'))
    window.dispatchEvent(new StorageEvent('storage', { key: 'token' }))

    // 3) Redirección según rol
    if (rol === 'admin') {
      router.push('/admin/usuarios')
    } else if (rol === 'cajero') {
      router.push('/caja')
    } else if (rol === 'comprador') {
      router.push('/providers')
    } else {
      router.push('/caja')
    }
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }
.input { padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; width: 100%; }
.row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.btn { background: #3b82f6; color: white; border: none; padding: 10px 12px; border-radius: 8px; cursor: pointer; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
</style>
