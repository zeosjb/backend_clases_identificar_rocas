const createCrudController = (service, resourceName, keyFields = null) => {
  const keyFromRequest = params => keyFields
    ? Object.fromEntries(keyFields.map(field => [field, params[field]]))
    : params.id
  return ({
  list: async (req, res, next) => {
    try { return res.json(await service.list(req.query)) } catch (error) { return next(error) }
  },
  get: async (req, res, next) => {
    try {
      const item = await service.find(keyFromRequest(req.params))
      return item ? res.json(item) : res.status(404).json({ message: `${resourceName} no encontrado` })
    } catch (error) { return next(error) }
  },
  create: async (req, res, next) => {
    try { return res.status(201).json(await service.create(req.body)) } catch (error) { return next(error) }
  },
  update: async (req, res, next) => {
    try {
      const item = await service.update(keyFromRequest(req.params), req.body)
      return item ? res.json(item) : res.status(404).json({ message: `${resourceName} no encontrado` })
    } catch (error) { return next(error) }
  },
  remove: async (req, res, next) => {
    try {
      const removed = await service.remove(keyFromRequest(req.params))
      return removed ? res.status(204).end() : res.status(404).json({ message: `${resourceName} no encontrado` })
    } catch (error) { return next(error) }
  }
})
}

module.exports = { createCrudController }
