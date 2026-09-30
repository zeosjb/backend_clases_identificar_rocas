const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')

// Temporary identity for people who use the app without an account. Only the SHA-256 hash of the token is stored,
// so a leaked database does not leak usable sessions.
class GuestSession extends Model {}

GuestSession.init({
    tokenHash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    recognitionCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active',
        validate: { isIn: [['active', 'transferred']] }
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    // Set when the session data moves to an account (guest migration); a transferred session can never be reused.
    transferredToUserId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    sequelize: db,
    modelName: 'GuestSession',
    tableName: 'guest_session',
    timestamps: true
})

GuestSession.associate = (models) => {
    GuestSession.hasMany(models.Analysis, { foreignKey: 'guestSessionId', as: 'analyses' })
    GuestSession.hasMany(models.Collection, { foreignKey: 'guestSessionId', as: 'collections' })
    GuestSession.hasMany(models.GuestAchievement, { foreignKey: 'guestSessionId', as: 'achievements' })
}

module.exports = GuestSession
