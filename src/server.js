require('dotenv').config()
const { createApp } = require('./app')
const models = require('./models')
const { sequelize } = models
const { seedDemoData } = require('./database/seedDemoData')
const PORT = process.env.PORT || 8080

const start = async ({ database = sequelize, modelSet = models, seed = seedDemoData, appFactory = createApp, port = PORT, logger = console } = {}) => {
  try {
    await database.authenticate()
    await database.sync()
    await seed(modelSet)
    return appFactory().listen(port, () => logger.log(`API disponible en http://localhost:${port}`))
  } catch (error) {
    logger.error('No se pudo iniciar la API, preparar la base de datos o cargar los datos de demostracion.', error)
    throw error
  }
}
if (require.main === module) start().catch(() => { process.exitCode = 1 })
module.exports = { start }
