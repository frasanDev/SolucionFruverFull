// backend/src/routes/ventas.routes.js
import { Router } from 'express';
import requireAuth from '../middlewares/requireAuth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import requireRole from '../middlewares/requireRole.js';
import * as C from '../controllers/ventas.controller.js';

const router = Router();

// Todas las rutas de ventas exigen autenticación
router.use(requireAuth);

// Listar y crear ventas: permitido a cajero o admin
router.get('/', requireRole('cajero', 'admin'), C.listarVentas);
router.post('/', requireRole('cajero', 'admin'), C.crearVenta);

// ⚠️ Rutas CONCRETAS primero (para que no las capture "/:id")
router.get('/ultima', requireRole('cajero', 'admin'), C.ultimaVenta);
router.get('/cierre', requireRole('cajero', 'admin'), C.cierreCaja); // ← NUEVA

// Obtener una venta por id: cajero o admin
router.get('/:id', requireRole('cajero', 'admin'), C.obtenerVentaPorId);

// Anular venta: solo admin
router.post('/:id/anular', requireAdmin, C.anularVenta);

export default router;
