import { Model } from '@nan0web/types'

/**
 * Configuration schema and UI constants model for payload-mail-tester plugin.
 * Implements Model-as-Schema pattern.
 */
export class MailTesterConfigModel extends Model {
  /**
   * UI Keys and Default Fallback Labels (Model-First i18n)
   */
  static UI = {
    navLabel: 'Mail Tester',
    navGroup: 'Settings',
    pageTitle: 'Mail Diagnostics & Tester',
    pageDescription: 'Verify mail server connection and send test messages to diagnose deliverability.',
    statusTitle: 'Transport Status',
    statusChecking: 'Checking connection…',
    statusReady: 'Ready / Connected',
    statusError: 'Connection Error',
    statusMock: 'Mock Mode (Console Output)',
    transportLabel: 'Active Transport',
    recipientLabel: 'Recipient Email',
    recipientPlaceholder: 'admin@example.com',
    sendTestBtn: 'Send Test Email',
    sending: 'Sending…',
    refreshStatus: 'Refresh Status',
    sendSuccess: 'Email successfully sent!',
    sendFailed: 'Failed to send email',
    serverLogsTitle: 'Diagnostic Details / SMTP Response',
    fromAddress: 'From Address',
    noLogs: 'No test attempts yet.',
  }

  /**
   * Transport mode: 'sendmail', 'smtp', or 'mock'.
   */
  static transport = {
    type: 'string',
    default: 'auto',
    enum: ['auto', 'sendmail', 'smtp', 'mock'],
    help: 'Email transport mechanism: "auto", "sendmail", "smtp", or "mock"',
  }

  /**
   * Default sender address.
   */
  static defaultFromAddress = {
    type: 'string',
    default: 'noreply@payloadcms.local',
    help: 'Default from address for outgoing emails',
  }

  /**
   * Default sender display name.
   */
  static defaultFromName = {
    type: 'string',
    default: 'Payload CMS',
    help: 'Default from display name',
  }
}
