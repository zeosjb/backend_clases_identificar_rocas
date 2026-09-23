const { response } = require('express')
const jwt = require('jsonwebtoken')

const User = require('../models/user')

const validateToken = async (req, res = response, next) => {
    const authHeader = req.header("Authorization")

    if (!authHeader) {
        return res.status(401).json({
            message: "No estás autorizado para ingresar a está función."
        })
    }

    const [scheme, token] = authHeader.split(' ')

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({
            message: "No estás autorizado para ingresar a está función."
        })
    }
    try {
        // Ocupar función obtainToken
        const { id } = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me')
        const user = await User.findByPk(id)

        if(!user || user.deletedAt) {
            return res.status(401).json({
                message: "Usuario no autorizado, contacte soporte."
            })
        }

        req.user = user
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Su sesión ha expirado, inicie sesión nuevamente."
            })
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: "Token no válido o con formato no válido."
            })
        }

        console.error(error)
        return res.status(401).json({
            message: "Ha ocurrido un error inesperado."
        })
    }
}

module.exports = validateToken
