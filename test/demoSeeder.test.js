const test = require('node:test')
const assert = require('node:assert/strict')
const { seedDemoData } = require('../src/database/seedDemoData')

test('seeds reference data before rocks and reuses existing rows without overwriting', async () => {
  const tables = { Type: [], Category: [], Role: [], Achievement: [], Rock: [] }
  const models = Object.fromEntries(Object.keys(tables).map(name => [name, {
    findOne: async ({ where }) => tables[name].find(row => Object.entries(where).every(([key, value]) => row[key] === value)) || null,
    create: async row => { const created = { id: tables[name].length + 1, ...row }; tables[name].push(created); return created }
  }]))
  await seedDemoData(models)
  const originalName = tables.Rock[0].name
  tables.Rock[0].name = 'My edited rock'
  await seedDemoData(models)
  assert.ok(tables.Type.length > 0)
  assert.ok(tables.Category.length > 0)
  assert.ok(tables.Role.length > 0)
  assert.ok(tables.Achievement.length > 0)
  assert.ok(tables.Rock.length >= 3)
  assert.equal(tables.Rock[0].name, 'My edited rock')
  assert.equal(tables.Rock.length, new Set(tables.Rock.map(row => row.scientificName)).size)
})
test("chooses an unused deterministic index when a user rock already owns a demo index", async () => {
  const tables = { Type: [], Category: [], Role: [], Achievement: [], Rock: [{ id: 99, index: 1, scientificName: 'User specimen', name: 'My rock' }] }
  const models = Object.fromEntries(Object.keys(tables).map(name => [name, {
    findOne: async ({ where }) => tables[name].find(row => Object.entries(where).every(([key, value]) => row[key] === value)) || null,
    create: async row => { const created = { id: tables[name].length + 1, ...row }; tables[name].push(created); return created }
  }]))

  await seedDemoData(models)
  const userRock = tables.Rock.find(row => row.scientificName === 'User specimen')
  const seededBasalt = tables.Rock.find(row => row.scientificName === 'Basalt')
  assert.equal(userRock.index, 1)
  assert.equal(seededBasalt.index, 2)
  assert.equal(tables.Rock.length, new Set(tables.Rock.map(row => row.index)).size)
})
