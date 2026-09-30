const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')

const User = require('../models/user')
const Role = require('../models/role')
const { ROLE_NAMES } = require('../utils/roles')

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const register = async (req, res) => {
    try {
        // roleId is intentionally ignored: nobody can pick their own privileges at registration.
        const { userName, email, password, phone } = req.body

        if (!userName || !email || !password) {
            return res.status(400).json({ message: 'userName, email y password son obligatorios' })
        }
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'El correo electrónico no es válido' })
        }
        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' })
        }

        const existingUser = await User.findOne({
            where: { [Op.or]: [{ userName }, { email }] }
        })
        if (existingUser) {
            return res.status(409).json({ message: 'El nombre de usuario o correo ya existe' })
        }

        const [role] = await Role.findOrCreate({ where: { name: ROLE_NAMES.USER } })
        const hashedPassword = await bcryptjs.hash(password, 10)
        const user = await User.create({
            userName,
            email,
            password: hashedPassword,
            phone: phone || null,
            roleId: role.id
        })

        // TODO(student): accept an optional `guestToken` here and migrate the guest session data to this new account.
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
        if (user.status !== 'active') {
            return res.status(403).json({ message: 'La cuenta está bloqueada, contacte soporte.' })
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

const me = (req, res) => res.json(req.user)

// Only harmless profile fields can be edited here; role and status are never taken from the body.
const updateMe = async (req, res, next) => {
    try {
        const changes = {}
        for (const field of ['userName', 'phone']) {
            if (req.body[field] === undefined) continue
            if (typeof req.body[field] !== 'string' || !req.body[field].trim()) return res.status(400).json({ message: `${field} debe ser un texto no vacío` })
            changes[field] = req.body[field].trim()
        }
        await req.user.update(changes)
        return res.json(req.user)
    } catch (error) { return next(error) }
}

module.exports = {
    register,
    login,
    me,
    updateMe
}
