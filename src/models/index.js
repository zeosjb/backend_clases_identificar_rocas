const User = require('./user')
const Rock = require('./rock')
const Achievement = require('./achievement')
const Analysis = require('./analysis')
const Category = require('./category')
const Collection = require('./collection')
const Role = require('./role')
const Type = require('./type')
const UserAchievement = require('./userAchievement')
const GuestSession = require('./guestSession')
const GuestAchievement = require('./guestAchievement')

const models = { User, Rock, Achievement, Analysis, Category, Collection, Role, Type, UserAchievement, GuestSession, GuestAchievement }
for (const model of Object.values(models)) if (model.associate) model.associate(models)
module.exports = { ...models, sequelize: require('../config/database') }
