const jwt = require('jsonwebtoken')
const models = require('../models')

const UNAUTHORIZED = 'No estás autorizado para ingresar a esta función.'

// Resolves the Bearer token into `req.user` (with its role). `required: false` lets anonymous requests through
// but still rejects a token that is present and invalid.
const authenticate = ({ required }) => async (req, res, next) => {
  const authHeader = req.header('Authorization')
  if (!authHeader) return required ? res.status(401).json({ message: UNAUTHORIZED }) : next()

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: UNAUTHORIZED })

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me')
    const user = await models.User.findByPk(id, { include: [{ model: models.Role, as: 'role' }] })
    if (!user || user.status !== 'active') return res.status(401).json({ message: 'Usuario no autorizado, contacte soporte.' })
    req.user = user
    return next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(401).json({ message: 'Su sesión ha expirado, inicie sesión nuevamente.' })
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Token no válido o con formato no válido.' })
    console.error(error)
    return res.status(401).json({ message: 'Ha ocurrido un error inesperado.' })
  }
}

const validateToken = authenticate({ required: true })
validateToken.optional = authenticate({ required: false })

module.exports = validateToken
