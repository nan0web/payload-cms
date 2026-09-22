---
version: 0.1.4
type: patch
status: done
locale: uk
models: []
---

# Mission: Усунення блокування Webpack через статичне визначення docsDir

## Overview

Патч-реліз `v0.1.4` усуває критичну помилку компіляції Next.js / Webpack `Module not found: Can't resolve '../docs'` при транспайлінгу `@nan0web/payload-keyboard-accessibility` у споживчих додатках (таких як `@industrialbank/cms`).

## Scope

- [x] Замінити статичний рядок у `new URL('../docs', import.meta.url)` на динамічну форму із захисним `try/catch`.
- [x] Зберегти зворотну сумісність із `@nan0web/payload-self-manual`.
- [x] Оновити версію до `0.1.4` у `package.json`.
- [x] Провести повне тестування, TS-перевірку та збірку пакета (`pack:check`).

## Acceptance Criteria

- [x] `Can't resolve '../docs'` більше не виникає при збірці Webpack.
- [x] Всі контрактні тести проходять (`pnpm test`).
- [x] `tsc --checkJs` проходить без помилок.
- [x] Пакет формує артефакт `nan0web-payload-keyboard-accessibility-0.1.4.tgz`.
