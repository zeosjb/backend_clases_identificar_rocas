const { Router } = require('express')
const createCrudRouter = require('./crud.route')
const models = require('../models')
const { adminOnly } = require('../middlewares/guards')
const { HttpError } = require('../utils/httpError')

// Types and categories share one shape: public reads, admin writes, unique names, no deleting while rocks depend on them,
// plus `/:id/rocks` to list the rocks that belong to them. `foreignKey` is the Rock column pointing at this resource.
const createTaxonomyRouter = (model, { name, foreignKey, searchableFields, allowedFields }) => {
  const router = Router()
  router.get('/:id/rocks', async (req, res, next) => {
    try {
      const item = await model.findByPk(req.params.id)
      if (!item) return res.status(404).json({ message: `${name} no encontrado` })
      const rocks = await models.Rock.findAll({ where: { [foreignKey]: item.id }, order: [['id', 'ASC']] })
      return res.json({ [name === 'Tipo' ? 'type' : 'category']: item, total: rocks.length, rocks })
    } catch (error) { return next(error) }
  })
  const beforeRemove = async item => {
    if (await models.Rock.count({ where: { [foreignKey]: item.id } })) throw new HttpError(409, `No se puede eliminar: existen rocas asociadas a este ${name.toLowerCase()}`)
  }
  router.use('/', createCrudRouter(model, { name, searchableFields, allowedFields, beforeRemove, writeMiddlewares: adminOnly }))
  return router
}

module.exports = { createTaxonomyRouter }
