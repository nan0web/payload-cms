**АрхіТехноМаг**
> **1.** architechnomag
> **2.** [release](file:///Users/i/src/nan.web/docs/uk/workflows/release.md)
> **3.** [codebase](file:///Users/i/src/nan.web/docs/uk/workflows/codebase.md)
>
> — Мета чату: Повна автономність `@nan0web/payload-self-storage` (Zero-App-Boilerplate, Root Paths, SSG & SSR)
> — Прогрес: крок 4 / 4 (v0.3.0 Підготовка)
> — Використано ~55k токенів

Я тобі відповідаю, друже:

### Підсумок та Архітектурний Контекст для Наступного Чату

Ми зафіксували ключовий архітектурний принцип: **плагін має бути 100% самодостатнім**. 
Користувач не повинен вручну створювати роутери в додатку (`app/(frontend)/...`).

#### 1. Що вже реалізовано та перевірено в коді:
- **Ієрархічні підрозміри O(1)**: `beforeChange` та `afterRead` зберігають та повертають повний шлях папки (`screenshots/recent/image-300x82.webp`) у `doc.sizes[key].filename` та `doc.sizes[key].url`.
- **Нормалізація переміщення**: усунуто падіння `backend.exists()` на тимчасових Payload URL `/api/media/...`. Файли фізично переміщуються у вкладені папки на диску.
- **Підтримка кореневих шляхів**: `publicUrlPrefix: ''` дозволяє працювати з кореневими URL без `/media` (кейс банку).
- **Кеш мініатюр**: відокремлено папку `.thumbnails`, ліквідовано дублювання в бекапах.

#### 2. Завдання для негайної реалізації в новому чаті:
1. **Zero-App-Boilerplate роздача через `collection.endpoints`**:
   - Перенести кастомний ендпоінт роздачі прямо в `collection.endpoints` у [`plugin.js`](file:///Users/i/src/nan.web/apps/3rdparty/payload-cms/packages/payload-self-storage/src/payload/plugin.js) (`path: '/file/:path*'`), оскільки Payload 3.x для запитів колекції оглядає саме `collection.config.endpoints`.
   - Забезпечити, щоб запити на зразок `/api/media/file/screenshots/recent/image-300x82.webp` обслуговувалися плагіном без створення жодних файлів у `app/(frontend)`.
2. **Видалення зайвого коду з `testing-app`**:
   - Видалити створений раніше файл [`testing-app/src/app/(frontend)/media/[...path]/route.ts`](file:///Users/i/src/nan.web/apps/3rdparty/payload-cms/testing-app/src/app/(frontend)/media/[...path]/route.ts).
   - Переконатися, що `pnpm --filter testing-app test:int` проходить на 100% зелено.
3. **SSG-синхронізація (`syncStorageToDist`)**:
   - Реалізувати функцію експорту для статичного білду (SSG), яка дзеркально копіює дерево збережених файлів та кеш мініатюр у папку публікації (`out/` чи `dist/`), дозволяючи сайту працювати без запущеного Node.js API.
4. **Контрактні тести та запечатування релізу**:
   - Додати контрактні тести для нових пунктів у [`task.test.js`](file:///Users/i/src/nan.web/apps/3rdparty/payload-cms/packages/payload-self-storage/src/test/releases/0/3/v0.3.0/task.test.js).
   - Запустити `pnpm test:all` та запечатати реліз v0.3.0.

