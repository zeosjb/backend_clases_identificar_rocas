const fs = require('node:fs')
const path = require('node:path')

const ADMIN = { email: 'admin.test@example.test', password: 'AdminPass123!' }

// Boots the real Express app against a throwaway SQLite file so tests never touch src/database/rock.sqlite.
// Call this before requiring anything else from src/: DATABASE_NAME is read when the config module loads.
async function bootTestApp(label) {
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_NAME = `test_${label}_${process.pid}_${Date.now()}`
  const models = require('../../src/models')
  const { createApp } = require('../../src/app')
  const { seedDemoData } = require('../../src/database/seedDemoData')
  const { seedAdminUser } = require('../../src/database/seedAdmin')
  await models.sequelize.sync()
  await seedDemoData(models)
  await seedAdminUser(models, { ADMIN_EMAIL: ADMIN.email, ADMIN_PASSWORD: ADMIN.password })

  const server = await new Promise(resolve => { const listener = createApp().listen(0, () => resolve(listener)) })
  const baseUrl = `http://127.0.0.1:${server.address().port}`

  const request = async (method, url, { token, guestToken, body } = {}) => {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    if (guestToken) headers['X-Guest-Token'] = guestToken
    const response = await fetch(`${baseUrl}${url}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
    const text = await response.text()
    return { status: response.status, body: text ? JSON.parse(text) : null }
  }

  const login = async (email, password) => (await request('POST', '/api/user/login', { body: { email, password } })).body.token
  const registerAndLogin = async (name, password = 'Password123!') => {
    const email = `${name}@example.test`
    const registration = await request('POST', '/api/user/registro', { body: { userName: name, email, password } })
    return { registration, token: await login(email, password), email }
  }

  const storage = models.sequelize.options.storage
  const close = async () => {
    server.closeAllConnections?.()
    await new Promise(resolve => server.close(resolve))
    await models.sequelize.close()
    if (path.basename(storage).startsWith('test_')) fs.rmSync(storage, { force: true })
  }
  return { models, request, login, registerAndLogin, adminToken: () => login(ADMIN.email, ADMIN.password), close }
}

module.exports = { bootTestApp, ADMIN }
