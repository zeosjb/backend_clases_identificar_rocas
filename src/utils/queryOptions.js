const { Op } = require('sequelize')

const parsePositiveInteger = (value, fallback, name) => {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} debe ser un entero positivo`)
  return parsed
}

const buildListOptions = ({ page, limit, search, searchBy }, searchableFields = []) => {
  const currentPage = parsePositiveInteger(page, 1, 'page')
  const pageSize = Math.min(parsePositiveInteger(limit, 20, 'limit'), 100)
  if (searchBy && !searchableFields.includes(searchBy)) throw new Error('searchBy no es un campo permitido')
  const fields = searchBy ? [searchBy] : searchableFields
  const where = search && fields.length
    ? { [Op.or]: fields.map(field => ({ [field]: { [Op.like]: `%${String(search).trim()}%` } })) }
    : {}
  return { limit: pageSize, offset: (currentPage - 1) * pageSize, where, order: [['id', 'ASC']] }
}
module.exports = { buildListOptions }
