<template>
  <div class="page">
    <h2>Ventas</h2>

    <div v-if="error" class="alert">{{ error }}</div>

    <div class="toolbar">
      <label>Por página:</label>
      <select v-model.number="limit" class="input" @change="page=1; cargar()">
        <option :value="10">10</option>
        <option :value="25">25</option>
        <option :value="50">50</option>
      </select>

      <div class="spacer" />

      <button class="btn" :disabled="page<=1 || cargando" @click="page--; cargar()">« Anterior</button>
      <span class="muted">Página {{ page }} / {{ pages }}</span>
      <button class="btn" :disabled="page>=pages || cargando" @click="page++; cargar()">Siguiente »</button>

      <button class="btn" :disabled="cargando" @click="cargar()">Recargar</button>
    </div>

    <div class="card">
      <div v-if="cargando">Cargando…</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in ventas" :key="v._id">
            <td>{{ v.factura }}</td>
            <td>{{ fmtFecha(v.createdAt) }}</td>
            <td style="text-align:right">{{ money(v.total || 0) }}</td>
            <td>
              <span v-if="v.anulada" class="tag danger">Anulada</span>
              <span v-else class="tag ok">Válida</span>
            </td>
            <td class="actions">
              <button class="btn" @click="imprimir(v)">Imprimir</button>
              <button
                class="btn danger"
                v-if="canAnular && !v.anulada"
                @click="anular(v)"
              >Anular</button>
              <button class="btn" @click="openTicket(v._id)">Ticket</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!cargando && ventas.length===0" class="muted">Sin resultados</div>
    </div>
  </div>
  <TicketModal
  :open="showTicket"
  :api="API"
  :token="token"
  :ventaId="ticketVentaId"
  @close="showTicket=false"
/>
</template>

<script setup>
import TicketModal from '../components/TicketModal.vue'
import { ref, onMounted, computed } from 'vue'

//const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/,'')
const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000'

const token = localStorage.getItem('token') || ''

const showTicket = ref(false)
const ticketVentaId = ref(null)
function openTicket(id){ ticketVentaId.value = id; showTicket.value = true }


const rol   = localStorage.getItem('role') || localStorage.getItem('rol') || ''
const user  = localStorage.getItem('usuario') || localStorage.getItem('username') || ''

const canAnular = computed(() => rol === 'admin' || rol === 'cajero' || user === 'admin')

const ventas   = ref([])
const cargando = ref(false)
const error    = ref('')
const page     = ref(1)
const limit    = ref(10)
const pages    = ref(1)
const total    = ref(0)

function money(n){ return Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}) }
function fmtFecha(d){ try{ return new Date(d).toLocaleString() } catch { return d || '' } }
function fmtCant(it){
  if (it.unidad === 'kg' || it.unidadIngresada === 'kg') {
    const kg = (typeof it.cantidadKg === 'number' ? it.cantidadKg : it.cantidadIngresada || 0)
    return kg.toFixed(3)
  }
  return String(it.cantidadIngresada ?? it.cantidadKg ?? 0)
}

async function cargar(){
  cargando.value = true
  error.value = ''
  try{
    const url = `${API}/ventas?page=${page.value}&limit=${limit.value}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    // Soporta ambas formas: array plano o {items,total,...}
    ventas.value = Array.isArray(data) ? data : (data.items || [])
    total.value  = data.total ?? ventas.value.length
    pages.value  = data.pages ?? 1
  }catch(e){
    error.value = String(e.message || e)
  }finally{
    cargando.value = false
  }
}

function imprimir(v){
  const win = window.open('', '_blank', 'width=480,height=640')
  if (!win) return

  const rows = (v.items || []).map(it =>
    '<tr>'
    + '<td>' + (it.nombre || '') + '</td>'
    + '<td>' + (it.unidadIngresada || it.unidad || '') + '</td>'
    + '<td style="text-align:right">' + fmtCant(it) + '</td>'
    + '<td style="text-align:right">' + money(it.precioUnitario ?? it.precioBaseKg ?? 0) + '</td>'
    + '<td style="text-align:right">' + money(it.totalItem) + '</td>'
    + '</tr>'
  ).join('')

  const anuladaHtml = v.anulada
    ? ('<div style="color:#b91c1c"><b>ANULADA</b>'
       + (v.motivoAnulacion ? ' — Motivo: ' + v.motivoAnulacion : '')
       + '</div>')
    : ''

  const html =
    '<html>'
    + '<head><title>Factura #' + v.factura + '</title></head>'
    + '<body>'
    + '<h3>Factura #' + v.factura + '</h3>'
    + '<div>Fecha: ' + fmtFecha(v.createdAt) + '</div>'
    + '<hr/>'
    + '<table style="width:100%;border-collapse:collapse" border="1" cellpadding="6">'
      + '<thead><tr>'
        + '<th>Producto</th><th>Unidad</th>'
        + '<th style="text-align:right">Cant.</th>'
        + '<th style="text-align:right">Precio</th>'
        + '<th style="text-align:right">Total</th>'
      + '</tr></thead>'
      + '<tbody>' + rows + '</tbody>'
    + '</table>'
    + '<h4 style="text-align:right">Total: ' + money(v.total || 0) + '</h4>'
    + anuladaHtml
    + '<script>window.onload=()=>window.print()<\\/script>'
    + '</body></html>'

  win.document.write(html)
  win.document.close()
}

async function anular(v){
  const motivo = prompt('Motivo de anulación:', v.motivoAnulacion || '')
  if (motivo === null) return
  try{
    const res = await fetch(`${API}/ventas/${v._id}/anular`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ motivo })
    })
    if (!res.ok) throw new Error(await res.text())
    const upd = await res.json().catch(()=>({}))
    v.anulada = true
    v.motivoAnulacion = motivo
  }catch(e){
    alert('No pude anular: ' + (e.message || e))
  }
}

onMounted(cargar)
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; background: #fff; }
.toolbar { display: flex; gap: 8px; align-items: center; }
.spacer { flex: 1; }
.input { padding: 8px; border: 1px solid #d1d5db; border-radius: 8px; }
.btn { background: #3b82f6; color: #fff; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.btn.danger { background: #ef4444; }
.muted { color: #6b7280; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
.table th { background: #f9fafb; }
.actions { display: flex; gap: 6px; }
.tag { padding: 2px 8px; border-radius: 999px; font-size: 12px; }
.tag.ok { background: #dcfce7; color: #065f46; }
.tag.danger { background: #fee2e2; color: #991b1b; }
.alert { background: #fee2e2; color: #991b1b; padding: 8px 10px; border-radius: 6px; }
</style>
