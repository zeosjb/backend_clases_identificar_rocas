const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const models = require('./models')

const createApp = () => {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use(morgan('dev'))
  app.use('/api/user', require('./routes/user.route'))
  app.use('/api/rock', require('./routes/rock.route'))
  const resources = {
    category: [models.Category, 'Categoría', ['name', 'description']],
    type: [models.Type, 'Tipo', ['name']],
    role: [models.Role, 'Rol', ['name']],
    achievement: [models.Achievement, 'Logro', ['name', 'slug', 'description']],
    analysis: [models.Analysis, 'Análisis', ['result', 'note']],
    collection: [models.Collection, 'Colección', []],
    'user-achievement': [models.UserAchievement, 'Logro de usuario', []]
  }
  for (const [path, [model, name, searchableFields]] of Object.entries(resources)) {
    app.use(`/api/${path}`, require('./routes/crud.route')(model, { name, searchableFields }))
  }
  app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }))
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error)
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Los datos no son válidos', details: error.errors?.map(item => item.message) })
    }
    if (error.message?.includes('debe ser un entero positivo') || error.message?.includes('searchBy')) return res.status(400).json({ message: error.message })
    console.error(error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  })
  return app
}
module.exports = { createApp }
