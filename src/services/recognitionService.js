const { HttpError } = require('../utils/httpError')

// The recognition model is integrated later through an external API. Until then the client (or a test) sends the model's
// JSON result: { rockId, confidence (0-100), imageUrl?, note? }. This service does not classify images.
const parseModelResult = (body = {}) => {
  const rockId = typeof body.rockId === 'number' || typeof body.rockId === 'string' ? Number(body.rockId) : NaN
  if (!Number.isInteger(rockId) || rockId < 1) throw new HttpError(400, 'rockId es obligatorio y debe ser un entero positivo')
  const confidence = typeof body.confidence === 'number' ? body.confidence : NaN
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) throw new HttpError(400, 'confidence es obligatorio y debe estar entre 0 y 100')
  for (const [field, max] of [['imageUrl', 500], ['note', 255]]) {
    if (body[field] !== undefined && (typeof body[field] !== 'string' || body[field].length > max)) throw new HttpError(400, `${field} debe ser un texto de hasta ${max} caracteres`)
  }
  return { rockId, confidence: Math.round(confidence), imageUrl: body.imageUrl ?? null, note: body.note ?? null }
}

const createRecognitionService = ({ models, sequelize, guestSessions, achievements }) => ({
  // `actor` is { kind: 'user', id } or { kind: 'guest', id }. Everything happens in one transaction so a failed step
  // (for example the guest limit) never leaves a half-recorded recognition behind.
  async recognize(actor, body) {
    const input = parseModelResult(body)
    const rock = await models.Rock.findByPk(input.rockId)
    if (!rock) throw new HttpError(404, 'Roca no encontrada')
    const ownerWhere = actor.kind === 'user' ? { userId: actor.id } : { guestSessionId: actor.id }

    return sequelize.transaction(async transaction => {
      let session = null
      if (actor.kind === 'guest') {
        session = await models.GuestSession.findByPk(actor.id, { transaction })
        if (session.recognitionCount >= guestSessions.limit) {
          throw new HttpError(403, `Alcanzaste el límite de ${guestSessions.limit} reconocimientos para invitados. Crea una cuenta para continuar.`, 'GUEST_LIMIT_REACHED')
        }
        await session.update({ recognitionCount: session.recognitionCount + 1 }, { transaction })
      }

      const analysis = await models.Analysis.create({ ...ownerWhere, rockId: rock.id, image_url: input.imageUrl, confidence: input.confidence, result: rock.name, note: input.note }, { transaction })

      let entry = await models.Collection.findOne({ where: { ...ownerWhere, rockId: rock.id }, transaction })
      const newDiscovery = !entry
      if (entry) await entry.update({ recognitionCount: entry.recognitionCount + 1 }, { transaction })
      else entry = await models.Collection.create({ ...ownerWhere, rockId: rock.id, firstDiscoveredAt: new Date(), recognitionCount: 1 }, { transaction })

      const unlockedAchievements = await achievements.evaluate(actor, { transaction })
      return {
        analysis,
        collection: { rockId: entry.rockId, recognitionCount: entry.recognitionCount, firstDiscoveredAt: entry.firstDiscoveredAt },
        newDiscovery,
        unlockedAchievements,
        ...(session ? { guest: guestSessions.describe(session) } : {})
      }
    })
  }
})

module.exports = { createRecognitionService, parseModelResult }
