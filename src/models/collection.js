const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')

class Collection extends Model {
    static id
}

Collection.init({
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rockId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize: db,
    modelName: 'Collection',
    tableName: 'collection',
    timestamps: true,
    paranoid: true
})

Collection.associate = (models) => {
    Collection.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
    Collection.belongsTo(models.Rock, { foreignKey: 'rockId', as: 'rock' })
}

module.exports = Collection
