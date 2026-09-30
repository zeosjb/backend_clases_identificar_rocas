const validateToken = require('./validateToken')
const authorizeRoles = require('./authorizeRoles')
const { ROLE_NAMES } = require('../utils/roles')

// Reusable middleware chains: `router.post('/', ...adminOnly, handler)`.
const adminOnly = [validateToken, authorizeRoles(ROLE_NAMES.ADMIN)]
const authenticated = [validateToken]

module.exports = { adminOnly, authenticated }
