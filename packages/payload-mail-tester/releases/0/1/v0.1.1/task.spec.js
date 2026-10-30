import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

describe('payload-mail-tester v0.1.1 release spec', () => {
  const pkgDir = path.resolve(import.meta.dirname, '../../../../')
  const taskPath = path.resolve(import.meta.dirname, 'task.md')
  const pkgJsonPath = path.resolve(pkgDir, 'package.json')
  const typesPath = path.resolve(pkgDir, 'types/index.d.ts')

  test('task specification file exists and is well-formed', () => {
    assert.ok(fs.existsSync(taskPath), 'task.md must exist in release directory')
    const content = fs.readFileSync(taskPath, 'utf8')
    assert.match(content, /payload-mail-tester: TypeScript Declarations & Package Exports/)
    assert.match(content, /v0\.1\.1/)
  })

  test('package.json contains proper types configuration and version 0.1.1', () => {
    assert.ok(fs.existsSync(pkgJsonPath), 'package.json must exist')
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))

    assert.equal(pkg.version, '0.1.1', 'version must be 0.1.1')
    assert.equal(pkg.types, 'types/index.d.ts', 'types field must point to types/index.d.ts')
    assert.ok(pkg.files.includes('types'), 'files array must include "types"')

    assert.ok(pkg.exports, 'exports must be defined')
    assert.ok(pkg.exports['.'], 'exports["."] must be defined')
    assert.equal(pkg.exports['.'].types, './types/index.d.ts', 'exports["."].types must be ./types/index.d.ts')
    assert.equal(pkg.exports['.'].import, './src/index.js', 'exports["."].import must be ./src/index.js')
  })

  test('types/index.d.ts exists and declares all public exports', () => {
    assert.ok(fs.existsSync(typesPath), 'types/index.d.ts must exist')
    const typesContent = fs.readFileSync(typesPath, 'utf8')

    assert.match(typesContent, /export function payloadMailTester/, 'must declare payloadMailTester')
    assert.match(typesContent, /payloadMailAdapter/, 'must re-export payloadMailAdapter')
    assert.match(typesContent, /resolveTransportConfig/, 'must re-export resolveTransportConfig')
    assert.match(typesContent, /createMailTransporter/, 'must re-export createMailTransporter')
    assert.match(typesContent, /createMailTesterEndpoint/, 'must re-export createMailTesterEndpoint')
    assert.match(typesContent, /MailTesterConfigModel/, 'must re-export MailTesterConfigModel')
    assert.match(typesContent, /export default payloadMailTester/, 'must export default payloadMailTester')
  })
})
