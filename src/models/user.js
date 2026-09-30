const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')
class User extends Model {}
User.init({
  roleId: { type: DataTypes.INTEGER, allowNull: false },
  userName: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: true, unique: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active', validate: { isIn: [['active', 'blocked']] } }
},{ sequelize: db, modelName: 'User', tableName: 'user', timestamps: true, paranoid: true })
User.prototype.toJSON = function () { const values = { ...this.get() }; delete values.password; return values }
User.associate = models => {
  User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' })
  User.hasMany(models.Collection, { foreignKey: 'userId', as: 'collections' })
  User.hasMany(models.Analysis, { foreignKey: 'userId', as: 'analyses' })
  User.belongsToMany(models.Achievement, { through: models.UserAchievement, foreignKey: 'userId', otherKey: 'achievementId', as: 'achievements' })
}
module.exports = User
