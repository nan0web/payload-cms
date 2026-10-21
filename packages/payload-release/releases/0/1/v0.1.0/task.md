---
status: done
type: minor
epic: EPIC-PAYLOAD-RELEASE
sprint: Sprint 43
tracker: https://github.com/nan0web/payload-cms/issues/{id}
---

# v0.1.0 — payload-release: Audit, Idempotency & Markdown Preview

## Опис та Мета
Плагін `@nan0web/payload-release` для Payload CMS 3.x, що забезпечує автоматичну фіксацію запусків релізів, контроль версій (Idempotency), вбудований журнал аудиту (Steps, Parity, Issues, Files) та компактний перегляд специфікацій `task.md` і `user.md` у форматі Markdown безпосередньо в інтерфейсі адмін-панелі.

## Команда
- **Lead / Architect:** Олександр Снігірьов (@snigirev)
- **AI Lead Developer:** Agent Antigravity (@agy)
- **Auditor:** Security Bot (@sec-bot)

## Робочий План та Задачі

### 1. Колекція `Releases` з компактним Tabbed Layout
- [x] [#REL-1] Нативна розбивка форми релізу на вкладки (Tabs): General, Steps, Parity, Issues, Files.
- [x] [#REL-2] Відображення бейджів кількості в заголовках вкладок (steps, parity, issues, files).
- [x] [#REL-3] Забезпечення суворого Read-Only доступу в адмін-панелі (заборона create, update, delete, приховування кнопки Create New).

### 2. Вбудований Markdown Modal Viewer
- [x] [#VIEW-1] Реалізація кнопки перегляду (`👁️`) біля артефактів `task.md` та `user.md`.
- [x] [#VIEW-2] Вбудований модальний переглядач Markdown зі стилями та закриттям за клавішею `Esc` або кнопкою `✕`.

### 3. Серверні Ендпоінти та Автономне Читання
- [x] [#SRV-1] Безпечний Local API / REST ендпоінт для отримання сирого або відрендереного файлу (`GET /api/releases/:id/file?path=...`).
- [x] [#SRV-2] Захист від path traversal та безпечне читання артефактів релізу.

### 4. Zero-Config Plugin Interface та Auto-Discovery
- [x] [#PLG-1] Підтримка виклику без обов'язкових параметрів `payloadRelease()`.
- [x] [#PLG-2] Автоматичне виявлення релізів з файлової системи (проєктні релізи та вбудований реліз плагіна) під час ініціалізації (`onInit`).

## Критерії Прийнятності (DoD)
- [x] [#DOD-1] Пакет створено в монорепо `payload-cms/packages/payload-release` з чистою структурою `package.json`, `tsconfig.json` та `@nan0web` залежностями.
- [x] [#DOD-2] Колекція `releases` реєструється автоматично через плагін `payloadRelease()`.
- [x] [#DOD-3] Усі масиви полів форми релізу мають бейджі кількості в заголовках вкладок.
- [x] [#DOD-4] Файли `task.md` та `user.md` відображаються у списку `files` та доступні для читання у вбудованій модалці.
- [x] [#DOD-5] Забезпечено суворий **Read-Only доступ**: заборонено `create`, `update`, `delete`, кнопка `Create New` прихована.
- [x] [#DOD-6] Підтримується виклик без параметрів: `payloadRelease()`.
- [x] [#DOD-7] Релізи автоматично завантажуються із файлової системи (включно із вбудованим демонстраційним релізом `v0.1.0`).
- [x] [#DOD-8] Оновлено контрактні тести `task.spec.js` для верифікації прав доступу та автозавантаження.
- [x] [#DOD-9] Пройдено інспекцію без викликів `console.warn` / `console.error`.


