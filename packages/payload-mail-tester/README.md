# @nan0web/payload-mail-tester

Universal email adapter with Sendmail, SMTP relay, and mock console fallback support, accompanied by an in-admin diagnostic testing panel (Mail Tester) for Payload CMS 3.x.

## Features

- **Sendmail Mode**: Sends mail using the system `sendmail` binary (`/usr/sbin/sendmail` or custom `SENDMAIL_PATH`).
- **SMTP Relay Mode**: Direct SMTP client supporting SSL/TLS, port configuration, and optional authentication (ideal for internal SMTP relays without passwords).
- **Mock / Console Fallback**: Logs outgoing emails (including password reset links) directly to server output when no mailer is configured.
- **In-Admin Diagnostic View & Nav Link**: Diagnose connectivity (`verify()`), test deliverability with custom recipient, and view exact SMTP codes and responses.
- **Model-First i18n**: Out of the box English and Ukrainian localization.

## Installation

```bash
pnpm add @nan0web/payload-mail-tester nodemailer
```

## Quick Start

```javascript
import { buildConfig } from 'payload'
import { payloadMailTester, payloadMailAdapter } from '@nan0web/payload-mail-tester'

export default buildConfig({
  // Configure universal email adapter
  email: payloadMailAdapter({
    transport: process.env.EMAIL_TRANSPORT, // 'sendmail' | 'smtp' | 'mock'
    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 25),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    },
    defaultFromAddress: process.env.EMAIL_FROM || 'noreply@example.com',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'Payload CMS',
  }),

  // Add diagnostic Admin View and verification endpoint
  plugins: [
    payloadMailTester({
      group: 'Settings', // Admin navigation group
    }),
  ],
})
```

## License

ISC
