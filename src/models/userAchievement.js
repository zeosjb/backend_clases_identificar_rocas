const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')

class UserAchievement extends Model {}

UserAchievement.init({
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    achievementId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    rockId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    sequelize: db,
    modelName: 'UserAchievement',
    tableName: 'user_achievement',
    timestamps: true
})

module.exports = UserAchievement
