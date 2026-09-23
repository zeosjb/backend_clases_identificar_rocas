const path = require('node:path')
const { Sequelize } = require('sequelize')

const databaseName = process.env.DATABASE_NAME || 'rock'
if (!/^[a-zA-Z0-9_-]+$/.test(databaseName)) {
  throw new Error('DATABASE_NAME must contain only letters, numbers, hyphens, and underscores.')
}

const db = new Sequelize({
  dialect: 'sqlite',
  logging: false,
  storage: path.resolve(__dirname, '..', 'database', `${databaseName}.sqlite`)
})

module.exports = db
