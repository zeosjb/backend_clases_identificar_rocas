const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')

// One row per (owner, rock): repeated recognitions only increase `recognitionCount`.
// The owner is either a registered user or a guest session, never both.
class Collection extends Model {
    static id
}

Collection.init({
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
    firstDiscoveredAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    recognitionCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize: db,
    modelName: 'Collection',
    tableName: 'collection',
    timestamps: true,
    paranoid: true,
    indexes: [
        { unique: true, fields: ['userId', 'rockId'] },
        { unique: true, fields: ['guestSessionId', 'rockId'] }
    ]
})

Collection.associate = (models) => {
    Collection.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
    Collection.belongsTo(models.GuestSession, { foreignKey: 'guestSessionId', as: 'guestSession' })
    Collection.belongsTo(models.Rock, { foreignKey: 'rockId', as: 'rock' })
}

module.exports = Collection
