const jwt = require('jsonwebtoken')

const generateToken = (id = '') => {
    return new Promise((resolve, reject) => {
        const payload = { id }

        jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1h'},
            (error, token) => {
                if (error) {
                    console.log(error)
                    reject('La generación de token falló.')
                } else {
                    console.log('El token se generó satisfactoriamente.')
                    resolve(token)
                }
            }
        )
    })
}

module.exports = generateToken