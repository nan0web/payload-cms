---
status: done
type: patch
epic: EPIC-PAYLOAD-MAIL-TESTER
sprint: Sprint 44
tracker: https://github.com/nan0web/payload-cms/issues/{id}
---

# v0.1.1 — payload-mail-tester: TypeScript Declarations & Package Exports

## Опис та Мета

Виправлення інтеграційної помилки відсутності типів TypeScript у `@nan0web/payload-mail-tester` при імпорті в `payload.config.ts` та запуску `pnpm build`.
Забезпечення повної автоматичної генерації декларацій типів через `tsc` (`tsconfig.json` -> `types/`), експорту типів у `package.json` (`types`, `exports['.'].types`), включення каталогу `types` до пакованих файлів (`files`) та оновлення версії до `0.1.1`.

## Проблема

При використанні плагіна в проєктах на базі Next.js / TypeScript:
```text
./src/payload.config.ts:16:55
Type error: Could not find a declaration file for module '@nan0web/payload-mail-tester'. 
'.../node_modules/@nan0web/payload-mail-tester/src/index.js' implicitly has an 'any' type.
```

## Робочий План та Задачі

### 1. Декларації Типів (TypeScript & tsc)
- [x] [#TYPE-1] Створення `tsconfig.json` для автоматичної компіляції JS у `types/*.d.ts` (`emitDeclarationOnly: true`, `outDir: ./types`).
- [x] [#TYPE-2] Автоматична генерація `types/index.d.ts`, `types/admin.d.ts`, `types/adapter.d.ts` тощо через `pnpm build` (`tsc`).

### 2. Конфігурація Пакета (`package.json`)
- [x] [#PKG-1] Додавання кореневого поля `"types": "types/index.d.ts"`.
- [x] [#PKG-2] Оновлення поля `"exports"`:
  ```json
  "exports": {
    ".": {
      "types": "./types/index.d.ts",
      "import": "./src/index.js"
    },
    "./admin": {
      "types": "./types/admin.d.ts",
      "import": "./src/admin.jsx"
    }
  }
  ```
- [x] [#PKG-3] Додавання `"types"` до списку `"files"`.
- [x] [#PKG-4] Підняття версії до `0.1.1`.
- [x] [#PKG-5] Додавання `build` (`tsc`) та `prebuild` (`rm -rf types/`) скриптів.

### 3. Тестування та Верифікація (DoD)
- [x] [#TEST-1] Специфікація релізу `releases/0/1/v0.1.1/task.spec.js` (перевірка `task.md`, `package.json`, експорту типів).
- [x] [#TEST-2] Успішне проходження `pnpm test`.
- [x] [#TEST-3] Успішне проходження `pnpm test:all` (`test` + `build` + `knip`).
- [x] [#TEST-4] Перевірка цілісності артефакту через `pnpm pack:check`.
