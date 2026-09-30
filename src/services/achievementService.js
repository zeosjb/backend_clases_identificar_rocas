const { Op } = require('sequelize')

// Owners are either registered users or guest sessions; each has its own column and unlock table.
const ownerConfig = models => ({
  user: { column: 'userId', UnlockModel: models.UserAchievement },
  guest: { column: 'guestSessionId', UnlockModel: models.GuestAchievement }
})

const createAchievementService = ({ models }) => ({
  // Unlocks every active achievement whose condition is now met and that the owner does not have yet.
  // Returns only the newly unlocked ones. Call it inside the same transaction that recorded the recognition.
  async evaluate(owner, { transaction } = {}) {
    const { column, UnlockModel } = ownerConfig(models)[owner.kind]
    const where = { [column]: owner.id }
    const stats = {
      distinct_rocks: await models.Collection.count({ where, transaction }),
      total_recognitions: await models.Analysis.count({ where, transaction })
    }
    const candidates = await models.Achievement.findAll({ where: { isActive: true, conditionType: { [Op.not]: null } }, transaction })
    const owned = new Set((await UnlockModel.findAll({ where, transaction })).map(row => row.achievementId))
    const unlocked = []
    for (const achievement of candidates) {
      if (owned.has(achievement.id) || stats[achievement.conditionType] < achievement.conditionValue) continue
      const unlockedAt = new Date()
      await UnlockModel.create({ ...where, achievementId: achievement.id, unlockedAt }, { transaction })
      unlocked.push({ id: achievement.id, slug: achievement.slug, name: achievement.name, experience: achievement.experience, unlockedAt })
    }
    return unlocked
  }
})

module.exports = { createAchievementService }
