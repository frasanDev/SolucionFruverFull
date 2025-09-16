# SolucionFruverFull

Monorepo con **backend (Node + Express + MongoDB)** y **frontend (Vue + Vite)**.

## Novedades v0.1.0
- Caja: validación de stock **kg/lb** en UI.
- Confirmación de cobro (modal).
- Backend: control de stock con guardas `$gte`, normalización de **kg a 3 decimales**, anulación consistente.

## Requisitos
- Node 18+ (o superior)
- MongoDB en local (standalone está bien)

## Quick Start

### 1) Backend
```bash
cd backend
cp .env.example .env
npm i
npm run dev

printf "VITE_API_URL=http://localhost:3000\n" > frontend/.env && cat > README.md <<'MD'
# SolucionFruverFull

Monorepo con **backend (Node + Express + MongoDB)** y **frontend (Vue + Vite)**.

## Novedades v0.1.0
- Caja: validación de stock **kg/lb** en UI.
- Confirmación de cobro (modal).
- Backend: control de stock con guardas `$gte`, normalización de **kg a 3 decimales**, anulación consistente.

## Requisitos
- Node 18+ (o superior)
- MongoDB en local (standalone está bien)

## Quick Start

### 1) Backend
```bash
cd backend
cp .env.example .env
npm i
npm run dev

eof
