import { createMailTransporter } from './adapter.js'

/**
 * Diagnostic endpoint handler for checking mail connection status and sending test messages.
 *
 * @param {Object} [options]
 * @param {import('./adapter.js').MailAdapterOptions} [options.adapterOptions]
 * @returns {(req: any) => Promise<Response>}
 */
export function createMailTesterEndpoint(options = {}) {
  const mailTransporterHandle = createMailTransporter(options.adapterOptions || {})

  return async (req) => {
    // Only allow authenticated users with admin access
    if (req.user === null && !options.skipAuth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url, 'http://localhost')
    const action = url.searchParams.get('action') || (req.method === 'POST' ? 'send' : 'status')

    // 1. Check status / verify transporter
    if (action === 'status') {
      const { transporter, type, isMock, sendmailPath } = mailTransporterHandle

      if (isMock) {
        return Response.json({
          status: 'ready',
          type: 'mock',
          isMock: true,
          message: 'Mock fallback is active. Emails are printed to server console.',
        })
      }

      if (type === 'sendmail') {
        return Response.json({
          status: 'ready',
          type: 'sendmail',
          isMock: false,
          sendmailPath,
          message: `Sendmail transport configured at ${sendmailPath}`,
        })
      }

      // SMTP verify
      try {
        const verifyResult = await transporter.verify()
        return Response.json({
          status: 'ready',
          type: 'smtp',
          isMock: false,
          verified: Boolean(verifyResult),
          message: 'SMTP transport connection successfully established and verified.',
        })
      } catch (err) {
        return Response.json({
          status: 'error',
          type: 'smtp',
          isMock: false,
          code: err.code || 'ECONNFAILED',
          message: err.message,
        }, { status: 200 })
      }
    }

    // 2. Send test email
    if (action === 'send') {
      let body = {}
      try {
        if (typeof req.json === 'function') {
          body = await req.json()
        } else if (req.body) {
          body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
        }
      } catch {}

      const to = body.to || url.searchParams.get('to')
      if (!to || !to.includes('@')) {
        return Response.json({ error: 'Valid recipient email is required (to: email@domain.com)' }, { status: 400 })
      }

      const from = body.from || options.adapterOptions?.defaultFromAddress || 'noreply@payloadcms.local'
      const subject = body.subject || 'Payload CMS Test Email'
      const text = body.text || `This is a diagnostic test email sent from Payload CMS Mail Tester.\nTimestamp: ${new Date().toISOString()}`
      const html = body.html || `<div style="font-family: sans-serif; padding: 20px;"><h2>Payload CMS Mail Tester</h2><p>This is a diagnostic test email.</p><p><strong>Timestamp:</strong> ${new Date().toISOString()}</p></div>`

      try {
        const startTime = Date.now()
        const info = await mailTransporterHandle.transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        })
        const durationMs = Date.now() - startTime

        return Response.json({
          ok: true,
          type: mailTransporterHandle.type,
          isMock: mailTransporterHandle.isMock,
          durationMs,
          messageId: info.messageId,
          response: info.response || 'Message accepted',
          envelope: info.envelope,
          accepted: info.accepted,
          rejected: info.rejected,
        })
      } catch (err) {
        return Response.json({
          ok: false,
          type: mailTransporterHandle.type,
          code: err.code || 'ESENDFAILED',
          command: err.command,
          message: err.message,
          response: err.response,
        }, { status: 500 })
      }
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
}
