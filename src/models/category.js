const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')

class Category extends Model {
    static id
    static name
    static description
}

Category.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    }

}, {
    sequelize: db,
    modelName: 'Category',
    tableName: 'category',
    timestamps: true,
    paranoid: true
})

Category.associate = (models) => {
    Category.hasMany(models.Rock, { foreignKey: 'categoryId', as: 'rocks' })
}

module.exports = Category
