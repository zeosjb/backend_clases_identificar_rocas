const bcryptjs = require('bcryptjs')
const { ROLE_NAMES } = require('../utils/roles')

// Development-only fallback so the classroom demo works out of the box. Override with ADMIN_EMAIL / ADMIN_PASSWORD.
const DEV_ADMIN = { email: 'admin@example.test', password: 'ChangeMe123!' }

async function seedAdminUser(models, env = process.env) {
  const { User, Role } = models
  if (env.NODE_ENV === 'production' && !env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD is required in production.')
  const email = env.ADMIN_EMAIL || DEV_ADMIN.email
  const password = env.ADMIN_PASSWORD || DEV_ADMIN.password
  if (password.length < 8) throw new Error('ADMIN_PASSWORD must have at least 8 characters.')

  const role = await Role.findOne({ where: { name: ROLE_NAMES.ADMIN } })
  if (!role) throw new Error('Cannot seed admin user: the Admin role is missing.')

  // Never overwrite an existing account: the administrator may have changed the password already.
  const existing = await User.findOne({ where: { email }, paranoid: false })
  if (existing) return existing
  return User.create({ userName: env.ADMIN_USERNAME || 'admin', email, password: await bcryptjs.hash(password, 10), roleId: role.id })
}

module.exports = { seedAdminUser }
