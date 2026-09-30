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
    },
    // Unlock rule: `conditionType` reached `conditionValue`. Null means the achievement is not evaluated automatically.
    conditionType: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isIn: [['distinct_rocks', 'total_recognitions']] }
    },
    conditionValue: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 1 }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
