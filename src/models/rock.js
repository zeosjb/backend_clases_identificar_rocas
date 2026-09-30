const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')

class Rock extends Model {
    static id
    static index
    static name
    static scientificName
    static description
    static composition
    static formula
    static molarWeight
    static environment
    static commonUses
    static hardness
    static streak
    static color
    static texture
    static density
    static transparency
    static tenacity
    static imgUrl
    static mindatUrl
}

Rock.init({
    typeId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    index: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
        validate: { notEmpty: true }
    },
    scientificName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    composition: {
        type: DataTypes.STRING,
        allowNull: false
    },
    formula: {
        type: DataTypes.STRING,
        allowNull: false
    },
    molarWeight: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    environment: {
        type: DataTypes.STRING,
        allowNull: false
    },
    commonUses: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hardness: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 10 } // Mohs scale
    },
    streak: {
        type: DataTypes.STRING,
        allowNull: false
    },
    color: {
        type: DataTypes.STRING,
        allowNull: false
    },
    texture: {
        type: DataTypes.STRING,
        allowNull: false
    },
    density: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    transparency: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    tenacity: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    imgUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mindatUrl: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize: db,
    modelName: 'Rock',
    tableName: 'rock',
    timestamps: true,
    paranoid: true
})

Rock.associate = (models) => {
    Rock.belongsTo(models.Type, { foreignKey: 'typeId', as: 'type' })
    Rock.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' })
    Rock.hasMany(models.Collection, { foreignKey: 'rockId', as: 'collections' })
    Rock.hasMany(models.Analysis, { foreignKey: 'rockId', as: 'analyses' })
}

Rock.prototype.toJSON = function () {
    const { ...rock } = this.get()
    return rock
}

module.exports = Rock
