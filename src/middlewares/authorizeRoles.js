// Must run after validateToken: it relies on `req.user.role` being loaded.
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'No estás autorizado para ingresar a esta función.' })
  if (!allowedRoles.includes(req.user.role?.name)) return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' })
  return next()
}

module.exports = authorizeRoles
