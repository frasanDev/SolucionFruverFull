<template>
  <div class="page">
    <h2>Proveedores</h2>

    <div v-if="error" class="alert">{{ error }}</div>

    <div class="grid-2">
      <!-- Columna izquierda: CRUD de proveedores -->
      <div class="col">
        <div class="card">
          <h3>Nuevo proveedor</h3>
          <form @submit.prevent="crear">
            <div class="grid">
              <div class="row">
                <label>Nombre *</label>
                <input v-model="form.nombre" class="input" required placeholder="Nombre del proveedor" />
              </div>
              <div class="row">
                <label>Contacto</label>
                <input v-model="form.contacto" class="input" placeholder="Persona / Teléfono" />
              </div>
              <div class="row">
                <label>Email</label>
                <input v-model="form.email" class="input" placeholder="correo@ejemplo.com" />
              </div>
              <div class="row">
                <label>Dirección</label>
                <input v-model="form.direccion" class="input" placeholder="Calle 123" />
              </div>
              <div class="row" style="grid-column: 1 / -1;">
                <label>Notas</label>
                <textarea v-model="form.notas" class="input" rows="2" placeholder="Notas internas"></textarea>
              </div>
            </div>
            <button class="btn" :disabled="cargando">Crear</button>
          </form>
        </div>

        <div class="toolbar">
          <input v-model="busqueda" class="input" placeholder="Buscar por nombre o contacto" />
          <button class="btn" @click="page=1; cargar()">Buscar</button>

          <select v-model="limit" class="input" style="max-width:120px" @change="page=1; cargar()">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>

          <div class="spacer" />

          <button class="btn" :disabled="page<=1 || cargando" @click="page--; cargar()">« Anterior</button>
          <span class="muted">Página {{ page }} / {{ pages }}</span>
          <button class="btn" :disabled="page>=pages || cargando" @click="page++; cargar()">Siguiente »</button>
        </div>

        <div class="card">
          <h3>Listado</h3>
          <div v-if="cargando">Cargando...</div>
          <table v-else class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Email</th>
                <th>Dirección</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in items" :key="p._id" :class="{ selected: selectedId===p._id }">
                <template v-if="editId === p._id">
                  <td><input v-model="editForm.nombre" class="input" /></td>
                  <td><input v-model="editForm.contacto" class="input" /></td>
                  <td><input v-model="editForm.email" class="input" /></td>
                  <td><input v-model="editForm.direccion" class="input" /></td>
                  <td style="white-space:nowrap;">
                    <button class="btn" @click="guardarEdicion(p._id)">Guardar</button>
                    <button class="btn danger" @click="cancelarEdicion">Cancelar</button>
                  </td>
                </template>
                <template v-else>
                  <td>{{ p.nombre }}</td>
                  <td>{{ p.contacto || '' }}</td>
                  <td>{{ p.email || '' }}</td>
                  <td>{{ p.direccion || '' }}</td>
                  <td style="white-space:nowrap;">
                    <button class="btn" @click="editar(p)">Editar</button>
                    <button class="btn" @click="verProductos(p)">Productos</button>
                    <button class="btn danger" @click="eliminar(p._id)">Eliminar</button>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
          <div v-if="!cargando && items.length === 0" class="muted">Sin resultados</div>
          <div class="muted" style="margin-top:8px;">Total: {{ total }}</div>
        </div>
      </div>

      <!-- Columna derecha: productos del proveedor seleccionado -->
      <div class="col">
        <div class="card" v-if="selectedId">
          <h3>
            Productos de: <span class="muted">{{ selectedNombre }}</span>
            <span class="muted" v-if="cargandoProd" style="font-weight:normal;">(cargando…)</span>
          </h3>
          <div v-if="errorProd" class="alert">{{ errorProd }}</div>
          <div v-if="!cargandoProd && productosProv.length===0" class="muted">Este proveedor no tiene productos.</div>

          <table v-if="!cargandoProd && productosProv.length" class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th style="text-align:right;">Precio</th>
                <th style="text-align:right;">Stock</th>
                <th>Unidad</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pr in productosProv" :key="pr._id">
                <td>{{ pr.nombre }}</td>
                <td style="text-align:right;">{{ formatMoney(pr.precio) }}</td>
                <td style="text-align:right;">{{ pr.stock ?? 0 }}</td>
                <td>{{ pr.unidadBase || pr.unidad || '' }}</td>
              </tr>
            </tbody>
          </table>

          <div class="muted" style="margin-top:8px;">Total productos: {{ productosProv.length }}</div>
        </div>
        <div class="card" v-else>
          <h3>Productos del proveedor</h3>
          <div class="muted">Selecciona un proveedor y pulsa <b>Productos</b> para ver su inventario.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/,'')
