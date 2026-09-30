const createCollectionService = ({ models }) => ({
  // Users only ever read their own collection: the owner comes from the token, never from the URL.
  async listForUser(userId) {
    const items = await models.Collection.findAll({
      where: { userId },
      include: [{ model: models.Rock, as: 'rock' }],
      order: [['firstDiscoveredAt', 'ASC'], ['id', 'ASC']]
    })
    return { items, total: items.length } // total = number of different rocks discovered
  },
  findForUser(userId, rockId) {
    return models.Collection.findOne({ where: { userId, rockId }, include: [{ model: models.Rock, as: 'rock' }] })
  }
})

module.exports = { createCollectionService }
