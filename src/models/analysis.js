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
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rockId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    confidence: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false
    },
    result: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    note: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    }
}, {
    sequelize: db,
    modelName: 'Analysis',
    tableName: 'analysis',
    timestamps: true,
    paranoid: true
})

Analysis.associate = (models) => {
    Analysis.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
    Analysis.belongsTo(models.Rock, { foreignKey: 'rockId', as: 'rock' })
}

module.exports = Analysis
