import fs from 'node:fs'
import nodemailer from 'nodemailer'

/**
 * @typedef {Object} SmtpOptions
 * @property {string} [host]
 * @property {number} [port]
 * @property {boolean} [secure]
 * @property {{ user?: string, pass?: string }} [auth]
 * @property {boolean} [tlsRejectUnauthorized]
 */

/**
 * @typedef {Object} MailAdapterOptions
 * @property {'auto' | 'sendmail' | 'smtp' | 'mock'} [transport='auto']
 * @property {string} [sendmailPath]
 * @property {SmtpOptions} [smtp]
 * @property {string} [defaultFromAddress]
 * @property {string} [defaultFromName]
 * @property {any} [transporter] Custom nodemailer transporter instance
 * @property {(text: string) => void} [logger]
 */

/**
 * Resolves the active mail transport configuration.
 *
 * @param {MailAdapterOptions} [options={}]
 * @returns {{
 *   type: 'sendmail' | 'smtp' | 'mock',
 *   transportOptions: Record<string, any>,
 *   isMock: boolean,
 *   sendmailPath?: string
 * }}
 */
export function resolveTransportConfig(options = {}) {
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {}
  const explicitTransport = options.transport || env.EMAIL_TRANSPORT || 'auto'

  const sendmailPath = options.sendmailPath || env.SENDMAIL_PATH || '/usr/sbin/sendmail'
  const smtpHost = options.smtp?.host || env.SMTP_HOST
  const smtpPort = Number(options.smtp?.port || env.SMTP_PORT || 25)
  const smtpSecure = options.smtp?.secure ?? (env.SMTP_SECURE === 'true' || smtpPort === 465)

  const smtpUser = options.smtp?.auth?.user ?? env.SMTP_USER
  const smtpPass = options.smtp?.auth?.pass ?? env.SMTP_PASS

  // 1. Explicit sendmail or auto-detected sendmail binary
  if (explicitTransport === 'sendmail') {
    return {
      type: 'sendmail',
      transportOptions: {
        sendmail: true,
        newline: 'unix',
        path: sendmailPath,
      },
      isMock: false,
      sendmailPath,
    }
  }

  // 2. Explicit SMTP or detected SMTP_HOST
  if (explicitTransport === 'smtp' || (explicitTransport === 'auto' && smtpHost)) {
    const transportOptions = {
      host: smtpHost || 'localhost',
      port: smtpPort,
      secure: smtpSecure,
    }

    if (smtpUser) {
      transportOptions.auth = {
        user: smtpUser,
        pass: smtpPass || '',
      }
    }

    if (options.smtp?.tlsRejectUnauthorized === false || env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false') {
      transportOptions.tls = { rejectUnauthorized: false }
    }

    return {
      type: 'smtp',
      transportOptions,
      isMock: false,
    }
  }

  // 3. Auto mode: check if sendmail binary actually exists on filesystem (Linux only by default)
  if (explicitTransport === 'auto' && process.platform !== 'darwin') {
    let hasSendmail = false
    try {
      if (typeof fs.existsSync === 'function') {
        hasSendmail = fs.existsSync(sendmailPath)
      }
    } catch {}

    if (hasSendmail) {
      return {
        type: 'sendmail',
        transportOptions: {
          sendmail: true,
          newline: 'unix',
          path: sendmailPath,
        },
        isMock: false,
        sendmailPath,
      }
    }
  }

  // 4. Fallback to mock/stream console transport
  return {
    type: 'mock',
    transportOptions: {
      streamTransport: true,
      buffer: true,
      newline: 'unix',
    },
    isMock: true,
  }
}

/**
 * Creates a configured Nodemailer transporter or wraps custom one.
 *
 * @param {MailAdapterOptions} [options={}]
 * @returns {{
 *   transporter: import('nodemailer').Transporter,
 *   type: 'sendmail' | 'smtp' | 'mock',
 *   isMock: boolean,
 *   sendmailPath?: string
 * }}
 */
export function createMailTransporter(options = {}) {
  if (options.transporter) {
    return {
      transporter: options.transporter,
      type: options.transport === 'mock' ? 'mock' : 'smtp',
      isMock: options.transport === 'mock',
    }
  }

  const resolved = resolveTransportConfig(options)
  const transporter = nodemailer.createTransport(resolved.transportOptions)

  return {
    transporter,
    type: resolved.type,
    isMock: resolved.isMock,
    sendmailPath: resolved.sendmailPath,
  }
}

/**
 * Universal Payload 3.x email adapter generator.
 * Compatible with `email: payloadMailAdapter(options)` in payload.config.ts.
 *
 * @param {MailAdapterOptions} [options={}]
 * @returns {({ payload }: { payload: any }) => {
 *   name: string,
 *   defaultFromAddress: string,
 *   defaultFromName: string,
 *   sendEmail: (message: any) => Promise<any>
 * }}
 */
export function payloadMailAdapter(options = {}) {
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {}
  const defaultFromAddress =
    options.defaultFromAddress ||
    env.EMAIL_FROM ||
    'noreply@payloadcms.local'

  const defaultFromName =
    options.defaultFromName ||
    env.EMAIL_FROM_NAME ||
    'Payload CMS'

  const { transporter, type, isMock } = createMailTransporter(options)

  return ({ payload }) => {
    const logger = options.logger || ((msg) => payload?.logger?.info?.(msg) || console.log(msg))

    return {
      name: `payload-mail-tester (${type})`,
      defaultFromAddress,
      defaultFromName,
      sendEmail: async (message) => {
        const mailOptions = {
          from: message.from || `"${defaultFromName}" <${defaultFromAddress}>`,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          cc: message.cc,
          bcc: message.bcc,
          replyTo: message.replyTo,
          attachments: message.attachments,
          headers: message.headers,
        }

        try {
          const info = await transporter.sendMail(mailOptions)

          if (isMock) {
            const rawBody = info.message ? info.message.toString() : ''
            const urlMatch = rawBody.match(/https?:\/\/[^\s"'>]+/i)
            const extractedUrl = urlMatch ? urlMatch[0] : null

            logger(
              `\n[payload-mail-tester: MOCK] ========================================\n` +
              `To: ${mailOptions.to}\n` +
              `Subject: ${mailOptions.subject}\n` +
              (extractedUrl ? `Action Link: ${extractedUrl}\n` : '') +
              `Raw Content:\n${rawBody}\n` +
              `====================================================================\n`
            )
          }

          return info
        } catch (error) {
          payload?.logger?.error?.(`[payload-mail-tester] Failed to send email: ${error.message}`)
          throw error
        }
      },
    }
  }
}
