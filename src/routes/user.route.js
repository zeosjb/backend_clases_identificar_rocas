const { Router } = require('express')

const router = Router()

// Controlador
const { register, login } = require('../controllers/user.controller')

// Registrar un nuevo usuario
router.post('/registro', register)
router.post('/login', login)

module.exports = router
