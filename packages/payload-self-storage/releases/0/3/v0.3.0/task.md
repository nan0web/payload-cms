# payload-self-storage v0.3.0

## Мета Релізу

Повне усунення архітектурного дефекту «плоских URL» у Payload CMS та забезпечення **100% автономності плагіна (Zero-App-Boilerplate)**:

1. **Перехід на суворо детермінований ієрархічний доступ O(1)**: ліквідація марнотратного рекурсивного пошуку `findRecursive`, примусове збереження повного ієрархічного шляху папки (`folderPath`) у полях `filename` та `url` для кожного згенерованого розміру `sizes`.
2. **Автономна роздача файлів через `collection.endpoints`**: користувачу ЗАБОРОНЕНО створювати вручну роутери в додатку (`app/(frontend)/...`). Плагін сам реєструє роздачу в Payload 3.x.
3. **Підтримка кореневих шляхів (`publicUrlPrefix: ''`)**: можливість роботи без штучного префіксу `/media` або з будь яким префіксом.
4. **Розділення життєвих циклів SSG та SSR**:
   - **SSG (Static Export без API)**: утиліта синхронізації (`syncStorageToDist`), яка дзеркально копіює медіа та мініатюри у вихідний дистрибутив (`out/`, `dist/`).
   - **SSR / Dev / Admin**: лінива генерація мініатюр на льоту з кешуванням у `.thumbnails`.

---

## 🔴 Ретроспектива: Чому це робиться зараз і чому не було зроблено раніше

1. **Історичний контекст v0.2.0**:
   - У версії v0.2.0 було реалізовано фізичне переміщення файлів на диску у підпапки згідно з `sourcePath` / `folder` (`storage/screenshots/recent/image.webp`).
   - Проте було допущено компроміс: хук `afterRead` та нормалізація `doc.url` оновлювали лише головний файл документа, в той час як генерація підрозмірів (`doc.sizes`) залишалася під контролем дефолтної логіки Payload CMS.
   - За замовчуванням Payload генерує `sizes` як плоскі імена (`doc.sizes[key].filename = "image-300x82.webp"`, `url = "/api/media/file/image-300x82.webp"`).
2. **Наслідок компромісу (Глюк та марнотратство)**:
   - Файли на диску лежать глибоко у підпапках (`screenshots/recent/...`), а запити від Admin UI та API надходять плоскими (`/api/media/file/image-300x82.webp`).
   - Щоб файл віддався хоч якось, у `file-server.js` було вбудовано `findRecursive` — рекурсивний обхід усієї файлової системи при кожному GET-запиті.
   - Спроба вирішити це через кастомний роут `app/(frontend)/media/[...path]/route.ts` виявилася порушенням принципу автономності плагіна: користувач змушений був модернізувати сам додаток замість простого встановлення плагіна.

---

## 🎯 Scope & Архітектурні Вимоги v0.3.0

1. **Ієрархічні шляхи у `doc.sizes` (Filename & URL Consistency)**:
   - Для кожного підрозміру в `doc.sizes[key]` поля `filename` та `url` **зобов'язані містити повний ієрархічний шлях**:
     - `doc.sizes[key].filename = "${folderPath}/${base}-${width}x${height}.${ext}"` (наприклад, `screenshots/recent/Hemp field bg-300x82.webp`).
     - `doc.sizes[key].url = "${publicUrlPrefix}/${folderPath}/${base}-${width}x${height}.${ext}"`.
   - Це забезпечується у `file-mover.js` під час збереження (`beforeChange`) та гарантується в `afterRead`.

2. **Zero-App-Boilerplate (Роздача виключно через плагін)**:
   - Перенесення обробника роздачі з `config.endpoints` безпосередньо в **`collection.endpoints`** (`/file/:path*`).
   - Додаток не повинен містити жодного коду у `app/(frontend)/media`. Видалити створений `route.ts`.

3. **Кореневі шляхи без префіксів (Банківський кейс)**:
   - Якщо `publicUrlPrefix: ''` або `'/'`, URL генерується від кореня (`/screenshots/recent/image.webp`), що необхідно для проектів із кастомною структурою URL.

4. **Виділена директорія кешу Thumbnails (`thumbnailsDir`)**:
   - Розміри, згенеровані на льоту, кешуються у виділену директорію `.thumbnails`.
   - Повна ізоляція від бекапів: метод `backend.list()` ігнорує `.thumbnails`.

5. **SSG-синхронізація у вихідний дистрибутив (`syncStorageToDist`)**:
   - Утиліта для збірки, що копіює файли сховища та згенеровані мініатюри у директорію білду (`out/` чи `dist/`) для розгортання без Node.js/API.

---

## 🧪 Definition of Done (DoD) & Контракти

- [x] Контрактні тести `src/test/releases/0/3/v0.3.0/task.test.js`:
  1. Перевірка, що після `beforeChange` / `moveDocumentFiles` кожен запис у `doc.sizes[key]` має `filename` та `url` з повним `folderPath` (наприклад, `folder/sub/name-300x82.webp`).
  2. Перевірка хука `afterRead`: навіть якщо в базі розміри збережені без шляху, `afterRead` на льоту доповнює `doc.sizes[key].filename` та `doc.sizes[key].url` повним шляхом папки.
  3. Прямий виклик `serveUploadFile` віддає файл без рекурсивного пошуку через O(1) доступ.
  4. Ізоляція `.thumbnails` від бекапів та `syncThumbnailsToStatic`.
  5. Підтримка `publicUrlPrefix: ''`.
- [x] Розширення контрактів: 6. Перевірка реєстрації роутингу через `collection.endpoints` без участі файлів у `app/`. 7. Перевірка роботи `syncStorageToDist` для повного статичного експорту. 8. Видалення `testing-app/src/app/(frontend)/media/[...path]/route.ts` та успішне проходження `pnpm --filter testing-app test:int`.
- [x] 100% проходження тестів: `pnpm test:all` у пакеті (26/26 pass, types build, knip clean, audit).

