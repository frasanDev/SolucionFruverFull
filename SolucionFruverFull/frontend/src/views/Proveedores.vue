<!-- frontend/src/views/Proveedores.vue -->
<template>
    <div class="page p-4">
      <h2 class="title">Proveedores</h2>
  
      <div class="toolbar">
        <input
          v-model="q"
          class="input"
          placeholder="Buscar proveedor…"
        />
        <div class="count">Total: <strong>{{ total }}</strong></div>
      </div>
  
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Teléfono</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filtered" :key="p._id">
              <td>{{ p.nombre }}</td>
              <td>{{ p.contacto || '—' }}</td>
              <td>{{ p.telefono || '—' }}</td>
            </tr>
            <tr v-if="!loading && !filtered.length">
              <td colspan="3" class="muted">Sin resultados</td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="muted p-2">Cargando…</div>
        <div v-if="error" class="alert">{{ error }}</div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  
  const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000'
  const token = localStorage.getItem('token') || ''
  
  const items = ref([])
  const loading = ref(false)
  const error = ref('')
  const q = ref('')
  const total = ref(0)
  
  const filtered = computed(() => {
    const t = q.value.trim().toLowerCase()
    if (!t) return items.value
    return items.value.filter(p =>
      (p.nombre || '').toLowerCase().includes(t) ||
      (p.contacto || '').toLowerCase().includes(t) ||
      (p.telefono || '').toLowerCase().includes(t)
    )
  })
  
  async function cargar () {
    loading.value = true
    error.value = ''
    try {
      const res = await fetch(`${API}/proveedores?limit=200`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      items.value = Array.isArray(data) ? data : (data.items || [])
      total.value = (Array.isArray(data) ? data.length : (data.total ?? items.value.length)) || 0
    } catch (e) {
      error.value = String(e.message || e)
    } finally {
      loading.value = false
    }
  }
  
  onMounted(cargar)
  </script>
  
  <style scoped>
  .page { max-width: 1100px; margin: 0 auto; display: grid; gap: 16px; }
  .title { font-size: 1.6rem; font-weight: 700; }
  .toolbar { display: flex; gap: 12px; align-items: center; }
  .input { padding: 10px; border: 1px solid #d1d5db; border-radius: 10px; width: 100%; max-width: 520px; }
  .count { font-size: .95rem; color: #374151; }
  .card { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  .table { width: 100%; border-collapse: collapse; }
  .table th, .table td { padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: left; }
  .table thead th { background: #f8fafc; font-weight: 600; }
  .muted { color: #6b7280; text-align: center; }
  .alert { background: #fee2e2; color: #b91c1c; padding: 10px 12px; }
  .p-2 { padding: 8px; }
  </style>
  