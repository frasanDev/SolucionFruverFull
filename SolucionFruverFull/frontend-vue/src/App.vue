<template>
  <div class="nav">
    <div class="container row">
      <div class="row" style="gap:.75rem">
        <strong>Solución Fruver</strong>
        <router-link to="/productos">Productos</router-link>
        <router-link to="/proveedores">Proveedores</router-link>
        <router-link to="/ventas/nueva">Nueva venta</router-link>
        <router-link to="/compras/nueva">Nueva compra</router-link>
      </div>
      <div class="right row">
        <button @click="onLogout">Salir</button>
      </div>
    </div>
  </div>
  <div class="container"><router-view /></div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { logout } from './api'
const router = useRouter()
function onLogout(){ logout(); router.push('/login') }
</script>