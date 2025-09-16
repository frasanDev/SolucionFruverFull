# Backend (SolucionFruver)

## Configuración
1. Copia `.env.example` a `.env` y ajusta valores.
2. Instala dependencias:
   ```bash
   cd backend
   npm i
   npm run dev
   ```
3. Crea usuario admin inicial:
   ```bash
   curl -i -X POST http://localhost:3000/auth/bootstrap -H "Content-Type: application/json" -d '{"usuario":"admin","clave":"admin"}'
   ```

## Endpoints
- `POST /auth/login` { usuario, clave }
- `GET /productos` | `POST /productos` | `PUT /productos/:id` | `DELETE /productos/:id`
- `GET /proveedores` | `POST /proveedores` | `PUT /proveedores/:id` | `DELETE /proveedores/:id`
- `POST /ventas`
- `POST /compras`
