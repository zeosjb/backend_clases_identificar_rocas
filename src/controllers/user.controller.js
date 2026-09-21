const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')

const User = require('../models/user')

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const register = async (req, res) => {
    try {
        const { userName, email, password, phone, roleId } = req.body

        if (!userName || !email || !password || !roleId) {
            return res.status(400).json({ message: 'userName, email, password y roleId son obligatorios' })
        }
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'El correo electrónico no es válido' })
        }
        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' })
        }
        if (!Number.isInteger(Number(roleId))) {
            return res.status(400).json({ message: 'roleId debe ser numérico' })
        }

        const existingUser = await User.findOne({
            where: { [Op.or]: [{ userName }, { email }] }
        })
        if (existingUser) {
            return res.status(409).json({ message: 'El nombre de usuario o correo ya existe' })
        }

        const hashedPassword = await bcryptjs.hash(password, 10)
        const user = await User.create({
            userName,
            email,
            password: hashedPassword,
            phone: phone || null,
            roleId: Number(roleId)
        })

        return res.status(201).json({ message: 'Registro realizado correctamente', user })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: 'email y password son obligatorios' })
        }

        const user = await User.findOne({ where: { email } })
        const validPassword = user && await bcryptjs.compare(password, user.password)
        if (!validPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' })
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, roleId: user.roleId },
            process.env.JWT_SECRET || 'dev-secret-change-me',
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        )

        return res.status(200).json({ message: 'Inicio de sesión correcto', token, user })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}

module.exports = {
    register,
    login
}
