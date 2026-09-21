const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')

class Role extends Model {
    static id
    static name
}

Role.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    }
}, {
    sequelize: db,
    modelName: 'Role',
    tableName: 'role',
    timestamps: true,
    paranoid: true
})

Role.associate = (models) => {
    Role.hasMany(models.User, {
        foreignKey: 'roleId',
        as: 'users'
    })
}

module.exports = Role
