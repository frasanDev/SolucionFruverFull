<template>
  <div class="card">
    <h2>Nueva venta</h2>
    <form @submit.prevent="submit" class="grid">
      <div class="card">
        <table class="table">
          <thead><tr><th>Producto</th><th>Cantidad</th><th>Unidad</th><th>Precio unitario</th><th>Subtotal</th><th></th></tr></thead>
          <tbody>
            <tr v-for="(it, idx) in items" :key="idx">
              <td>
                <select v-model="it.productoId" required>
                  <option value="">Seleccione</option>
                  <option v-for="p in productos" :key="p._id" :value="p._id">{{ p.nombre }}</option>
                </select>
              </td>
              <td><input type="number" v-model.number="it.cantidad" min="0" step="0.01" /></td>
              <td>
                <select v-model="it.unidad">
                  <option>unidad</option><option>libra</option><option>kilo</option><option>paquete</option><option>bandeja</option><option>pack</option><option>sobre</option>
                </select>
              </td>
              <td><input type="number" v-model.number="it.precioUnitario" step="0.01" /></td>
              <td>${{ ((it.cantidad||0)*(it.precioUnitario||0)).toLocaleString?.() }}</td>
              <td><button type="button" @click="delRow(idx)">Quitar</button></td>
            </tr>
          </tbody>
        </table>
        <button type="button" @click="addRow">+ Agregar ítem</button>
      </div>

      <div class="grid grid-2">
        <div>
          <label>Método de pago</label>
          <select v-model="metodoPago">
            <option>efectivo</option><option>tarjeta</option><option>transferencia</option><option>otros</option>
          </select>
        </div>
        <div>
          <label>Observaciones</label>
          <input v-model="observaciones" />
        </div>
      </div>

      <div class="row">
        <strong>Total: ${{ total.toLocaleString?.() }}</strong>
        <button class="right">Registrar venta</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="ok" class="success">{{ ok }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '../api'

const productos = ref([])
const items = ref([ { productoId:'', cantidad:1, unidad:'unidad', precioUnitario:0 } ])
const metodoPago = ref('efectivo')
const observaciones = ref('')
const error = ref('')
const ok = ref('')

onMounted(async ()=>{
  try {
    const d = await api('/productos')
    productos.value = Array.isArray(d) ? d : (d?.items || [])
  } catch(e){ error.value = e.message }
})

function addRow(){ items.value.push({ productoId:'', cantidad:1, unidad:'unidad', precioUnitario:0 }) }
function delRow(i){ items.value.splice(i,1) }

const total = computed(()=> items.value.reduce((acc, it)=> acc + (Number(it.cantidad)*Number(it.precioUnitario) || 0), 0))

async function submit(){
  error.value = ''; ok.value = ''
  try {
    const body = { productos: items.value.map(it => ({...it, cantidad:Number(it.cantidad), precioUnitario:Number(it.precioUnitario)})), metodoPago: metodoPago.value, observaciones: observaciones.value }
    const r = await api('/ventas', { method:'POST', body })
    ok.value = 'Venta registrada. ID: ' + (r?._id || '')
    items.value = [ { productoId:'', cantidad:1, unidad:'unidad', precioUnitario:0 } ]
  } catch(e){ error.value = e.message }
}
</script>