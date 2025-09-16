<template>
  <div class="page">
    <div class="card">
      <h2>Panel</h2>
      <p><strong>Estado backend:</strong> <code>{{ status }}</code></p>
    </div>

    <div v-if="err" class="alert">{{ err }}</div>

    <div class="kpis">
      <div class="card">
        <h3>Ventas hoy</h3>
        <div class="big">$ {{ n(resumen.ventas.total) }}</div>
        <div class="muted">{{ resumen.ventas.count }} ventas · {{ resumen.ventas.items }} items</div>
      </div>

      <div class="card">
        <h3>Compras hoy</h3>
        <div class="big">$ {{ n(resumen.compras.total) }}</div>
        <div class="muted">{{ resumen.compras.count }} compras · {{ resumen.compras.items }} items</div>
      </div>

      <div class="card" :class="resumen.neto >= 0 ? 'positivo' : 'negativo'">
        <h3>Neto (ventas - compras)</h3>
        <div class="big">$ {{ n(resumen.neto) }}</div>
      </div>
    </div>

    <div class="grid2">
      <div class="card">
        <h3>Últimas ventas</h3>
        <ul class="list">
          <li v-for="v in ultimos.ventas" :key="v._id">
            <div class="row1">
              <span class="when">{{ dt(v.createdAt) }}</span>
              <span class="money">$ {{ n(v.total) }}</span>
            </div>
            <div class="row2 muted">
              {{ (v.productos?.length || 0) }} items
            </div>
          </li>
          <li v-if="(ultimos.ventas?.length||0)===0" class="muted">Sin ventas recientes</li>
        </ul>
      </div>

      <div class="card">
        <h3>Últimas compras</h3>
        <ul class="list">
          <li v-for="c in ultimos.compras" :key="c._id">
            <div class="row1">
              <span class="when">{{ dt(c.createdAt) }}</span>
              <span class="money">$ {{ n(c.total) }}</span>
            </div>
            <div class="row2 muted">
              {{ c.proveedorId?.nombre || '—' }} · {{ (c.productos?.length || 0) }} items
            </div>
          </li>
          <li v-if="(ultimos.compras?.length||0)===0" class="muted">Sin compras recientes</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const status  = ref('cargando...')
const resumen = ref({ ventas:{count:0,total:0,items:0}, compras:{count:0,total:0,items:0}, neto:0 })
const ultimos = ref({ ventas:[], compras:[] })
const err     = ref('')

const n  = (v) => Number(v || 0).toLocaleString('es-CO')
const dt = (s) => new Date(s).toLocaleString()

onMounted(async () => {
  try {
    const { data } = await api.get('/health')
    status.value = JSON.stringify(data)
  } catch (e) {
    status.value = `Error: ${e?.response?.status || e?.message}`
  }

  try {
    const { data } = await api.get('/dashboard/resumen')
    resumen.value = data
  } catch (e) {
    err.value = e?.response?.data?.error || e?.message || 'error cargando resumen'
  }

  try {
    const { data } = await api.get('/dashboard/ultimos')
    ultimos.value = data
  } catch (e) {
    err.value = e?.response?.data?.error || e?.message || 'error cargando últimos'
  }
})
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.kpi .big, .big { font-size: 1.6rem; font-weight: 700; }
.muted { color: #6b7280; }
.alert { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 8px; }
.positivo .big { color: #16a34a; }
.negativo .big { color: #dc2626; }
.card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }

.grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.row1 { display: flex; justify-content: space-between; align-items: baseline; }
.when { font-weight: 600; }
.money { font-weight: 700; }
.row2 { font-size: .9rem; }
</style>
