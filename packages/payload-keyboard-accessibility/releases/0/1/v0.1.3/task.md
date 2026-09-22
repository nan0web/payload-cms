---
version: 0.1.3
type: patch
status: done
locale: uk
models: []
---

# Mission: Виправлення TS помилок та видалення node:path у Keyboard Focus Admin

## Overview

Патч-реліз `v0.1.3` усуває блокування рендерингу React / Next.js шляхом відмови від модуля `node:path` та додає точну JSDoc-типізацію для props адмін-контролера клавіатури, що виправляє TS-помилку `TS(2339)`.

## Scope

- [x] Позбутися імпорту `node:path` у `src/index.js`.
- [x] Забезпечити роботу визначення шляху `packageDocsDir` без прив'язки до середовища виконання Node.
- [x] Додати JSDoc-типізацію до `KeyboardFocusAdmin` у `src/admin.js`, щоб задовольнити `tsc --checkJs`.
- [x] Додати JSDoc-типізацію до `createKeyboardFocusController` у `src/index.js`.
- [x] Підняти версію пакета до `0.1.3` та підготувати релізну документацію.

## Acceptance Criteria

- [x] `node:path` відсутній у вихідних файлах плагіна.
- [x] `tsc --checkJs` проходить без жодних помилок TS2339.
- [x] Усі юніт-тести проходять успішно (`pnpm test`).
- [x] Створено артефакт пакування `pnpm pack:check`.
