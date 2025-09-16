<!-- frontend/src/views/Caja.vue -->
<template>
  <div class="page">
    <h2 class="title">Caja operativa</h2>

    <!-- Panel de selección -->
    <section class="panel">
      <div class="grid">
        <div class="cell">
          <label class="lbl">Buscar producto</label>
          <input
            ref="searchEl"
            v-model="q"
            @input="onSearch"
            type="text"
            placeholder="Escribe para filtrar…"
            class="input"
          />
        </div>

        <div class="cell">
          <label class="lbl">Producto</label>
          <select v-model="selId" class="input">
            <option value="">Seleccione…</option>
            <option v-for="p in filtered" :key="p._id" :value="p._id">
              {{ p.nombre }} — ${{ fmt(p.precio) }} ({{ p.unidadBase }}) · stk {{ fmtStockHint(p) }}
            </option>
          </select>
        </div>

        <div class="cell">
          <label class="lbl">Cantidad</label>
          <div class="row">
            <select v-model="selUnit" class="input input--unit">
              <option v-for="u in allowedUnits" :key="u" :value="u">{{ u }}</option>
            </select>

            <input
              ref="qtyEl"
              v-model.number="selQty"
              @keyup.enter="addItem"
              :step="isWeight(selUnit) ? 0.001 : 1"
              :min="isWeight(selUnit) ? 0.001 : 1"
              type="number"
              placeholder="0"
              class="input input--qty"
            />

            <button
              :disabled="!canAdd || cargando"
              @click="addItem"
              class="btn btn--primary"
              title="Agregar al carrito"
            >
              Agregar
            </button>
          </div>

          <div v-if="availableInUnit !== null" class="hint">
            Disp:
            <strong>{{ isWeight(selUnit) ? fmtKg(availableInUnit) : fmt(availableInUnit) }}</strong>
            {{ selUnit }}
          </div>
        </div>
      </div>
    </section>

    <!-- Carrito -->
    <section v-if="cart.length" class="panel panel--table">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th class="tl">Producto</th>
              <th>Unidad</th>
              <th>Cant</th>
              <th>Precio base</th>
              <th>Total ítem</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(it, i) in cart" :key="i">
              <td class="tl">{{ it.nombre }}</td>
              <td class="tc mono">{{ it.unit }}</td>
              <td class="tr mono">{{ isWeight(it.unit) ? fmtKg(it.qty) : it.qty }}</td>
              <td class="tr mono">
                <span v-if="isWeight(it.baseUnit)">
                  <template v-if="it.unit === 'lb'">
                    $ {{ fmt(pricePerLb(it.price)) }} /lb
                  </template>
                  <template v-else>
                    $ {{ fmt(it.price) }} /kg
                  </template>
                </span>
                <span v-else>$ {{ fmt(it.price) }} /{{ it.baseUnit }}</span>
              </td>
              <td class="tr mono">$ {{ fmt(itemTotal(it)) }}</td>
              <td class="tc">
                <button class="btn btn--icon" @click="removeAt(i)" title="Quitar">
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="tfoot">
              <td class="tl" colspan="4">Subtotal</td>
              <td class="tr mono">$ {{ fmt(subtotal) }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>

    <!-- Cobro -->
    <section class="panel">
      <div class="pay">
        <div class="pay__field">
          <label class="lbl">Efectivo recibido</label>
          <input
            v-model.number="efectivo"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            class="input"
          />
        </div>

        <div class="pay__change">
          Cambio:
          <strong class="mono">$ {{ fmt(Math.max(efectivo - subtotal, 0)) }}</strong>
        </div>

        <button
          :disabled="!cart.length || cargando"
          @click="showConfirm = true"
          class="btn btn--success"
        >
          {{ cargando ? 'Procesando…' : 'Cobrar' }}
        </button>
      </div>

      <p v-if="msg" :class="['alert', ok ? 'alert--ok' : 'alert--err']">
        {{ msg }}
      </p>
    </section>

    <!-- Modal Confirmación -->
    <div v-if="showConfirm" class="modal__backdrop" @click.self="showConfirm=false">
      <div class="modal">
        <h3 class="modal__title">Confirmar cobro</h3>

        <div class="modal__grid">
          <div class="kv"><span>Ítems</span><strong>{{ cart.length }}</strong></div>
          <div class="kv"><span>Subtotal</span><strong>$ {{ fmt(subtotal) }}</strong></div>
          <div class="kv"><span>Efectivo</span><strong>$ {{ fmt(efectivo) }}</strong></div>
          <div class="kv"><span>Cambio</span><strong>$ {{ fmt(Math.max(efectivo - subtotal, 0)) }}</strong></div>
        </div>

        <div class="modal__list">
          <table class="table table--compact">
            <thead>
              <tr>
                <th class="tl">Producto</th>
                <th class="tr">Cant</th>
                <th class="tr">Total ítem</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, i) in cart" :key="i">
                <td class="tl">{{ it.nombre }} ({{ it.unit }})</td>
                <td class="tr mono">{{ isWeight(it.unit) ? fmtKg(it.qty) : it.qty }}</td>
                <td class="tr mono">$ {{ fmt(itemTotal(it)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal__actions">
          <button class="btn" @click="showConfirm=false">Cancelar</button>
          <button class="btn btn--success" :disabled="cargando" @click="confirmarCobro">
            {{ cargando ? 'Procesando…' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Ticket -->
    <TicketModal :open="showTicket" :api="API" :token="ticketToken" @close="showTicket=false" />
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch, onUnmounted } from 'vue'
import TicketModal from '../components/TicketModal.vue'

const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000'

const q = ref('')
const productos = ref([])
const filtered = ref([])
const selId = ref('')
const selQty = ref(null)
const selUnit = ref('kg')
const qtyEl = ref(null)

const cart = ref([])
const efectivo = ref(0)
const cargando = ref(false)
const msg = ref('')
const ok = ref(false)
const showTicket = ref(false)
const showConfirm = ref(false)
const ticketToken = ref('') // Token usado por el modal de ticket

const LB_TO_KG = 0.45359237
const isWeight = (u) => u === 'kg' || u === 'lb'
const round2  = (n) => Math.round((Number(n)||0) * 100) / 100
const round3  = (n) => Math.round((Number(n)||0 + Number.EPSILON) * 1000) / 1000
const fmt     = (n) => Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })
const fmtKg   = (n) => round3(n).toLocaleString('es-CO', { maximumFractionDigits: 3 })
// Precio por libra a partir del precio por kilo
const pricePerLb = (pricePerKg) => round2(pricePerKg / LB_TO_KG)

// Lee headers con token siempre fresco
function authHeaders() {
  const t = localStorage.getItem('token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

// kg ↔ lb
const toKg   = (q, u) => (u === 'kg' ? q : u === 'lb' ? q * LB_TO_KG : q)
const fromKg = (qKg, u) => (u === 'kg' ? qKg : u === 'lb' ? qKg / LB_TO_KG : qKg)

// Reservado en carrito
const enCarritoKg = (id) =>
  cart.value.filter(it => it.id === id && isWeight(it.unit))
            .reduce((a, it) => a + toKg(it.qty, it.unit), 0)

const enCarritoUnits = (id) =>
  cart.value.filter(it => it.id === id && !isWeight(it.unit))
            .reduce((a, it) => a + Number(it.qty || 0), 0)

// Unidades permitidas según el producto
const allowedUnits = computed(() => {
  const p = productos.value.find(x => x._id === selId.value)
  const base = p?.unidadBase || 'unidad'
  if (base === 'kg' || base === 'lb') return ['kg', 'lb']
  return ['unit']
})

// Disponible (resta lo reservado en carrito)
const availableInUnit = computed(() => {
  const p = productos.value.find(x => x._id === selId.value)
  if (!p) return null
  const stock = Number(p.stock || 0)
  if (p.unidadBase === 'kg' || p.unidadBase === 'lb') {
    const dispKg = Math.max(0, round3(stock - enCarritoKg(p._id)))
    return fromKg(dispKg, selUnit.value)
  }
  return Math.max(0, stock - enCarritoUnits(p._id))
})

// Habilitar botón Agregar
const canAdd = computed(() => {
  if (!selId.value || !selQty.value) return false
  const avail = availableInUnit.value
  if (avail === null) return false
  return Number(selQty.value) > 0 && Number(selQty.value) <= Number(avail)
})

function fmtStockHint(p) {
  if (p.unidadBase === 'kg' || p.unidadBase === 'lb') {
    return fmtKg(Number(p.stock || 0)) + ' kg'
  }
  return fmt(Number(p.stock || 0))
}

function onSearch() {
  const text = q.value.trim().toLowerCase()
  if (!text) { filtered.value = productos.value.slice(0, 50); return }
  filtered.value = productos.value.filter(p => p.nombre.toLowerCase().includes(text))
}

function itemTotal(it) {
  if (isWeight(it.baseUnit)) {
    const qtyKg = it.unit === 'kg' ? it.qty : it.qty * LB_TO_KG
    return round2(it.price * qtyKg)
  }
  return round2(it.price * it.qty)
}

const subtotal = computed(() => cart.value.reduce((a, it) => a + itemTotal(it), 0))

function removeAt(i) { cart.value.splice(i, 1) }

function addItem() {
  const p = productos.value.find(x => x._id === selId.value)
  if (!p) return
  if (!selQty.value || selQty.value <= 0) {
    ok.value = false; msg.value = 'Cantidad inválida'; return
  }
  if (availableInUnit.value !== null && Number(selQty.value) > Number(availableInUnit.value)) {
    ok.value = false
    msg.value = `Stock insuficiente. Disponible: ${
      isWeight(selUnit.value) ? fmtKg(availableInUnit.value) : fmt(availableInUnit.value)
    } ${selUnit.value}`
    return
  }
  const unitToSend = (p.unidadBase === 'kg' || p.unidadBase === 'lb') ? selUnit.value : 'unit'
  const qtyNorm = isWeight(unitToSend) ? round3(selQty.value) : Number(selQty.value)

  cart.value.push({
    id: p._id,
    nombre: p.nombre,
    baseUnit: p.unidadBase,
    unit: unitToSend,
    qty: qtyNorm,
    price: Number(p.precio)
  })

  // Mantener selección; vaciar cantidad; foco para carga rápida
  selQty.value = null
  selUnit.value = (p.unidadBase === 'kg' || p.unidadBase === 'lb') ? selUnit.value : 'unit'
  msg.value = ''
  queueMicrotask(() => qtyEl.value?.focus())
}

async function fetchProductos() {
  msg.value = ''
  try {
    const res = await fetch(`${API}/productos?limit=200`, {
      headers: authHeaders()
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error('No autenticado')
      if (res.status === 403) throw new Error('Sin permisos para ver productos')
      throw new Error('Error cargando productos')
    }
    const data = await res.json()
    const arr = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : [])
    productos.value = arr
    filtered.value = arr.slice(0, 50)
  } catch (e) {
    productos.value = []
    filtered.value = []
    ok.value = false
    msg.value = String(e.message || e)
  }
}

async function confirmarCobro() {
  msg.value = ''; ok.value = false
  if (!cart.value.length) return
  try {
    cargando.value = true
    const payload = {
      efectivo: Number(efectivo.value || 0),
      productos: cart.value.map(it => ({
        productoId: it.id,
        cantidad: it.qty,
        unidad: it.unit
      }))
    }
    const res = await fetch(`${API}/ventas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!res.ok || data.ok === false) throw new Error(data.message || data.error || 'Error en venta')

    ok.value = true
    msg.value = `Venta OK. Factura #${data.factura}. Cambio $${fmt(data.cambio)}`

    // Token fresco para el ticket
    ticketToken.value = localStorage.getItem('token') || ''
    showTicket.value = true

    // limpiar
    cart.value = []
    efectivo.value = 0

    // refrescar stock
    await fetchProductos()

    // reset selección
    selId.value = ''
    selQty.value = null
    selUnit.value = 'kg'
  } catch (e) {
    ok.value = false
    msg.value = String(e.message || e)
  } finally {
    cargando.value = false
    showConfirm.value = false
  }
}

function onKey(e) {
  if (e.key === 'Escape') showConfirm.value = false
}

onMounted(() => {
  // Asegurar token del ticket si ya existe sesión
  ticketToken.value = localStorage.getItem('token') || ''
  fetchProductos()
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => window.removeEventListener('keydown', onKey))

watch(selId, () => {
  const p = productos.value.find(x => x._id === selId.value)
  if (!p) return
  selUnit.value = (p.unidadBase === 'kg' || p.unidadBase === 'lb') ? 'kg' : 'unit'
})

// Convertir valor al cambiar kg ↔ lb manteniendo equivalencia
watch(selUnit, (newU, oldU) => {
  const p = productos.value.find(x => x._id === selId.value)
  if (!p) return
  if (!(p.unidadBase === 'kg' || p.unidadBase === 'lb')) return
  if (!selQty.value || oldU === newU) return
  const qtyKg = toKg(selQty.value, oldU)
  selQty.value = round3(fromKg(qtyKg, newU))
})
</script>

<style scoped>
/* Layout base */
.page { max-width: 1100px; margin: 0 auto; padding: 16px; }
.title { font-size: 24px; margin: 0 0 12px; }

/* Panel / tarjeta */
.panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 14px; box-shadow: 0 1px 0 rgba(0,0,0,.02); }

/* Grid selector */
.grid { display: grid; gap: 12px; grid-template-columns: 1fr; }
@media (min-width: 860px) {
  .grid { grid-template-columns: 1.2fr 1.6fr 1.2fr; }
}
.cell { display: flex; flex-direction: column; gap: 6px; }
.lbl { font-size: 12px; color: #374151; }

.row { display: flex; gap: 8px; align-items: center; }

/* Inputs / botones */
.input { height: 34px; padding: 0 10px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; width: 100%; }
.input:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,.15); }
.input--unit { width: 80px; }
.input--qty { width: 120px; }

.btn { height: 34px; padding: 0 12px; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; cursor: pointer; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn--primary { background: #1d4ed8; border-color: #1d4ed8; color: #fff; }
.btn--primary:hover { background: #1a46c3; }
.btn--success { background: #059669; border-color: #059669; color: #fff; }
.btn--success:hover { background: #048361; }
.btn--icon { width: 28px; height: 28px; border-radius: 6px; }

.hint { margin-top: 6px; font-size: 12px; color: #4b5563; }

/* Tabla */
.table-wrap { overflow: auto; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 10px; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
.table thead th { background: #f8fafc; font-weight: 600; }
.table .tfoot td { background: #f9fafb; font-weight: 600; }
.table--compact th, .table--compact td { padding: 6px 8px; }

.tl { text-align: left; } .tr { text-align: right; } .tc { text-align: center; }
.mono { font-variant-numeric: tabular-nums; }

/* Cobro */
.pay { display: flex; gap: 12px; align-items: end; flex-wrap: wrap; }
.pay__field { display: flex; flex-direction: column; gap: 6px; min-width: 220px; }
.pay__change { font-size: 16px; line-height: 34px; margin-right: auto; }

/* Alertas */
.alert { margin-top: 10px; padding: 10px 12px; border-radius: 8px; font-size: 14px; }
.alert--ok  { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.alert--err { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

/* Modal */
.modal__backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: grid; place-items: start center; padding: 24px 12px; z-index: 50; }
.modal { width: min(620px, 92vw); background: #fff; border-radius: 12px; padding: 14px; border: 1px solid #e5e7eb; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
.modal__title { margin: 4px 4px 10px; font-size: 18px; }
.modal__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; margin: 6px 4px 12px; }
.kv { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; }
.kv span { color: #4b5563; }
.modal__list { max-height: 260px; overflow: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
.modal__actions { display: flex; justify-content: end; gap: 8px; margin-top: 12px; }
</style>

