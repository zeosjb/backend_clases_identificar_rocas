const test = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const path = require('node:path')

test('SQLite storage path is module-rooted and DATABASE_NAME rejects path traversal', () => {
  const configPath = path.resolve(__dirname, '../src/config/database.js')
  const script = `const db=require(${JSON.stringify(configPath)}); console.log(db.options.storage)`
  const storage = execFileSync(process.execPath, ['-e', script], { cwd: require('node:os').tmpdir(), env: { ...process.env, DATABASE_NAME: 'classroom' }, encoding: 'utf8' }).trim()
  assert.equal(storage, path.resolve(__dirname, '../src/database/classroom.sqlite'))
  const unsafeScript = `try { require(${JSON.stringify(configPath)}); process.exit(2) } catch (error) { console.log(error.message) }`
  const output = execFileSync(process.execPath, ['-e', unsafeScript], { cwd: require('node:os').tmpdir(), env: { ...process.env, DATABASE_NAME: '../outside' }, encoding: 'utf8' })
  assert.match(output, /DATABASE_NAME/)
})
