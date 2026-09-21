const Rock = require('../models/rock')

const requiredFields = ['index', 'name', 'scientificName', 'composition', 'formula', 'environment', 'commonUses', 'hardness', 'streak', 'color', 'texture', 'density', 'transparency', 'tenacity', 'imgUrl', 'mindatUrl', 'typeId', 'categoryId']

const create = async (req, res) => {
    try {
        const missing = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null || req.body[field] === '')
        if (missing.length) return res.status(400).json({ message: `Campos obligatorios faltantes: ${missing.join(', ')}` })
        const data = { ...req.body, index: Number(req.body.index), typeId: Number(req.body.typeId), categoryId: Number(req.body.categoryId) }
        if (![data.index, data.typeId, data.categoryId].every(Number.isInteger)) return res.status(400).json({ message: 'index, typeId y categoryId deben ser enteros' })

        const existingRock = await Rock.findOne({ where: { scientificName: data.scientificName } })
        if (existingRock) {
            return res.status(400).json({message: 'No puede añadir una roca que ya este en el sistema.'})
        }

        const rock = await Rock.create(data)

        res.status(201).json({
            message: 'Se ha añadido satisfactoriamente la roca.', rock
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Error interno del Servidor, intente nuevamente."
        })
    }
}

const obtain = async (req, res) => {
    try {
        const rocks = await Rock.findAll()

        // Validación de que no existan rocas en el sistema.

        return res.status(200).json({
            message: "Rocas Obtenidas satisfactoriamente.",
            rocks: rocks
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Error interno del Servidor, intente nuevamente."
        })
    }
}

const obtainById = async (req, res) => {
    const rock = await Rock.findByPk(req.params.id)
    if (!rock) return res.status(404).json({ message: 'Roca no encontrada' })
    return res.json(rock)
}

const update = async (req, res) => {
    const rock = await Rock.findByPk(req.params.id)
    if (!rock) return res.status(404).json({ message: 'Roca no encontrada' })
    await rock.update(req.body)
    return res.json({ message: 'Roca actualizada correctamente', rock })
}

const deleteRock = async (req, res) => {
    const rock = await Rock.findByPk(req.params.id)
    if (!rock) return res.status(404).json({ message: 'Roca no encontrada' })
    await rock.destroy()
    return res.json({ message: 'Roca eliminada correctamente' })
}

module.exports = {
    create,
    obtain,
    obtainById,
    update,
    deleteRock
}
