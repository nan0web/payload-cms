# @nan0web/payload-signin-theme-state

Payload CMS 3.x plugin that stores the Admin/Login theme in browser `localStorage`, independently of Payload user documents.

```js
import { payloadSigninThemeState } from '@nan0web/payload-signin-theme-state'

export default buildConfig({
  plugins: [payloadSigninThemeState({ storageKey: 'my-app-theme' })],
})
```

Supported values are `light`, `dark`, and `system`. Invalid stored values fall back to the operating-system preference. The plugin installs a `beforeLogin` first-paint component and an `admin.components.providers` provider, so the saved theme is applied before Login content is painted and remains synchronized in the Admin UI.

This plugin does not modify Payload authentication, user records, tokens, refresh behavior, or session lifetime. Session and token expiration remain controlled by Payload's own authentication configuration; configure those explicitly in the application when needed. No session extension is performed by this plugin.

## Local tarball testing

Use the package tarball for local verification rather than `pnpm link`. Keep only the current tarball in the ignored `.artifacts/` directory:

```bash
cd /Users/i/src/apps/payload-signin-theme-state
pnpm pack:local

cd /Users/i/src/apps/testing-app
pnpm add /Users/i/src/apps/payload-signin-theme-state/.artifacts/nan0web-payload-signin-theme-state-0.1.0.tgz
```

After changes, recreate and reinstall the tarball:

```bash
cd /Users/i/src/apps/payload-signin-theme-state
pnpm pack:local

cd /Users/i/src/apps/testing-app
pnpm add /Users/i/src/apps/payload-signin-theme-state/.artifacts/nan0web-payload-signin-theme-state-0.1.0.tgz
```

Old `.tgz` files do not need to be retained. Remove them from `.artifacts/` when necessary; only the current tarball is used.

Check the package contents without creating a tarball:

```bash
pnpm pack:check
```
