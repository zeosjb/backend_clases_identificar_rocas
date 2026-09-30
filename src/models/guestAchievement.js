const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')

// Achievements unlocked during a guest session (the guest equivalent of UserAchievement).
class GuestAchievement extends Model {}

GuestAchievement.init({
    guestSessionId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    achievementId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    unlockedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize: db,
    modelName: 'GuestAchievement',
    tableName: 'guest_achievement',
    timestamps: true
})

GuestAchievement.associate = (models) => {
    GuestAchievement.belongsTo(models.Achievement, { foreignKey: 'achievementId', as: 'achievement' })
}

module.exports = GuestAchievement
