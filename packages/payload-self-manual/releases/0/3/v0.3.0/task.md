# payload-self-manual v0.3.0

## Мета
Впровадження суворої парадигми **Model-as-Schema** для конфігурації плагіна (`SelfManualConfigModel`), оптимізація i18n через **Lazy Loading** словників (із використанням `createT` з `@nan0web/types`), та рефакторинг UI-компонента `admin.jsx` з видаленням інлайн-стилів на користь окремого файлу `admin.css`.

---

## Scope & Вимоги

1. **Model-as-Schema (`SelfManualConfigModel`)**:
   - Наслідування від базового класу `Model` (`@nan0web/types`).
   - Статичні конфігураційні поля: `docsDir`, `defaultLocale`, `multiDocView` ('tabs' | 'blocks'), `ui`, `releaseNotifications`, `translations`.
   - Статичний реєстр `SelfManualConfigModel.UI = { ... }` як єдине джерело ключів локалізації (Model-First i18n).
   - Автоматична валідація вхідних `options` при виклику `payloadSelfManual(options)`.

2. **Lazy i18n (`getTranslator` & `createT`)**:
   - Динамічне асинхронне завантаження словників для активної мови (`loadVocabulary(locale)`).
   - Відмова від статичного імпорту всіх мов у бандл адмінки.
   - Використання швидкої фабрики `createT` з `@nan0web/types` із підтримкою ICU-параметрів та кастомних перевизначень.

3. **CSS Гігієна та Класи (`admin.css`)**:
   - Повне видалення інлайн-об'єктів `style={{ ... }}` з `admin.jsx`.
   - Використання семантичних класів `.self-manual-*` та CSS-змінних теми Payload CMS (`var(--theme-*)`).
   - Усі розміри та відступи визначено в одиницях `rem`.

4. **Zero Monorepo Linkage**:
   - Залежність `@nan0web/types` підключена як публічний SemVer NPM-пакет (`^3.4.0`), жодного `workspace:*`.

---

## Definition of Done (DoD)

- [x] Контрактний та юніт-тест `src/SelfManualConfigModel.test.js` (100% pass).
- [x] Релізний специфікаційний тест `releases/0/3/v0.3.0/task.spec.js` (100% pass).
- [x] `knip` аудит проходить із результатом 0 дефектів.
- [x] 0 інлайн-стилів у `admin.jsx`.
