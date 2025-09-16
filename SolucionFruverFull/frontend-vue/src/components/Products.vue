<template>
  <div>
    <div class="row">
      <h2>Productos</h2>
      <div class="right"><button @click="startNew">Nuevo</button></div>
    </div>

    <div v-if="editing" class="card">
      <h3>{{ editing._id ? 'Editar producto' : 'Nuevo producto' }}</h3>
      <form @submit.prevent="save" class="grid grid-3">
        <div><label>Nombre</label><input v-model="editing.nombre" required /></div>
        <div><label>Precio</label><input type="number" v-model.number="editing.precio" required /></div>
        <div><label>Stock</label><input type="number" v-model.number="editing.stock" /></div>
        <div>
          <label>Unidad base</label>
          <select v-model="editing.unidadBase">
            <option>unidad</option><option>libra</option><option>kilo</option><option>paquete</option><option>bandeja</option><option>pack</option><option>sobre</option>
          </select>
        </div>
        <div class="row">
          <button :disabled="saving">{{ saving ? 'Guardando...' : 'Guardar' }}</button>
          <button type="button" @click="cancel">Cancelar</button>
        </div>
        <div v-if="error" class="error">{{ error }}</div>
      </form>
    </div>

    <div class="card" v-if="!loading && !error">
      <table class="table">
        <thead><tr><th>Nombre</th><th>Precio</th><th>Stock</th><th>Unidad</th><th></th></tr></thead>
        <tbody>
          <tr v-for="p in items" :key="p._id">
            <td>{{ p.nombre }}</td>
            <td>${{ p.precio?.toLocaleString?.() ?? p.precio }}</td>
            <td>{{ p.stock }}</td>
            <td>{{ p.unidadBase || 'unidad' }}</td>
            <td class="row">
              <button @click="editing = { ...p }">Editar</button>
              <button @click="del(p._id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="card">Cargando...</div>
    <div v-if="error" class="card error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const items = ref([])
const loading = ref(true)
const error = ref('')
const editing = ref(null)
const saving = ref(false)

async function load(){
  loading.value = true; error.value = ''
  try {
    const data = await api('/productos')
    items.value = Array.isArray(data) ? data : (data?.items || [])
  } catch(e){ error.value = e.message }
  finally { loading.value = false }
}
onMounted(load)

function startNew(){ editing.value = { nombre:'', precio:0, stock:0, unidadBase:'unidad' } }
function cancel(){ editing.value = null }

async function save(){
  saving.value = true; error.value = ''
  try {
    const body = { ...editing.value, precio: Number(editing.value.precio), stock: Number(editing.value.stock) }
    if (editing.value._id) await api(`/productos/${editing.value._id}`, { method:'PUT', body })
    else await api('/productos', { method:'POST', body })
    editing.value = null
    await load()
  } catch(e){ error.value = e.message }
  finally { saving.value = false }
}

async function del(id){
  if (!confirm('¿Eliminar producto?')) return
  await api(`/productos/${id}`, { method:'DELETE' })
  items.value = items.value.filter(i => i._id !== id)
}
</script>