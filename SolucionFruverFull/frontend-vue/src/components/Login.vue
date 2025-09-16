<template>
  <div class="card" style="max-width:420px; margin:2rem auto">
    <h2>Iniciar sesión</h2>
    <form @submit.prevent="onSubmit" class="grid">
      <div><label>Usuario</label><input v-model="usuario" placeholder="usuario" /></div>
      <div><label>Clave</label><input type="password" v-model="clave" placeholder="clave" /></div>
      <div v-if="error" class="error">{{ error }}</div>
      <button :disabled="loading">{{ loading ? 'Ingresando...' : 'Entrar' }}</button>
    </form>
    <small class="mono">Se guarda el JWT en localStorage y cookie httpOnly enviada por el backend.</small>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api'

const usuario = ref('admin')
const clave = ref('admin')
const error = ref('')
const loading = ref(false)
const router = useRouter()

async function onSubmit(){
  loading.value = true; error.value = ''
  try { await login(usuario.value, clave.value); router.push('/') }
  catch(e){ error.value = e.message }
  finally { loading.value = false }
}
</script>