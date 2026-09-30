// Decides who is acting: a registered user (Bearer token already resolved by validateToken.optional) or a guest
// (X-Guest-Token header). Sets `req.actor = { kind, id }` (plus `req.guestSession` for guests) or fails with 401.
const createResolveActor = guestSessions => async (req, res, next) => {
  try {
    if (req.user) {
      req.actor = { kind: 'user', id: req.user.id }
      return next()
    }
    const session = await guestSessions.authenticate(req.header('X-Guest-Token'))
    req.guestSession = session
    req.actor = { kind: 'guest', id: session.id }
    return next()
  } catch (error) {
    return next(error)
  }
}

module.exports = { createResolveActor }
