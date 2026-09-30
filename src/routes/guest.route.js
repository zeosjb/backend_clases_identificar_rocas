const { Router } = require('express')
const { guestSessions } = require('./recognition.route')
const { createResolveActor } = require('../middlewares/resolveActor')
const { createGuestController } = require('../controllers/recognition.controller')

const controller = createGuestController(guestSessions)
const router = Router()
router.post('/session', controller.createSession)
router.get('/session', createResolveActor(guestSessions), controller.getSession)
module.exports = router
