const { Router } = require('express')
const { createCrudService } = require('../services/crudService')
const { createCrudController } = require('../controllers/crud.controller')

const createCrudRouter = (model, { name, searchableFields = [], allowedFields = null, keyFields = null }) => {
  const router = Router()
  const service = createCrudService({ model, searchableFields, allowedFields, keyFields })
  const controller = createCrudController(service, name, keyFields)
  const itemPath = keyFields ? `/${keyFields.map(field => `:${field}`).join('/')}` : '/:id'
  router.get('/', controller.list)
  router.post('/', controller.create)
  router.get(itemPath, controller.get)
  router.patch(itemPath, controller.update)
  router.delete(itemPath, controller.remove)
  return router
}
module.exports = createCrudRouter
