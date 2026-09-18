# user metrics — payload-self-manual v0.4.0

## Метрики Виконання
- **Цільова версія:** v0.4.0
- **Статус:** Готово (Реліз v0.4.0 сформовано)
- **Тести:** 100% покриття (26/26 тестів пройшли)
- **Knip аудит:** 0 дефектів (виробничий білд чистий)
- **TypeScript типи:** `tsc` компіляція успішна (`types/index.d.ts`, `types/admin.d.ts`)
- **DoD:**
  - `inspectPlugins(config)` функція для зчитування підключених плагінів, їх версій, параметрів та документації.
  - Розширення `createDocumentationEndpoint` з підтримкою `?info=system` та передачею метаданих системи.
  - UI навігація та картки плагінів у `admin.jsx` та `admin.css`.
  - Повна типізація `SelfManualConfigModel.UI` та локалізації `uk`/`en`.
  - Відповідність стандартам монорепозиторію NaN0Web (Model-First i18n, Zero-Procedural code).

## Журнал Зворотного Зв'язку (Feedback & Notes)
- Зафіксовано вимогу автономності: інтроспекція повинна коректно визначати як плагіни з `config.plugins`, так і наявність документації з `config.custom.selfManualDocs` та налаштувань у `config.admin.custom`.
