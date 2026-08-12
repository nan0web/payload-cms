# `@nan0web/payload-cms` Monorepo

Official workspace for `@nan0web/payload-*` plugins ecosystem for **Payload CMS 3.x**.

## 📦 Ecosystem Packages (Published on NPM)

| Package | Description | Version | NPM Link | Status |
| :--- | :--- | :---: | :---: | :---: |
| [`@nan0web/payload-self-storage`](packages/payload-self-storage) | Physical file storage, WebP conversion, folder hierarchy, backend-neutral backup | `v0.1.0` | [npm](https://www.npmjs.com/package/@nan0web/payload-self-storage) | 🟢 Published |
| [`@nan0web/payload-browse-by-folder`](packages/payload-browse-by-folder) | Tree view navigation for folder-based media browsing in Admin UI | `v0.1.0` | [npm](https://www.npmjs.com/package/@nan0web/payload-browse-by-folder) | 🟢 Published |
| [`@nan0web/payload-self-manual`](packages/payload-self-manual) | Contextual Markdown documentation viewer (`⌘/` / `Ctrl+/`) with Mermaid support | `v0.1.0` | [npm](https://www.npmjs.com/package/@nan0web/payload-self-manual) | 🟢 Published |
| [`@nan0web/payload-signin-theme-state`](packages/payload-signin-theme-state) | Admin & Login theme persistence (`localStorage`) without white flash | `v0.1.0` | [npm](https://www.npmjs.com/package/@nan0web/payload-signin-theme-state) | 🟢 Published |
| [`@nan0web/payloadcms-keyboard-accessibility`](packages/payload-keyboard-accessibility) | Predictable keyboard shortcuts (`Cmd+S`, `Cmd+Enter`) & focus scope control | `v0.1.1` | [npm](https://www.npmjs.com/package/@nan0web/payloadcms-keyboard-accessibility) | 🟢 Published |

---

## 📥 Installation & Setup in Any Payload 3.x Application

### 1. Install all plugins from NPM:

```bash
pnpm add @nan0web/payload-self-storage \
         @nan0web/payload-browse-by-folder \
         @nan0web/payload-self-manual \
         @nan0web/payload-signin-theme-state \
         @nan0web/payloadcms-keyboard-accessibility
```

### 2. Configure `src/payload.config.ts`:

```typescript
import { buildConfig } from 'payload'
import { payloadSelfStorage } from '@nan0web/payload-self-storage'
import { payloadBrowseByFolder } from '@nan0web/payload-browse-by-folder'
import { payloadSelfManual } from '@nan0web/payload-self-manual'
import { payloadSigninThemeState } from '@nan0web/payload-signin-theme-state'
import { payloadKeyboardFocus } from '@nan0web/payloadcms-keyboard-accessibility'

// Config transform wrapper for self-storage & WebP conversion
const withStorage = payloadSelfStorage({
  rootDir: './storage',
  publicUrlPrefix: '/media',
  collections: ['media'],
})

export default withStorage(
  buildConfig({
    // Your Payload CMS configuration
    plugins: [
      payloadBrowseByFolder({ collections: ['media'] }),
      payloadSelfManual({ docsDir: 'docs', defaultLocale: 'uk' }),
      payloadSigninThemeState({ storageKey: 'app-theme' }),
      payloadKeyboardFocus(),
    ],
  })
)
```

---

## ⚡ Monorepo Local Development

### 1. Install workspace dependencies
```bash
pnpm install
```

### 2. Build & Package all plugins into `.tgz` tarballs
```bash
pnpm pack:all
```

### 3. Launch Development Sandbox
```bash
pnpm pack:all && pnpm --filter testing-app dev
```

### 4. Publish updated packages to NPM
```bash
pnpm publish:all
```

---

## 🧪 Testing Guidelines & Timeout Rule

- **Native Unit Tests (`node:test`)**:
  All packages under `packages/` use `node:test` runner.
  Tests MUST specify explicit minimal timeouts (e.g. `--test-timeout=3000`) so processes never freeze:
  ```bash
  pnpm --filter "@nan0web/payload-*" test
  ```

- **Integration Sandbox Tests (`testing-app`)**:
  ```bash
  pnpm --filter testing-app test:int
  ```

---

## 📚 Documentation

Detailed guidelines are available in English and Ukrainian:

- 📖 [English Workflows Documentation](docs/en/workflows/README.md)
  - [Codebase Standards](docs/en/workflows/codebase.md)
  - [Monorepo Architecture](docs/en/workflows/architecture.md)
  - [Plugin Pipeline & Migration Protocol](docs/en/workflows/pipeline.md)
- 📖 [Українські Робочі Інструкції](docs/uk/workflows/README.md)
  - [Стандарти кодової бази](docs/uk/workflows/codebase.md)
  - [Архітектура монорепозиторію](docs/uk/workflows/architecture.md)
  - [Конвеєр розробки та протокол міграції](docs/uk/workflows/pipeline.md)

---

## 📄 License

ISC
