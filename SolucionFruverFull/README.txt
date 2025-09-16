SolucionFruver (Backend + Frontend Vue)
======================================

Estructura unificada para ejecutar backend (Node+Express+MongoDB) y frontend (Vite+Vue3+Vue Router).

1) Backend
----------
cd backend
cp .env.example .env
# Ajusta MONGO_URI, JWT_SECRET, CORS_ORIGINS
npm i
npm run dev

# Crear usuario admin
curl -i -X POST http://localhost:3000/auth/bootstrap -H "Content-Type: application/json" -d '{"usuario":"admin","clave":"admin"}'

2) Frontend (Vue)
-----------------
cd ../frontend-vue
cp .env.example .env            # VITE_API_URL=http://localhost:3000 por defecto
npm i
npm run dev                     # http://localhost:5174

Rutas Frontend:
- /login -> POST /auth/login
- /productos CRUD -> /productos
- /proveedores CRUD -> /proveedores
- /ventas/nueva -> POST /ventas
- /compras/nueva -> POST /compras

## PR: Caja
- Validación de stock y confirmación de cobro.
