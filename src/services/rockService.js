const { Op } = require('sequelize')
const { HttpError } = require('../utils/httpError')

// Reads one numeric query value: missing, non-scalar, non-numeric and negative values are rejected before any database access.
const parseBound = value => {
  if (value === undefined || value === '') throw new HttpError(400, 'Los parámetros min y max son obligatorios')
  const parsed = typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(parsed) || parsed < 0) throw new HttpError(400, 'min y max deben ser numéricos y no negativos')
  return parsed
}

const createRockService = ({ Rock }) => ({
  // Rocks whose Mohs hardness is in [min, max], both limits included.
  async findByHardness({ min, max } = {}) {
    const lower = parseBound(min)
    const upper = parseBound(max)
    if (lower > upper) throw new HttpError(400, 'min no puede ser mayor que max')
    const rocks = await Rock.findAll({
      where: { hardness: { [Op.between]: [lower, upper] } },
      order: [['hardness', 'ASC'], ['id', 'ASC']]
    })
    return { min: lower, max: upper, total: rocks.length, rocks }
  }
})

module.exports = { createRockService }
