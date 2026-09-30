const { buildListOptions } = require('../utils/queryOptions')
const { HttpError } = require('../utils/httpError')

// `filterFields`: query parameters matched exactly (e.g. ?typeId=2). `beforeRemove(item)` may throw an HttpError to veto a delete.
const createCrudService = ({ model, searchableFields = [], allowedFields = null, keyFields = null, filterFields = [], beforeRemove = null }) => {
  const sanitize = data => {
    const input = { ...data }
    for (const field of ['id', ...(keyFields || []), 'createdAt', 'updatedAt', 'deletedAt']) delete input[field]
    if (allowedFields) return Object.fromEntries(Object.entries(input).filter(([key]) => allowedFields.includes(key)))
    return input
  }
  const buildFilters = query => {
    const filters = {}
    for (const field of filterFields) {
      if (query[field] === undefined) continue
      const value = Number(query[field])
      if (typeof query[field] !== 'string' || !Number.isInteger(value) || value < 1) throw new HttpError(400, `${field} debe ser un entero positivo`)
      filters[field] = value
    }
    return filters
  }
  const findByKey = key => keyFields
    ? model.findOne({ where: Object.fromEntries(keyFields.map(field => [field, key[field]])) })
    : model.findByPk(key)
  return {
    async list(query = {}) {
      const options = buildListOptions(query, searchableFields)
      options.where = { ...options.where, ...buildFilters(query) }
      options.order = (keyFields || [model.primaryKeyAttribute || 'id']).map(field => [field, 'ASC'])
      const result = await model.findAndCountAll(options)
      return { items: result.rows, total: result.count, page: Number(query.page || 1), limit: options.limit }
    },
    find: findByKey,
    create(data) { return model.create(sanitize(data)) },
    async update(key, data) {
      const item = await findByKey(key)
      if (!item) return null
      await item.update(sanitize(data))
      return item
    },
    async remove(key) {
      const item = await findByKey(key)
      if (!item) return false
      if (beforeRemove) await beforeRemove(item)
      await item.destroy()
      return true
    }
  }
}
module.exports = { createCrudService }
