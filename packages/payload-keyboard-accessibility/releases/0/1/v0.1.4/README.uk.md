# @nan0web/payload-keyboard-accessibility v0.1.4 — Специфікація Релізу & Керівництво Верифікації

> **Мова / Language:** [🇺🇦 Українська](#) | [🇺🇸 English](./README.md)

Цей документ описує зміни у релізі `v0.1.4` пакета `@nan0web/payload-keyboard-accessibility`, спрямовані на усунення помилки збірки Webpack (`Can't resolve '../docs'`) у споживчих проєктах (зокрема Next.js Webpack у `@industrialbank/cms`).

---

## 1. Цілі та Архітектура Релізу (Release Goals)

Реліз `v0.1.4` є патч-оновленням (`patch`), яке вирішує несумісність статичного аналізу бандлерів Webpack / Next.js із визначенням шляху до документації плагіна:

1. **Усунення помилки `Module not found: Can't resolve '../docs'`:**
   - **Проблема:** Webpack під час статичного аналізу коду в середовищах із `transpilePackages` інтерпретує літеральні рядки всередині `new URL('../docs', import.meta.url)` як залежність модуля бандла. Оскільки `../docs` є каталогом документації, а не модулем JavaScript, збірка падала з фатальною помилкою.
   - **Рішення:** Статичний літерал замінено на динамічну комбінацію рядків `'..' + '/docs'` у захищеному блоці `try/catch` із безпечним fallback `'docs'`. Це запобігає спробі Webpack імпортувати каталог як скрипт, зберігаючи при цьому повноцінне визначення абсолютного шляху для сервісу `@nan0web/payload-self-manual` на сервері.

---

## 2. Верифікація Релізу (Verification Steps)

### Крок 1. Контрактні тести (TDD)
```bash
pnpm --filter @nan0web/payload-keyboard-accessibility test
```
*Результат:* 6/6 тестів пройдено успішно.

### Крок 2. Перевірка TypeScript компіляції (`checkJs`)
```bash
npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --allowJs --checkJs src/admin.js src/index.js
```
*Результат:* 0 помилок.

### Крок 3. Створення пакета (Pack Check)
```bash
pnpm --filter @nan0web/payload-keyboard-accessibility pack:check
```
*Результат:* Створено `.artifacts/nan0web-payload-keyboard-accessibility-0.1.4.tgz`.

---

## 3. Інструкція з Публікації (Publishing Guide)

```bash
cd packages/payload-keyboard-accessibility
npm publish --access public
```
