// Translates service results into HTTP. Errors (validation, guest limit) are HttpErrors handled by the global error middleware.
const createRecognitionController = service => ({
  create: async (req, res, next) => {
    try { return res.status(201).json(await service.recognize(req.actor, req.body)) } catch (error) { return next(error) }
  }
})

const createGuestController = guestSessions => ({
  createSession: async (req, res, next) => {
    try {
      const { token, session } = await guestSessions.create()
      // The token is shown only here: the client must keep it and send it as X-Guest-Token.
      return res.status(201).json({ token, ...guestSessions.describe(session) })
    } catch (error) { return next(error) }
  },
  getSession: (req, res) => res.json(guestSessions.describe(req.guestSession))
})

const createCollectionController = service => ({
  listMine: async (req, res, next) => {
    try { return res.json(await service.listForUser(req.user.id)) } catch (error) { return next(error) }
  },
  getMine: async (req, res, next) => {
    try {
      const rockId = Number(req.params.rockId)
      const entry = Number.isInteger(rockId) ? await service.findForUser(req.user.id, rockId) : null
      return entry ? res.json(entry) : res.status(404).json({ message: 'La roca no está en tu colección' })
    } catch (error) { return next(error) }
  }
})

module.exports = { createRecognitionController, createGuestController, createCollectionController }
