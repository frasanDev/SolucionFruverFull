import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    strictPort: true,
    host: 'localhost',
    proxy: {
      '/proveedores': { target: 'http://localhost:3000', changeOrigin: true },
      '/productos':   { target: 'http://localhost:3000', changeOrigin: true },
      '/auth':        { target: 'http://localhost:3000', changeOrigin: true }
    }
  }
  base: "./"
})








  
  

