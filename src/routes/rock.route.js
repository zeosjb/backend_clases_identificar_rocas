const { Router } = require('express')

const router = Router()

// Controlador
const { create, update, obtain, obtainById, deleteRock } = require('../controllers/rock.controller')

// Agregar una nueva roca
router.post('/agregar', create)
router.patch('/actualizar/:id', update)
router.get('/', obtain)
router.get('/:id', obtainById)
router.delete('/eliminar/:id', deleteRock)

module.exports = router
