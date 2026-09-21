const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')

class Type extends Model {
    static id
    static name
}

Type.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    }
}, {
    sequelize: db,
    modelName: 'Type',
    tableName: 'type',
    timestamps: true,
    paranoid: true
})

Type.associate = (models) => {
    Type.hasMany(models.Rock, { foreignKey: 'typeId', as: 'rocks' })
}

module.exports = Type
