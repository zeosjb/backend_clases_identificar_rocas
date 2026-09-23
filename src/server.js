require('dotenv').config()
const { createApp } = require('./app')
const { sequelize } = require('./models')
const PORT = process.env.PORT || 8080

const start = async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync()
    createApp().listen(PORT, () => console.log(`API disponible en http://localhost:${PORT}`))
  } catch (error) {
    console.error('No se pudo iniciar la API o conectar la base de datos.', error)
    process.exitCode = 1
  }
}
if (require.main === module) start()
module.exports = { start }