const token = localStorage.getItem('token') || ''

// estados proveedores (CRUD)
const form = ref({ nombre:'', contacto:'', email:'', direccion:'', notas:'' })
const items = ref([])
const error = ref('')
const cargando = ref(false)
const busqueda = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const pages = ref(1)

const editId = ref(null)
const editForm = ref({})

// selección para panel de productos
const selectedId = ref('')
const selectedNombre = ref('')
const productosProv = ref([])
const cargandoProd = ref(false)
const errorProd = ref('')

// helpers
function formatMoney(v){
  const n = Number(v || 0)
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// cargar proveedores
async function cargar () {
  cargando.value = true
  error.value = ''
  try {
    const params = new URLSearchParams()
    params.set('page', String(page.value))
    params.set('limit', String(limit.value))
    const q = busqueda.value.trim()
    if (q) params.set('q', q)

    const res = await fetch(`${API}/proveedores?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    items.value = data.items || data || []
    total.value = data.total ?? items.value.length
    pages.value = data.pages ?? 1
  } catch (e) {
    error.value = String(e.message || e)
  } finally {
    cargando.value = false
  }
}

// crear proveedor
async function crear () {
  error.value = ''
  try {
    const res = await fetch(`${API}/proveedores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form.value)
    })
    if (!res.ok) throw new Error(await res.text())
    const nuevo = await res.json()
    items.value.unshift(nuevo)
    total.value++
    form.value = { nombre:'', contacto:'', email:'', direccion:'', notas:'' }
  } catch (e) {
    error.value = 'No pude crear proveedor: ' + (e.message || e)
  }
}

// eliminar proveedor
async function eliminar (id) {
  if (!confirm('Eliminar proveedor?')) return
  try {
    const res = await fetch(`${API}/proveedores/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error(await res.text())
    items.value = items.value.filter(x => x._id !== id)
    total.value = Math.max(0, total.value - 1)

    // si estaba seleccionado, limpiar panel derecho
    if (selectedId.value === id) {
      selectedId.value = ''
      selectedNombre.value = ''
      productosProv.value = []
    }
  } catch (e) {
    alert('Error al eliminar: ' + (e.message || e))
  }
}

// editar proveedor
function editar (p) {
  editId.value = p._id
  editForm.value = {
    nombre: p.nombre || '',
    contacto: p.contacto || '',
    email: p.email || '',
    direccion: p.direccion || '',
    notas: p.notas || ''
  }
}

function cancelarEdicion(){
  editId.value = null
  editForm.value = {}
}

async function guardarEdicion (id) {
  try {
    const res = await fetch(`${API}/proveedores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm.value)
    })
    if (!res.ok) throw new Error(await res.text())
    const upd = await res.json()
    const i = items.value.findIndex(x => x._id === id)
    if (i >= 0) items.value[i] = upd
    cancelarEdicion()

    // refresca panel derecho si este proveedor estaba seleccionado
    if (selectedId.value === id) {
      selectedNombre.value = upd.nombre || selectedNombre.value
      await cargarProductosProveedor(id)
    }
  } catch (e) {
    alert('Error al guardar: ' + (e.message || e))
  }
}

// panel derecho: cargar productos de proveedor
async function cargarProductosProveedor (proveedorId) {
  cargandoProd.value = true
  errorProd.value = ''
  try {
    const url = `${API}/productos?limit=1000&proveedorId=${encodeURIComponent(proveedorId)}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    productosProv.value = data.items || data || []
  } catch (e) {
    errorProd.value = String(e.message || e)
  } finally {
    cargandoProd.value = false
  }
}

async function verProductos (prov) {
  selectedId.value = prov._id
  selectedNombre.value = prov.nombre
  await cargarProductosProveedor(prov._id)
}

onMounted(cargar)
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 900px){ .grid { grid-template-columns: 1fr; } }
.grid-2 { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; }
@media (max-width: 1100px){ .grid-2 { grid-template-columns: 1fr; } }

.card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }
.input, textarea.input { padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; width: 100%; }
.row { display: flex; flex-direction: column; gap: 6px; }
.btn { background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
.btn.danger { background: #ef4444; }
.toolbar { display: flex; gap: 8px; align-items: center; }
.spacer { flex: 1; }

.table { width: 100%; border-collapse: collapse; }
.table th, .table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
.table th { background: #f9fafb; }
.selected { background: #f1f5f9; }
.muted { color: #6b7280; padding: 0 8px; }
.alert { background: #fee2e2; color: #991b1b; padding: 8px 10px; border-radius: 6px; }
</style>
