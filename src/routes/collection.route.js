const { Router } = require('express')
const models = require('../models')
const { authenticated } = require('../middlewares/guards')
const { createCollectionService } = require('../services/collectionService')
const { createCollectionController } = require('../controllers/recognition.controller')

const controller = createCollectionController(createCollectionService({ models }))
const router = Router()
// Declared before the generic (admin-only) CRUD router so `/me` is not captured by `/:id`.
router.get('/me', ...authenticated, controller.listMine)
router.get('/me/:rockId', ...authenticated, controller.getMine)
module.exports = router
