import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  payloadMailTester,
  payloadMailAdapter,
  resolveTransportConfig,
  createMailTransporter,
  createMailTesterEndpoint,
  MailTesterConfigModel,
} from '../src/index.js'

describe('payload-mail-tester v0.1.0 contract', () => {
  test('exports valid plugin function, adapter and MailTesterConfigModel', () => {
    assert.equal(typeof payloadMailTester, 'function')
    assert.equal(typeof payloadMailAdapter, 'function')
    assert.equal(typeof resolveTransportConfig, 'function')
    assert.equal(typeof createMailTransporter, 'function')
    assert.equal(typeof createMailTesterEndpoint, 'function')
    assert.equal(typeof MailTesterConfigModel, 'function')
    assert.equal(MailTesterConfigModel.UI.navLabel, 'Mail Tester')
  })

  test('resolves transport options for sendmail mode', () => {
    const config = resolveTransportConfig({
      transport: 'sendmail',
      sendmailPath: '/custom/bin/sendmail',
    })
    assert.equal(config.type, 'sendmail')
    assert.equal(config.isMock, false)
    assert.equal(config.transportOptions.sendmail, true)
    assert.equal(config.transportOptions.path, '/custom/bin/sendmail')
  })

  test('resolves transport options for SMTP mode with and without auth', () => {
    // With auth
    const configWithAuth = resolveTransportConfig({
      transport: 'smtp',
      smtp: {
        host: 'smtp.internal.bank',
        port: 587,
        secure: false,
        auth: { user: 'user1', pass: 'secret' },
      },
    })
    assert.equal(configWithAuth.type, 'smtp')
    assert.equal(configWithAuth.transportOptions.host, 'smtp.internal.bank')
    assert.equal(configWithAuth.transportOptions.port, 587)
    assert.equal(configWithAuth.transportOptions.auth.user, 'user1')
    assert.equal(configWithAuth.transportOptions.auth.pass, 'secret')

    // Relay without password
    const configRelay = resolveTransportConfig({
      transport: 'smtp',
      smtp: {
        host: 'relay.local',
        port: 25,
      },
    })
    assert.equal(configRelay.type, 'smtp')
    assert.equal(configRelay.transportOptions.host, 'relay.local')
    assert.equal(configRelay.transportOptions.port, 25)
    assert.equal(configRelay.transportOptions.auth, undefined)
  })

  test('resolves transport options for fallback mock mode', () => {
    const configMock = resolveTransportConfig({
      transport: 'mock',
    })
    assert.equal(configMock.type, 'mock')
    assert.equal(configMock.isMock, true)
    assert.equal(configMock.transportOptions.streamTransport, true)
  })

  test('payloadMailAdapter sends email via mock transporter and logs output', async () => {
    const logs = []
    const adapterGenerator = payloadMailAdapter({
      transport: 'mock',
      defaultFromAddress: 'test-admin@nan0web.local',
      defaultFromName: 'Nan0Admin',
      logger: (msg) => logs.push(msg),
    })

    const initializedAdapter = adapterGenerator({ payload: {} })
    assert.equal(initializedAdapter.defaultFromAddress, 'test-admin@nan0web.local')
    assert.equal(initializedAdapter.defaultFromName, 'Nan0Admin')

    const result = await initializedAdapter.sendEmail({
      to: 'target@customer.com',
      subject: 'Reset Password Test',
      text: 'Click here to reset: https://example.com/reset?token=123',
    })

    assert.ok(result)
    assert.ok(logs.length > 0)
    assert.match(logs[0], /MOCK/)
    assert.match(logs[0], /target@customer\.com/)
    assert.match(logs[0], /https:\/\/example\.com\/reset\?token=123/)
  })

  test('payloadMailTester registers /mail-tester endpoint and Admin view', () => {
    const plugin = payloadMailTester({
      path: '/custom-mail-tester',
    })

    const initialConfig = {
      endpoints: [{ path: '/existing', method: 'get' }],
      admin: {
        views: {},
        components: {
          afterNavLinks: [],
        },
      },
    }

    const updated = plugin(initialConfig)

    assert.equal(updated.endpoints.length, 3)
    assert.ok(updated.endpoints.some((e) => e.path === '/mail-tester' && e.method === 'get'))
    assert.ok(updated.endpoints.some((e) => e.path === '/mail-tester' && e.method === 'post'))

    assert.ok(updated.admin.views.mailTester)
    assert.equal(updated.admin.views.mailTester.path, '/custom-mail-tester')
    assert.equal(
      updated.admin.views.mailTester.Component,
      '@nan0web/payload-mail-tester/admin#MailTesterView'
    )
    assert.ok(
      updated.admin.components.afterNavLinks.includes(
        '@nan0web/payload-mail-tester/admin#MailTesterNavLink'
      )
    )
  })

  test('createMailTesterEndpoint handles status check and sending test email', async () => {
    const endpoint = createMailTesterEndpoint({
      skipAuth: true,
      adapterOptions: {
        transport: 'mock',
      },
    })

    // 1. Status action
    const statusReq = {
      method: 'GET',
      url: 'http://localhost/api/mail-tester?action=status',
    }
    const statusRes = await endpoint(statusReq)
    const statusJson = await statusRes.json()
    assert.equal(statusJson.status, 'ready')
    assert.equal(statusJson.type, 'mock')
    assert.equal(statusJson.isMock, true)

    // 2. Send test email
    const sendReq = {
      method: 'POST',
      url: 'http://localhost/api/mail-tester?action=send',
      json: async () => ({
        to: 'tester@example.com',
        subject: 'Diagnostic Check',
      }),
    }
    const sendRes = await endpoint(sendReq)
    const sendJson = await sendRes.json()
    assert.equal(sendJson.ok, true)
    assert.equal(sendJson.type, 'mock')
    assert.ok(sendJson.durationMs >= 0)

    // 3. Reject invalid email
    const badReq = {
      method: 'POST',
      url: 'http://localhost/api/mail-tester?action=send',
      json: async () => ({
        to: 'invalid-email',
      }),
    }
    const badRes = await endpoint(badReq)
    assert.equal(badRes.status, 400)
  })
})
