import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles.css'
import Products from './components/Products.vue'
import Providers from './components/Providers.vue'
import Login from './components/Login.vue'
import SaleCreate from './components/SaleCreate.vue'
import PurchaseCreate from './components/PurchaseCreate.vue'

const routes = [
  { path: '/', component: Products },
  { path: '/login', component: Login },
  { path: '/productos', component: Products },
  { path: '/proveedores', component: Providers },
  { path: '/ventas/nueva', component: SaleCreate },
  { path: '/compras/nueva', component: PurchaseCreate },
]
const router = createRouter({ history: createWebHistory(), routes })

createApp(App).use(router).mount('#app')