---
description: Codebase development standards for Payload CMS plugins
---

# 💻 Working with `@nan0web/payload-*` Codebase

This workflow defines coding standards and plugin structure within the `apps/payload-cms` repository.

## 1. Plugin Package Structure

Every plugin under `<plugin-name>` adheres to the **Payload 3.x ESM** standard:

```text
<plugin-name>/
├── package.json        # "type": "module", subpath exports
├── README.md           # Plugin documentation
├── src/
│   ├── index.js        # Main plugin configurator function (Pure Logic)
│   ├── admin.js        # React/Next.js Admin UI components (if applicable)
│   └── first-paint.js  # Inline DOM scripts executed before hydration (if applicable)
└── tests/              # Unit and integration tests
```

## 2. Strict Relative Paths Rule

- **FORBIDDEN to use absolute file system paths** (`/Users/username/...` or `C:\...`).
- All imports, documentation links, and configuration files MUST use **relative paths** (`./src/index.js`, `../payload-self-storage`, `docs/workflows/README.md`).

## 3. OLMUI Principle (One Logic — Multiple UI)

1. **`src/index.js` (Core / Logic):** Exports the plugin configurator function that accepts a Payload `config` and returns an updated `config`. Contains NO React code.
2. **`src/admin.js` (Admin UI):** Exports standalone React components for Payload Admin customizations (e.g., Custom Nav, Custom Controls).
3. **`src/first-paint.js` (First Paint / Fast Execution):** Browser scripts executed prior to React hydration (e.g., reading active theme from `localStorage` in `<head>`).

## 4. Total Logic Isolation (TLI) & 100% Test Coverage

- **Total Logic Isolation (TLI):** All business logic (URL manipulation, path normalization, i18n handling, format processing) MUST be implemented as pure, isolated **Environment-Agnostic** functions in Standard JS/TS (runnable across Browser, Node.js, Deno, Bun, Edge Workers) with zero dependency on Payload server instances or React DOM.
- **100% Coverage Requirement:** Pure backend logic under `src/` MUST be fully covered by autonomous unit tests (`node:test`) achieving 100% branch and statement coverage before packaging.
- **Minimal Test Timeout Rule:** Test execution MUST ALWAYS specify an explicit, minimal reasonable timeout (e.g., `node --test --test-timeout=3000`). Using infinite waits or excessively high timeouts is forbidden to prevent AI agents and LLM models from hanging on blocked test runs.

## 5. Payload 3.x Admin UI Component Specification

- **String Component Paths:** In Payload 3.x, components for `providers`, `views`, `beforeLogin`, `beforeDashboard`, etc., MUST be registered **exclusively via string component paths of format `pkg-name/subpath#ExportName`** (e.g., `'@nan0web/payload-signin-theme-state/admin#ThemeProvider'`).
- **Prohibition of Legacy Objects:** Passing components as objects (`{ path: '...', clientProps: ... }`) is strictly prohibited as it breaks `importMap` generation and Next.js server-side registration.
- **Async Config & Promise Support:** Config wrappers (such as `withStorage`) MUST support `Promise` objects and asynchronous `buildConfig`.

## 6. Cross-Platform Compatibility (Windows / macOS / Linux)

- All installation scripts and test execution runners MUST operate identically across Windows, macOS, and Linux.
- Use `pnpm` and Node.js scripts for cross-platform execution instead of native `bash` scripts.
