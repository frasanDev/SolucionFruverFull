<!-- frontend/src/views/AdminUsers.vue -->
<template>
  <div class="page">
    <h2>Admin · Usuarios</h2>

    <div v-if="error" class="alert">{{ error }}</div>

    <!-- Crear usuario -->
    <div class="card">
      <h3>Nuevo usuario</h3>
      <form @submit.prevent="crear">
        <div class="grid">
          <div class="row">
            <label>Usuario *</label>
            <input v-model="form.usuario" class="input" placeholder="usuario" required />
          </div>
          <div class="row">
            <label>Email</label>
            <input v-model="form.email" class="input" placeholder="correo@dominio" />
          </div>
          <div class="row">
            <label>Rol *</label>
            <select v-model="form.rol" class="input" required>
              <option disabled value="">Seleccione…</option>
              <option value="admin">admin</option>
              <option value="cajero">cajero</option>
              <option value="comprador">comprador</option>
            </select>
          </div>
          <div class="row">
            <label>Clave *</label>
            <input v-model="form.pass" type="password" class="input" placeholder="••••••" required />
          </div>
        </div>
        <button class="btn" :disabled="cargando">Crear</button>
      </form>
    </div>

    <!-- Filtros -->
    <div class="toolbar">
      <input v-model="busqueda" class="input" placeholder="Buscar por usuario, email o rol" />
      <button class="btn" @click="cargar">Recargar</button>
      <span class="spacer" />
      <span class="muted">Total: {{ total }}</span>
    </div>

    <!-- Listado -->
    <div class="card">
      <h3>Listado</h3>
      <div v-if="cargando">Cargando...</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th style="width:220px">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filtrados" :key="u._id">
            <template v-if="editId === u._id">
              <td><input v-model="editForm.usuario" class="input" /></td>
              <td><input v-model="editForm.email" class="input" /></td>
              <td>
                <select v-model="editForm.rol" class="input">
                  <option value="admin">admin</option>
                  <option value="cajero">cajero</option>
                  <option value="comprador">comprador</option>
                </select>
              </td>
              <td class="actions">
                <button class="btn" @click="guardar(u._id)">Guardar</button>
                <button class="btn danger" @click="cancelar">Cancelar</button>
              </td>
            </template>
            <template v-else>
              <td>{{ u.usuario }}</td>
              <td>{{ u.email || '—' }}</td>
              <td><span class="pill">{{ u.rol }}</span></td>
              <td class="actions">
                <button class="btn" @click="editar(u)">Editar</button>
                <button class="btn danger" @click="eliminar(u._id)" :disabled="u.usuario==='admin'">Eliminar</button>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
      <div v-if="!cargando && items.length === 0" class="muted">Sin usuarios</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { get, post, put, del } from '../services/api.js'

const items = ref([])
const total = ref(0)
const cargando = ref(false)
const error = ref('')

const busqueda = ref('')

const form = ref({ usuario: '', email: '', rol: '', pass: '' })

const editId = ref(null)
const editForm = ref({})

// Cargar usuarios
async function cargar () {
  cargando.value = true
  error.value = ''
  try {
    const data = await get('/usuarios?limit=100')
    items.value = data.items || []
    total.value = data.total ?? items.value.length
  } catch (e) {
    error.value = e.message || 'Error cargando usuarios'
  } finally {
    cargando.value = false
  }
}

async function crear () {
  error.value = ''
  try {
    const nuevo = await post('/usuarios', form.value) // {usuario, email, rol, pass}
    // API devuelve { ok:true, user:{...} } — normalizamos
    const u = nuevo.user || nuevo
    items.value.unshift(u)
    total.value++
    form.value = { usuario: '', email: '', rol: '', pass: '' }
  } catch (e) {
    error.value = e.message || 'No pude crear usuario'
  }
}

function editar (u) {
  editId.value = u._id
  editForm.value = {
    usuario: u.usuario || '',
    email: u.email || '',
    rol: u.rol || 'cajero',
    // pass opcional en edición: no se envía si va vacío
    pass: ''
  }
}

function cancelar () {
  editId.value = null
  editForm.value = {}
}

async function guardar (id) {
  try {
    // No enviar pass si el admin no escribió una nueva
    const payload = { ...editForm.value }
    if (!payload.pass) delete payload.pass
    const upd = await put(`/usuarios/${id}`, payload)
    // API devuelve { ok:true, user:{...} } — normalizamos
    const u = upd.user || upd
    const i = items.value.findIndex(x => x._id === id)
    if (i >= 0) items.value[i] = u
    cancelar()
  } catch (e) {
    error.value = e.message || 'No pude guardar cambios'
  }
}

async function eliminar (id) {
  if (!confirm('¿Eliminar usuario?')) return
  try {
    await del(`/usuarios/${id}`)
    items.value = items.value.filter(x => x._id !== id)
    total.value = Math.max(0, total.value - 1)
  } catch (e) {
    error.value = e.message || 'No pude eliminar'
  }
}

// Filtro local
const filtrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(u =>
    (u.usuario || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q) ||
    (u.rol || '').toLowerCase().includes(q)
  )
})

onMounted(cargar)
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 900px){ .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px){ .grid { grid-template-columns: 1fr; } }

.card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; background: #fff; }
.input { padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; width: 100%; }
.row { display: flex; flex-direction: column; gap: 6px; }

.btn { background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
.btn:hover { filter: brightness(0.95); }
.btn.danger { background: #ef4444; }

.toolbar { display: flex; gap: 8px; align-items: center; }
.spacer { flex: 1; }
.muted { color: #6b7280; padding: 0 8px; }

.table { width: 100%; border-collapse: collapse; }
.table th, .table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
.table th { background: #f9fafb; }
.actions { display: flex; gap: 8px; }

.pill { background: #e5e7eb; padding: 2px 8px; border-radius: 999px; font-size: 12px; }
.alert { background: #fee2e2; color: #991b1b; padding: 8px 10px; border-radius: 6px; }
</style>
