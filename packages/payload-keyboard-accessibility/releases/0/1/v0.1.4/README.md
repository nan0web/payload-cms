# @nan0web/payload-keyboard-accessibility v0.1.4 — Release Specification & Verification Guide

> **Language / Мова:** [🇺🇸 English](#) | [🇺🇦 Українська](./README.uk.md)

This document describes the changes introduced in release `v0.1.4` of `@nan0web/payload-keyboard-accessibility`, resolving the Webpack build error (`Can't resolve '../docs'`) in consumer projects (specifically Next.js Webpack in `@industrialbank/cms`).

---

## 1. Release Goals & Architecture

Release `v0.1.4` is a patch release addressing static analysis incompatibility between Webpack / Next.js bundlers and runtime documentation directory path resolution:

1. **Resolution of `Module not found: Can't resolve '../docs'`:**
   - **Root Cause:** Webpack statically analyzes string literals inside `new URL('../docs', import.meta.url)` in `transpilePackages` environments as a bundle module dependency. Since `../docs` is a documentation directory rather than a JavaScript module, the build terminated with a fatal module resolution error.
   - **Solution:** Replaced the static literal with dynamic string concatenation `'..' + '/docs'` wrapped in a guarded `try/catch` block with a safe `'docs'` fallback. This prevents Webpack from attempting to bundle the directory as an asset while preserving full server-side absolute path resolution for `@nan0web/payload-self-manual`.

---

## 2. Verification Steps

### Step 1. Contract Tests (TDD)
```bash
pnpm --filter @nan0web/payload-keyboard-accessibility test
```
*Result:* 6/6 tests passing.

### Step 2. TypeScript Type Check (`checkJs`)
```bash
npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --allowJs --checkJs src/admin.js src/index.js
```
*Result:* 0 errors.

### Step 3. Packaging Check (Pack Check)
```bash
pnpm --filter @nan0web/payload-keyboard-accessibility pack:check
```
*Result:* Created `.artifacts/nan0web-payload-keyboard-accessibility-0.1.4.tgz`.

---

## 3. Publishing Guide

```bash
cd packages/payload-keyboard-accessibility
pnpm publish --access public
```
