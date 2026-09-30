const crypto = require('node:crypto')
const { HttpError } = require('../utils/httpError')

const GUEST_RECOGNITION_LIMIT = 10
const hashToken = token => crypto.createHash('sha256').update(token).digest('hex')

const createGuestSessionService = ({
  GuestSession,
  limit = GUEST_RECOGNITION_LIMIT,
  ttlHours = Number(process.env.GUEST_SESSION_TTL_HOURS) || 72,
  now = () => new Date()
}) => ({
  limit,
  // The raw token is returned once and never stored; only its hash is persisted.
  async create() {
    const token = crypto.randomBytes(32).toString('hex')
    const session = await GuestSession.create({ tokenHash: hashToken(token), expiresAt: new Date(now().getTime() + ttlHours * 3600 * 1000) })
    return { token, session }
  },
  async authenticate(token, options = {}) {
    if (typeof token !== 'string' || !token) throw new HttpError(401, 'Se requiere un token de sesión de invitado o un token Bearer')
    const session = await GuestSession.findOne({ where: { tokenHash: hashToken(token) }, ...options })
    if (!session) throw new HttpError(401, 'La sesión de invitado no es válida')
    if (session.status !== 'active') throw new HttpError(401, 'La sesión de invitado ya no está activa')
    if (session.expiresAt <= now()) throw new HttpError(401, 'La sesión de invitado expiró')
    return session
  },
  describe(session) {
    return {
      status: session.status,
      recognitionCount: session.recognitionCount,
      limit,
      remaining: Math.max(limit - session.recognitionCount, 0),
      expiresAt: session.expiresAt
    }
  }
})

module.exports = { createGuestSessionService, GUEST_RECOGNITION_LIMIT, hashToken }
