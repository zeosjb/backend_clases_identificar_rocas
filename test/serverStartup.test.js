const test = require('node:test')
const assert = require('node:assert/strict')
const { start } = require('../src/server')

const silentLogger = { log() {}, error() {} }

test('server authenticates, syncs, seeds, then starts the app', async () => {
  const calls = []
  const listener = { listening: true }
  const result = await start({
    database: { authenticate: async () => calls.push('authenticate'), sync: async () => calls.push('sync') },
    modelSet: {},
    seed: async () => calls.push('seed'),
    appFactory: () => ({ listen: () => { calls.push('listen'); return listener } }),
    port: 0,
    logger: silentLogger
  })
  assert.equal(result, listener)
  assert.deepEqual(calls, ['authenticate', 'sync', 'seed', 'listen'])
})

test('server does not listen if database preparation fails', async () => {
  let listened = false
  await assert.rejects(start({
    database: { authenticate: async () => {}, sync: async () => { throw new Error('sync failed') } },
    modelSet: {},
    seed: async () => {},
    appFactory: () => ({ listen: () => { listened = true } }),
    logger: silentLogger
  }), /sync failed/)
  assert.equal(listened, false)
})
