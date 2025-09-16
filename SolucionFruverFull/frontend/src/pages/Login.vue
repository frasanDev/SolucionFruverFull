<template>
  <div class="card" style="max-width:420px;margin:40px auto;">
    <h2>Iniciar sesión</h2>

    <form @submit.prevent="login">
      <div class="row">
        <label>Usuario</label>
        <input v-model="form.usuario" class="input" placeholder="admin" />
      </div>

      <div class="row">
        <label>Clave</label>
        <input v-model="form.clave" type="password" class="input" placeholder="admin" />
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
const form   = reactive({ usuario: 'admin', clave: 'admin' })
const loading = ref(false)
const error   = ref('')

// Backend local si el front corre en 5174; mismo host en otros casos
const API = (location.hostname === 'localhost' && location.port === '5174')
  ? 'http://localhost:3000'
  : ''

async function login () {
  error.value = ''
  loading.value = true
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (!res.ok || !data.token) throw new Error(data.error || 'Login falló')
    localStorage.setItem('token', data.token)
    router.push('/proveedores')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
