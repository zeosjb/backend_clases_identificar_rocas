const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const models = require('./models')
const { adminOnly } = require('./middlewares/guards')
const { HttpError } = require('./utils/httpError')

const createApp = () => {
  const app = express()
  app.use(cors())
  app.use(express.json())
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))
  app.use('/api/user', require('./routes/user.route'))
  app.use('/api/rock', require('./routes/rock.route'))
  // Reference data is public to read and admin-only to change; roles and raw records are admin-only.
  const { createTaxonomyRouter } = require('./routes/taxonomy.route')
  app.use('/api/category', createTaxonomyRouter(models.Category, { name: 'Categoría', foreignKey: 'categoryId', searchableFields: ['name', 'description'], allowedFields: ['name', 'description'] }))
  app.use('/api/type', createTaxonomyRouter(models.Type, { name: 'Tipo', foreignKey: 'typeId', searchableFields: ['name'], allowedFields: ['name'] }))
  const resources = {
    role: [models.Role, 'Rol', ['name'], { readMiddlewares: adminOnly, writeMiddlewares: adminOnly }],
    achievement: [models.Achievement, 'Logro', ['name', 'slug', 'description'], { writeMiddlewares: adminOnly }],
    analysis: [models.Analysis, 'Análisis', ['result', 'note'], { readMiddlewares: adminOnly, writeMiddlewares: adminOnly }],
    collection: [models.Collection, 'Colección', [], { readMiddlewares: adminOnly, writeMiddlewares: adminOnly }],
    'user-achievement': [models.UserAchievement, 'Logro de usuario', [], { readMiddlewares: adminOnly, writeMiddlewares: adminOnly }]
  }
  for (const [path, [model, name, searchableFields, guards]] of Object.entries(resources)) {
    app.use(`/api/${path}`, require('./routes/crud.route')(model, { name, searchableFields, ...guards }))
  }
  app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }))
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error)
    if (error instanceof HttpError) return res.status(error.status).json({ message: error.message, code: error.code })
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido' })
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
