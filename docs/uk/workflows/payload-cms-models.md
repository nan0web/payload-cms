---
description: Критерії створення моделей (Model-as-Schema) у Payload CMS плагінах
---

# 🏗 Моделі у Payload CMS (Model-as-Schema Workflow)

Цей документ описує чіткі критерії: **коли слід створювати моделі**, а **коли вони НЕ потрібні** в екосистемі плагінів `@nan0web/payload-*`.

---

## 1. Коли СТВОРЮВАТИ Модель (When to create a Model)

Модель (`Model-as-Schema` на базі `@nan0web/types` / Payload Collections) необхідна у випадках, коли плагін або додаток працює з **структурованими даними в БД**:

1. **Нові Колекції БД (Collections):**Плагін додає нові сутності в Payload CMS (наприклад, `Files`, `Manuals`, `Logs`, `AuditEvents`).
2. **Глобальні Конфігурації (Globals):**Плагін зберігає структуровані налаштування в БД через Payload Globals.
3. **Валідація та Схеми даних:**Потрібна сувора JSDoc/TypeScript типізація полів, локалізація (`localized: true`), або специфічні правила валідації полів.
4. **Зв'язки між сутностями (Relationships):**Дані плагіна мають посилання на інші колекції (наприклад, користувачі, медіафайли, папки).

### Приклад декларативної моделі:

```javascript
import { Model } from '@nan0web/types'

export class StorageFolderModel extends Model {
	static $collection = 'storage-folders'

	static UI = {
		$singular: 'Folder',
		$plural: 'Folders',
		$group: 'Self Storage',
		$useAsTitle: ['name'],
	}

	/** @type {import('@nan0web/types').FieldConfig} */
	static name = {
		type: 'string',
		required: true,
		help: 'Folder name in self-storage',
	}
}
```

---

## 2. Коли НЕ СТВОРЮВАТИ Модель (When NOT to create a Model)

**ЗАБОРОНЕНО** створювати файли моделей та ускладнювати архітектуру, якщо плагін виконує суто UI або розширювальні функції:

1. **UI-Плагіни стану клієнта (Client State / Theme):**
   - Наприклад, `@nan0web/payload-signin-theme-state` (перемикання теми в `localStorage`).
   - Тут немає колекцій в БД — логіка реалізується через автономний скрипт (`first-paint.js`) або React Component (`admin.js`).
2. **Плагіни доступності та гарячих клавіш (Accessibility / Keyboard Shortcuts):**
   - Наприклад, `@nan0web/payload-keyboard-accessibility` (обробка `keydown` подій в адмінці).
   - Жодної взаємодії з БД Payload не відбувається.
3. **Розширення UI Інтерфейсу (Pure Admin UI Overrides):**
   - Додавання кнопок в Header/Nav, обгортки компонентів, візуальні стилі.

---

## 3. Чекліст прийняття рішення (Decision Matrix)

| Критерій | Потрібна Модель? | Альтернатива |
| :--- | :--- | :--- |
| Збереження даних у масиві/БД Payload | **ТАК** | `Model-as-Schema` + Payload Collection |
| Збереження в `localStorage` / `sessionStorage` | **НІ** | Plain JS Utility / `first-paint.js` |
| Гарячі клавіші, DOM event listeners | **НІ** | React Hook / Admin Component |
| Додавання полів до існуючих колекцій | **ТАК** (розширення) | Config Configurator Function |

---

## 4. Лаконічні правила для розробника та AI

- **Нуль зайвих абстракцій:** Не плодіть порожні класи Моделей для плагінів без БД.
- **Мова полів (English):** Усі описи (`help`), заголовки та ключі полів у моделях описуються **англійською мовою**.
- **Чистота (Zero Procedural Code):** Модель описує ТІЛЬКИ схему та метадані, не містить `fs` або прямого I/O коду.
