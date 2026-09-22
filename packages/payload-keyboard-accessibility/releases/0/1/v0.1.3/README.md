# @nan0web/payload-keyboard-accessibility v0.1.3 — Специфікація Релізу & Керівництво Верифікації

> **Мова / Language:** [🇺🇦 Українська](#) | [🇺🇸 English](../../../../README.md)

Цей документ описує зміни у релізі `v0.1.3` пакета `@nan0web/payload-keyboard-accessibility`, спрямовані на усунення помилок компіляції TypeScript (`checkJs`) та забезпечення чистого браузерного рендерингу React / Next.js без залежності від Node.js-модулів.

---

## 1. Цілі та Архітектура Релізу (Release Goals)

Реліз `v0.1.3` є патч-оновленням (`patch`), яке вирішує дві критичні інтеграційні проблеми:

1. **Усунення блокування React / Client-Side рендерингу (Node Runtime Decoupling):**
   - **Проблема:** Імпорт `import path from 'node:path'` у `src/index.js` потрапляв у клієнтський бандл компонентів адмінки або вимагав поліфілів у середовищі Next.js Turbopack / Webpack під час збірки сторінок.
   - **Рішення:** Повне видалення імпорту `node:path`. Визначення шляху до документації плагіна переведено на веб-стандартний `new URL('../docs', import.meta.url).pathname`, який коректно працює як в ESM середовищі Payload CMS, так і в Next.js App Router без сторонніх runtime-поліфілів.

2. **Виправлення помилок TypeScript (`Property 'fieldSelector' does not exist on type '{}'.ts(2339)`):**
   - **Проблема:** Деструктуризація параметрів за замовчуванням `{ fieldSelector, submitSelector, optOutAttribute, scopeSelector } = {}` у `KeyboardFocusAdmin` (`src/admin.js`) без явного типу об'єкта призводила до виведення типу параметрів як порожнього об'єкта `{}`.
   - **Рішення:** Додано суворі JSDoc-анотації типів:
     - `@param {Object} [props]` для `KeyboardFocusAdmin` з описом усіх необов'язкових полів.
     - `@param {Object} [options]` для `createKeyboardFocusController` у `src/index.js`.
   - Результат: повна перевірка `tsc --checkJs` проходить із 0 помилок.

---

## 2. Верифікація Релізу (Verification Steps)

### Крок 1. Перевірка контрактних тестів (TDD)
```bash
cd packages/payload-keyboard-accessibility
pnpm test
```
*Очікуваний результат:* 6/6 тестів пройдено успішно.

### Крок 2. Перевірка TypeScript компіляції (`checkJs`)
```bash
npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --allowJs --checkJs src/admin.js src/index.js
```
*Очікуваний результат:* 0 помилок (Clean exit code 0).

### Крок 3. Перевірка сумісності та вмісту пакета (Pack Check)
```bash
pnpm pack:check
```
*Очікуваний результат:* створення артефакту `.artifacts/nan0web-payload-keyboard-accessibility-0.1.3.tgz` із повним набором файлів `src/`, `docs/`, `package.json`, `README.md`, `LICENSE`.

---

## 3. Інструкція з Публікації (Publishing Guide)

Оскільки для публікації в npm потрібні авторизаційні ключі або сесія `npm login`, кроки виконуються розробником:

```bash
cd packages/payload-keyboard-accessibility
npm publish --access public
```
