# payload-self-manual v0.4.0

## Мета
Інтроспекція екосистеми та підключених плагінів у `payload-self-manual`: надання API-ендпоінту та візуального інтерфейсу (вкладка/розділ «Екосистема та Плагіни» / System Plugins) у Payload Admin модалці для перегляду активних плагінів, їх конфігурацій, версій пакетів та стану підключеної документації.

---

## Scope & Вимоги

1. **Ендпоінт Інтроспекції / Розширення (`/_self-manual`)**:
   - Підтримка query-параметра `?info=system` або `?view=system` (а також під час звичайного запиту як мета-дані або окремий режим).
   - Функція `getIntrospectionInfo(config, options)` / `inspectPlugins(config)`:
     - Сканування конфігурації Payload: `config.plugins`, `config.custom?.selfManualDocs`, `config.admin?.custom?.selfManual`.
     - Визначення встановлених плагінів `@nan0web/payload-*` та сторонніх плагінів.
     - Відображення списку плагінів: `name`, `version`, `status` ('active' | 'configured'), `hasDocs` (boolean), `docsDir`, `optionsSummary` (безпечні конфіги без секретів).

2. **Model-as-Schema & i18n розширення**:
   - Додавання UI ключів у `SelfManualConfigModel.UI`:
     - `pluginsTab`: 'Екосистема та Плагіни'
     - `pluginsHeader`: 'Підключені плагіни'
     - `pluginName`: 'Плагін'
     - `pluginVersion`: 'Версія'
     - `pluginStatus`: 'Статус'
     - `pluginDocs`: 'Документація'
     - `pluginDocsAvailable`: 'Доступна'
     - `pluginDocsMissing`: 'Відсутня'
     - `systemInfo`: 'Інформація про систему'
     - `activeStatus`: 'Активний'
   - Оновлення локалей `src/locales/uk.js` та `src/locales/en.js`.

3. **UI Розширення в `admin.jsx` та `admin.css`**:
   - Додавання кнопки/вкладки перемикання або окремого пункту навігації «Екосистема та Плагіни» (`#system:plugins` або таб у модалці).
   - Візуальні картки плагінів із бейджами статусу, версіями та посиланнями на відповідну документацію.

4. **Zero Monorepo Linkage & Clean Knip**:
   - Безпечний імпорт версій та сумісність із Next.js/Payload Admin.
   - Чистий `knip` аудит та 100% покриття контрактними тестами.

---

## Definition of Done (DoD)

- [x] Контрактні тести у `releases/0/4/v0.4.0/task.spec.js` (100% pass).
- [x] Юніт-тести інтроспекції та UI моделі (100% pass).
- [x] `pnpm test` та `pnpm knip` проходять з нулем помилок.
- [x] TypeScript типи згенеровано (`pnpm build`).
- [x] Оновлено `next.md` зі статусом Сесії 03.
