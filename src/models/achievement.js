const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')

class Achievement extends Model {
    static id
    static slug
    static name
    static description
    static experience
}

Achievement.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    experience: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false
    }
}, {
    sequelize: db,
    modelName: 'Achievement',
    tableName: 'achievement',
    timestamps: true,
    paranoid: true
})

Achievement.associate = (models) => {
    Achievement.belongsToMany(models.User, {
        through: models.UserAchievement,
        foreignKey: 'achievementId',
        otherKey: 'userId',
        as: 'users'
    })
}

module.exports = Achievement
