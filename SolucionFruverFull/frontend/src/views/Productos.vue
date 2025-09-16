<!-- frontend/src/views/Productos.vue -->
<template>
    <div class="page">
      <h2 class="title">Productos</h2>
  
      <section class="panel">
        <div class="grid">
          <div class="cell">
            <label class="lbl">Buscar…</label>
            <input v-model="q" type="text" class="input" placeholder="Nombre o unidad" />
          </div>
          <div class="cell">
            <label class="lbl">Total</label>
            <div class="badge">{{ filtered.length }}</div>
          </div>
        </div>
      </section>
  
      <section class="panel panel--table">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th class="tl">Nombre</th>
                <th class="tr">Precio</th>
                <th class="tr">Stock</th>
                <th class="tc">Unidad</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filtered" :key="p._id">
                <td class="tl">{{ p.nombre }}</td>
                <td class="tr mono">$ {{ fmt(p.precio) }}</td>
                <td class="tr mono">
                  <template v-if="isWeight(p.unidadBase)">{{ fmtKg(p.stock || 0) }}</template>
                  <template v-else>{{ fmt(p.stock || 0) }}</template>
                </td>
                <td class="tc mono">{{ p.unidadBase }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref, computed } from 'vue'
  
  const API   = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000'
  const token = localStorage.getItem('token')
  
  const productos = ref([])
  const q = ref('')
  
  const LB_TO_KG = 0.45359237
  const isWeight = (u) => u === 'kg' || u === 'lb'
  const round2 = (n) => Math.round((Number(n)||0) * 100) / 100
  const round3 = (n) => Math.round((Number(n)||0 + Number.EPSILON) * 1000) / 1000
  const fmt   = (n) => Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })
  const fmtKg = (n) => round3(n).toLocaleString('es-CO', { maximumFractionDigits: 3 })
  
  const filtered = computed(() => {
    const t = q.value.trim().toLowerCase()
    if (!t) return productos.value
    return productos.value.filter(p =>
      (p.nombre || '').toLowerCase().includes(t) ||
      (p.unidadBase || '').toLowerCase().includes(t)
    )
  })
  
  async function fetchProductos() {
    const res = await fetch(`${API}/productos?limit=500`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    const data = await res.json()
    productos.value = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : [])
  }
  
  onMounted(fetchProductos)
  </script>
  
  <style scoped>
  .page { max-width: 1100px; margin: 0 auto; padding: 16px; }
  .title { font-size: 24px; margin: 0 0 12px; }
  .panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 14px; box-shadow: 0 1px 0 rgba(0,0,0,.02); }
  .grid { display: grid; gap: 12px; grid-template-columns: 1fr; }
  @media (min-width: 700px){ .grid{ grid-template-columns: 2fr 1fr; } }
  .cell{ display:flex; flex-direction:column; gap:6px; }
  .lbl{ font-size:12px; color:#374151; }
  .input{ height:34px; padding:0 10px; border:1px solid #cbd5e1; border-radius:8px; outline:none; }
  .input:focus{ border-color:#2563eb; box-shadow:0 0 0 2px rgba(37,99,235,.15); }
  .badge{ height:34px; display:inline-flex; align-items:center; padding:0 10px; border:1px solid #e5e7eb; border-radius:8px; background:#f9fafb; font-variant-numeric:tabular-nums; }
  .table-wrap{ overflow:auto; }
  .table{ width:100%; border-collapse:collapse; }
  .table th,.table td{ padding:10px; border-bottom:1px solid #e5e7eb; white-space:nowrap; }
  .table thead th{ background:#f8fafc; font-weight:600; }
  .tl{ text-align:left; } .tr{ text-align:right; } .tc{ text-align:center; }
  .mono{ font-variant-numeric:tabular-nums; }
  </style>
  