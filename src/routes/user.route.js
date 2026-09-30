const { Router } = require('express')
const { register, login, me, updateMe } = require('../controllers/user.controller')
const { createCrudService } = require('../services/crudService')
const { createCrudController } = require('../controllers/crud.controller')
const { User } = require('../models')
const { adminOnly, authenticated } = require('../middlewares/guards')

const router = Router()
router.post('/registro', register)
router.post('/login', login)
router.get('/me', ...authenticated, me)
router.patch('/me', ...authenticated, updateMe)

// Admin-only read access. Users are never created or edited through generic CRUD (no passwords, no role changes).
const controller = createCrudController(createCrudService({ model: User, searchableFields: ['userName', 'email'] }), 'Usuario')
router.get('/', ...adminOnly, controller.list)
router.get('/:id', ...adminOnly, controller.get)
module.exports = router
