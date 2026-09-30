const { Router } = require('express')
const models = require('../models')
const createCrudRouter = require('./crud.route')
const { buildListOptions } = require('../utils/queryOptions')
const { adminOnly } = require('../middlewares/guards')
const router = Router()
// Demostración educativa: búsqueda textual sobre campos observables; no ejecuta reconocimiento por imagen.
router.get('/identificar', async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim()
    if (!query) return res.status(400).json({ message: 'El parámetro q es obligatorio' })
    const result = await models.Rock.findAndCountAll(buildListOptions({ search: query }, ['name', 'scientificName', 'composition', 'formula', 'environment', 'commonUses', 'color', 'streak', 'texture']))
    return res.json({ query, method: 'text-match', total: result.count, rocks: result.rows })
  } catch (error) { return next(error) }
})
router.use('/', createCrudRouter(models.Rock, { name: 'Roca', searchableFields: ['name', 'scientificName', 'composition', 'formula', 'environment', 'commonUses', 'hardness', 'streak', 'color', 'texture'], writeMiddlewares: adminOnly }))
module.exports = router
