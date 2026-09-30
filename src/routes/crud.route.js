const { Router } = require('express')
const { createCrudService } = require('../services/crudService')
const { createCrudController } = require('../controllers/crud.controller')

// `readMiddlewares` guard GET routes and `writeMiddlewares` guard POST/PATCH/DELETE (e.g. admin-only writes, public reads).
const createCrudRouter = (model, { name, searchableFields = [], allowedFields = null, keyFields = null, filterFields = [], beforeRemove = null, readMiddlewares = [], writeMiddlewares = [] }) => {
  const router = Router()
  const service = createCrudService({ model, searchableFields, allowedFields, keyFields, filterFields, beforeRemove })
  const controller = createCrudController(service, name, keyFields)
  const itemPath = keyFields ? `/${keyFields.map(field => `:${field}`).join('/')}` : '/:id'
  router.get('/', ...readMiddlewares, controller.list)
  router.post('/', ...writeMiddlewares, controller.create)
  router.get(itemPath, ...readMiddlewares, controller.get)
  router.patch(itemPath, ...writeMiddlewares, controller.update)
  router.delete(itemPath, ...writeMiddlewares, controller.remove)
  return router
}
module.exports = createCrudRouter
