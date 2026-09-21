#!/usr/bin/env node

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                   @nan0web/payload-cms CLI Helper                         ║
╚═══════════════════════════════════════════════════════════════════════════╝

📦 Testing App Launch Commands:

  ▶ pnpm dev             Start Payload CMS with ALL active plugins
  ▶ pnpm dev:folder      Start ONLY with @nan0web/payload-browse-by-folder
  ▶ pnpm dev:storage     Start ONLY with @nan0web/payload-self-storage
  ▶ pnpm dev:theme       Start ONLY with @nan0web/payload-signin-theme-state
  ▶ pnpm dev:keyboard    Start ONLY with @nan0web/payload-keyboard-accessibility
  ▶ pnpm dev:manual      Start ONLY with @nan0web/payload-self-manual

🚀 Production Commands:

  ▶ pnpm build           Compile Next.js & Payload CMS (Type check + SSG)
  ▶ pnpm start           Run production server (http://localhost:3000)
  ▶ pnpm dev:prod        Clean rebuild and fast start (Clean + Build + Start)

🧪 Package Testing (TDD / Isolated):

  ▶ pnpm --filter "@nan0web/payload-self-manual" test
  ▶ pnpm --filter "@nan0web/payload-browse-by-folder" test
  ▶ pnpm --filter "@nan0web/payload-self-storage" test
  ▶ pnpm --filter "@nan0web/payload-signin-theme-state" test

`)
