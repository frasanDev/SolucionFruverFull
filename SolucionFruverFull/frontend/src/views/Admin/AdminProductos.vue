<!-- frontend/src/views/admin/AdminProductos.vue -->
<template>
    <div class="page">
      <h2>Admin · Productos</h2>
  
      <div v-if="error" class="alert">{{ error }}</div>
  
      <!-- Crear producto -->
      <div class="card">
        <h3>Nuevo producto</h3>
        <form @submit.prevent="crear">
          <div class="grid">
            <div class="row">
              <label>Nombre *</label>
              <input v-model="form.nombre" class="input" placeholder="Nombre del producto" required />
            </div>
            <div class="row">
              <label>Código</label>
              <input v-model="form.codigo" class="input" placeholder="SKU / código interno" />
            </div>
            <div class="row">
              <label>Categoría</label>
              <input v-model="form.categoria" class="input" placeholder="Frutas, Abarrotes, etc." />
            </div>
            <div class="row">
              <label>Unidad base</label>
              <select v-model="form.unidad" class="input">
                <option value="kg">kg</option>
                <option value="lb">lb</option>
                <option value="unidad">unidad</option>
                <option value="caja">caja</option>
              </select>
            </div>
            <div class="row">
              <label>Precio</label>
              <input v-model.number="form.precio" type="number" step="0.01" class="input" placeholder="0.00" />
            </div>
            <div class="row">
              <label>Stock</label>
              <input v-model.number="form.stock" type="number" step="0.001" class="input" placeholder="0" />
            </div>
          </div>
          <button class="btn" :disabled="cargando">Crear</button>
        </form>
      </div>
  
      <!-- Filtros / paginación -->
      <div class="toolbar">
        <input v-model="busqueda" class="input" placeholder="Buscar por nombre, código o categoría" />
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
  
      <!-- Listado y edición -->
      <div class="card">
        <h3>Listado</h3>
        <div v-if="cargando">Cargando...</div>
        <table v-else class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Código</th>
              <th>Categoría</th>
              <th>Unidad</th>
              <th style="text-align:right;">Precio</th>
              <th style="text-align:right;">Stock</th>
              <th style="width:200px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in items" :key="p._id">
              <template v-if="editId === p._id">
                <td><input v-model="editForm.nombre" class="input" /></td>
                <td><input v-model="editForm.codigo" class="input" /></td>
                <td><input v-model="editForm.categoria" class="input" /></td>
                <td>
                  <select v-model="editForm.unidad" class="input">
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                    <option value="unidad">unidad</option>
                    <option value="caja">caja</option>
                  </select>
                </td>
                <td><input v-model.number="editForm.precio" type="number" step="0.01" class="input" style="text-align:right;" /></td>
                <td><input v-model.number="editForm.stock" type="number" step="0.001" class="input" style="text-align:right;" /></td>
                <td class="actions">
                  <button class="btn" @click="guardarEdicion(p._id)">Guardar</button>
                  <button class="btn secondary" @click="cancelarEdicion">Cancelar</button>
                </td>
              </template>
              <template v-else>
                <td>{{ p.nombre }}</td>
                <td>{{ p.codigo || '' }}</td>
                <td>{{ p.categoria || '' }}</td>
                <td>{{ p.unidad || p.unidadBase || '' }}</td>
                <td style="text-align:right;">{{ formatMoney(p.precio) }}</td>
                <td style="text-align:right;">{{ p.stock ?? 0 }}</td>
                <td class="actions">
                  <button class="btn" @click="editar(p)">Editar</button>
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
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const token = localStorage.getItem('token') || ''
  
  // estados
  const form = ref({ nombre:'', codigo:'', categoria:'', unidad:'kg', precio:0, stock:0 })
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
  
  // helpers
  function formatMoney(v){
    const n = Number(v || 0)
    return n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  
  // cargar con paginación/búsqueda
  async function cargar () {
    cargando.value = true
    error.value = ''
    try {
      const params = new URLSearchParams()
      params.set('page', String(page.value))
      params.set('limit', String(limit.value))
      const q = busqueda.value.trim()
      if (q) params.set('q', q)
  
      const url = `${API}/productos?${params.toString()}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
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
  
  // crear
  async function crear () {
    error.value = ''
    try {
      const body = { ...form.value }
      const res = await fetch(`${API}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error(await res.text())
      const nuevo = await res.json()
      items.value.unshift(nuevo)
      total.value++
      form.value = { nombre:'', codigo:'', categoria:'', unidad:'kg', precio:0, stock:0 }
    } catch (e) {
      error.value = 'No pude crear producto: ' + (e.message || e)
    }
  }
  
  // eliminar
  async function eliminar (id) {
    if (!confirm('Eliminar producto?')) return
    try {
      const res = await fetch(`${API}/productos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(await res.text())
      items.value = items.value.filter(x => x._id !== id)
      total.value = Math.max(0, total.value - 1)
    } catch (e) {
      alert('Error al eliminar: ' + (e.message || e))
    }
  }
  
  // editar
  function editar (p) {
    editId.value = p._id
    editForm.value = {
      nombre: p.nombre || '',
      codigo: p.codigo || '',
      categoria: p.categoria || '',
      unidad: p.unidad || p.unidadBase || 'kg',
      precio: Number(p.precio || 0),
      stock: Number(p.stock || 0)
    }
  }
  function cancelarEdicion(){
    editId.value = null
    editForm.value = {}
  }
  async function guardarEdicion (id) {
    try {
      const res = await fetch(`${API}/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm.value)
      })
      if (!res.ok) throw new Error(await res.text())
      const upd = await res.json()
      const i = items.value.findIndex(x => x._id === id)
      if (i >= 0) items.value[i] = upd
      cancelarEdicion()
    } catch (e) {
      alert('Error al guardar: ' + (e.message || e))
    }
  }
  
  onMounted(cargar)
  </script>
  
  <style scoped>
  .page { display: grid; gap: 16px; }
  .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  @media (max-width: 720px){ .grid { grid-template-columns: 1fr; } }
  .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; background: #fff; }
  .input { padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; width: 100%; }
  .row { display: flex; flex-direction: column; gap: 6px; }
  .btn { background: #2563eb; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
  .btn.secondary { background: #6b7280; }
  .btn.danger { background: #ef4444; }
  .toolbar { display: flex; gap: 8px; align-items: center; }
  .spacer { flex: 1; }
  .table { width: 100%; border-collapse: collapse; }
  .table th, .table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
  .table th { background: #f9fafb; }
  .actions { display: flex; gap: 6px; justify-content: flex-end; }
  .muted { color: #6b7280; padding: 0 8px; }
  .alert { background: #fee2e2; color: #991b1b; padding: 8px 10px; border-radius: 6px; }
  </style>
  