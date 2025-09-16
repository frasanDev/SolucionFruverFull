<!-- frontend/src/components/TicketModal.vue -->
<template>
  <div v-if="open" class="tm-backdrop" @click.self="$emit('close')">
    <div class="tm-card">
      <div class="tm-head">
        <h3>Ticket</h3>
        <button class="btn" @click="$emit('close')">Cerrar</button>
      </div>

      <div class="tm-body">
        <div v-if="loading">Cargando ticket…</div>
        <div v-else-if="error" class="alert">{{ error }}</div>
        <div v-else class="row">
          <button class="btn" @click="openPrint">Imprimir</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  api: { type: String, required: true },
  token: { type: String, default: '' },
  ventaId: { type: String, default: null },
})
const emit = defineEmits(['close'])

const APP_NAME    = import.meta.env.VITE_APP_NAME    || 'Fruver'
const APP_NIT     = import.meta.env.VITE_APP_NIT     || ''
const APP_ADDRESS = import.meta.env.VITE_APP_ADDRESS || ''
const APP_PHONE   = import.meta.env.VITE_APP_PHONE   || ''

const loading = ref(false)
const error   = ref('')
const venta   = ref(null)

function money(n){
  return Number(n||0).toLocaleString('es-CO',{minimumFractionDigits:2, maximumFractionDigits:2})
}
function fmtCant(it){
  if (it.unidad === 'kg' || it.unidadIngresada === 'kg') {
    const kg = (typeof it.cantidadKg === 'number' ? it.cantidadKg : it.cantidadIngresada || 0)
    return kg.toFixed(3)
  }
  return String(it.cantidadIngresada ?? it.cantidadKg ?? 0)
}

async function loadVenta(){
  loading.value = true
  error.value = ''
  try{
    const url = props.ventaId
      ? `${props.api}/ventas/${props.ventaId}`
      : `${props.api}/ventas/ultima`
    const res = await fetch(url, {
      headers: props.token ? { Authorization: `Bearer ${props.token}` } : {}
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.message || 'Error cargando venta')
    venta.value = data.venta || data
  }catch(e){
    error.value = String(e.message || e)
  }finally{
    loading.value = false
  }
}

/** HTML de impresión formateado a 80 mm */
function ticketHtml(v){
  const cajero = (v.cajero && (v.cajero.usuario || v.cajero.username)) || (v.cajero || '—')
  const rows = (v.items || []).map(it =>
    `<tr>
      <td>${it.nombre || ''}</td>
      <td class="num">${fmtCant(it)}</td>
      <td class="num">$ ${money(it.precioUnitario ?? it.precioBaseKg ?? 0)}</td>
      <td class="num">$ ${money(it.totalItem || 0)}</td>
    </tr>`
  ).join('')

  const anuladaHtml = v.anulada
    ? `<div style="color:#b91c1c;margin-top:6px;"><b>ANULADA</b>${v.motivoAnulacion ? ' — ' + v.motivoAnulacion : ''}</div>`
    : ''

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket #${v.factura}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    html, body { width: 80mm; }
    *{ box-sizing: border-box; }
    body{
      margin: 0;
      font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;
      font-size: 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .wrap{ width: 100%; }
    h1,h2,h3{ margin: 0; }
    .muted{ color:#6b7280; }
    hr{ border:0; border-top:1px solid #e5e7eb; margin:6px 0; }
    table{ width:100%; border-collapse:collapse; margin-top:6px; }
    th,td{ padding:4px 0; border-bottom:1px solid #eee; }
    th{ text-align:left; }
    .num{ text-align:right; font-variant-numeric: tabular-nums; }
    @media print { .no-print{ display:none!important; } }
  </style>
</head>
<body>
  <div class="wrap">
    <h2>${APP_NAME}</h2>
    ${APP_NIT ? `<div class="muted">NIT: ${APP_NIT}</div>` : ``}
    ${APP_ADDRESS ? `<div class="muted">${APP_ADDRESS}</div>` : ``}
    ${APP_PHONE ? `<div class="muted">${APP_PHONE}</div>` : ``}
    <hr/>
    <div>Factura #${v.factura} — ${new Date(v.createdAt).toLocaleString()}</div>
    <div>Cajero: ${cajero}</div>
    <table>
      <thead>
        <tr><th>Producto</th><th class="num">Cant</th><th class="num">Precio</th><th class="num">Total</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <h3 class="num">Total: $ ${money(v.total || 0)}</h3>
    ${anuladaHtml}
  </div>
</body></html>`
}

function openPrint(){
  if (!venta.value) return
  const w = window.open('', 'ticket', 'width=360,height=640')
  if (!w) return
  const html = ticketHtml(venta.value)
  // Escribimos y cerramos el doc
  w.document.open()
  w.document.write(html)
  w.document.close()
  // Disparamos impresión cuando la ventana acabe de cargar
  const trigger = () => setTimeout(() => { try { w.focus(); w.print() } catch {} }, 100)
  if (w.document.readyState === 'complete') trigger()
  else w.addEventListener('load', trigger)
}

watch(() => props.open, async (val) => { if (val){ await loadVenta(); openPrint() } })
watch(() => props.ventaId, async () => { if (props.open){ await loadVenta() } })
onMounted(async () => { if (props.open){ await loadVenta(); openPrint() } })
</script>

<style scoped>
.tm-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);display:grid;place-items:center;z-index:60}
.tm-card{width:min(520px,92vw);background:#fff;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 20px 60px rgba(0,0,0,.2)}
.tm-head{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #eee}
.tm-body{padding:12px}
.row{display:flex;gap:8px}
.btn{background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:8px 12px;cursor:pointer}
.alert{background:#fee2e2;color:#991b1b;padding:8px 10px;border-radius:6px}
</style>
