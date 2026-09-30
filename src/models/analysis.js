const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')

class Analysis extends Model {
    static id
    static image_url
    static confidence
    static result
    static note
}

Analysis.init({
    // Exactly one owner: a registered user or a guest session (checked by `hasOneOwner` below).
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    guestSessionId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    rockId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false
    },
    // Model confidence as a percentage (0-100).
    confidence: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
        validate: { min: 0, max: 100 }
    },
    result: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    note: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false
    }
}, {
    sequelize: db,
    modelName: 'Analysis',
    tableName: 'analysis',
    timestamps: true,
    paranoid: true,
    validate: {
        hasOneOwner() {
            if ((this.userId == null) === (this.guestSessionId == null)) throw new Error('Analysis needs exactly one owner: userId or guestSessionId')
        }
    }
})

Analysis.associate = (models) => {
    Analysis.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
    Analysis.belongsTo(models.GuestSession, { foreignKey: 'guestSessionId', as: 'guestSession' })
    Analysis.belongsTo(models.Rock, { foreignKey: 'rockId', as: 'rock' })
}

module.exports = Analysis
