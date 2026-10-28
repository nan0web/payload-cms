import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  payloadMailTester,
  payloadMailAdapter,
  resolveTransportConfig,
  createMailTransporter,
  createMailTesterEndpoint,
} from '../../../../src/index.js'

describe('payload-mail-tester v0.1.0 release spec', () => {
  test('task specification file exists and is well-formed', () => {
    const taskPath = path.resolve(import.meta.dirname, 'task.md')
    assert.ok(fs.existsSync(taskPath), 'task.md must exist in release directory')
    const content = fs.readFileSync(taskPath, 'utf8')
    assert.match(content, /payload-mail-tester v0\.1\.0/)
    assert.match(content, /Sendmail/)
    assert.match(content, /SMTP/)
  })

  test('verifies sendmail, smtp, and mock transport configurations', () => {
    // Sendmail
    const sendmailConfig = resolveTransportConfig({
      transport: 'sendmail',
      sendmailPath: '/usr/sbin/sendmail',
    })
    assert.equal(sendmailConfig.type, 'sendmail')
    assert.equal(sendmailConfig.isMock, false)

    // SMTP relay
    const smtpConfig = resolveTransportConfig({
      transport: 'smtp',
      smtp: { host: '127.0.0.1', port: 1025 },
    })
    assert.equal(smtpConfig.type, 'smtp')
    assert.equal(smtpConfig.isMock, false)

    // Mock
    const mockConfig = resolveTransportConfig({ transport: 'mock' })
    assert.equal(mockConfig.type, 'mock')
    assert.equal(mockConfig.isMock, true)
  })

  test('verifies email adapter sends email and returns delivery metadata', async () => {
    const adapterGen = payloadMailAdapter({ transport: 'mock' })
    const adapter = adapterGen({ payload: {} })
    const res = await adapter.sendEmail({
      to: 'recipient@bank.gov.ua',
      subject: 'Bank Test Alert',
      text: 'Notification payload',
    })
    assert.ok(res.messageId)
  })
})
