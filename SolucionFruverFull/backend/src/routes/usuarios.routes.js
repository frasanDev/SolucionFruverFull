// backend/src/routes/usuarios.routes.js
import { Router } from 'express'
import requireAuth from '../middlewares/requireAuth.js'
import requireAdmin from '../middlewares/requireAdmin.js'
import * as C from '../controllers/usuarios.controller.js'

const router = Router()

// Primero autenticación, luego verificación de admin
router.use(requireAuth, requireAdmin)

router.get('/', C.listarUsuarios)
router.get('/:id', C.obtenerUsuario)
router.post('/', C.crearUsuario)
router.put('/:id', C.actualizarUsuario)
router.delete('/:id', C.eliminarUsuario)

export default router
