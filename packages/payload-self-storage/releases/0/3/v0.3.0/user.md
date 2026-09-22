# user metrics — payload-self-storage v0.3.0

## Метрики Виконання
- Цільова версія: v0.3.0
- Статус: 🟢 Готовий до запечатування (Всі вимоги Zero-App-Boilerplate та O(1) виконано на 100%)
- Контрактні тести: src/test/releases/0/3/v0.3.0/task.test.js (8/8 pass, 100%)
- Загальні тести пакету: 26/26 pass (100%)
- Інтеграційні тести додатку: testing-app test:int pass (100% без route.ts у додатку)
- DoD: thumbnailsDir виділена директорія для thumbnails, ізоляція від бекапів, синхронізація у статичне середовище для білду (syncThumbnailsToStatic / syncStorageToDist), підтримка root-relative prefix (publicUrlPrefix: ''), повні ієрархічні шляхи у doc.sizes[key].filename, O(1) прямий доступ без findRecursive, роздача через collection.endpoints без ручних файлів роутів у Next.js додатку.


## Журнал зворотного зв'язку (Feedback)
1. **Виділена директорія Thumbnails (`thumbnailsDir`)**:
   - Прев'ю та згенеровані Sharp формати (`-300x200.webp`) кешуються в окремій директорії (`.thumbnails`).
   - При повторних запитах повертається готовий кешований файл без повторної генерації Sharp, що суттєво економить ресурси CPU/RAM.
2. **Ізоляція від бекапів (Backup Isolation)**:
   - Метод `backend.list()` ігнорує приховані директорії та `thumbnailsDir`, завдяки чому при створенні бекапів через `exportFiles` thumbnails не дублюються в архів.
3. **Синхронізація для Статичного Білду (`syncThumbnailsToStatic` / `syncStorageToDist`)**:
   - Реалізовано функцію експорту `syncThumbnailsToStatic({ thumbnailsDir, targetDir })` та розширено до `syncStorageToDist`, яка дзеркально копіює все сховище у вихідну статичну директорію (`out/` або `public/`), забезпечуючи бездоганну роботу на статичних серверах без запущеного Node.js/API.
4. **Підтримка кореневих шляхів (`publicUrlPrefix: ''`)**:
   - Оновлено `createPathPolicy` для коректної обробки файлів без штучного префіксу `/media` (кейс банку).
5. **Ієрархічні імена файлів у `doc.sizes`**:
   - Усунено генерацію плоских імен у `doc.sizes[key].filename` та `doc.sizes[key].url`. Тепер кожен розмір зберігає свій повний шлях з папкою (`screenshots/recent/image-300x82.webp`).
   - У `afterRead` додано автоматичне розгортання `folderPath` для всіх розмірів у документі.
6. **Ліквідація марнотратного `findRecursive` (Прямий доступ O(1))**:
   - У `createUploadHandler` переписано механізм відбору файлів: пошук ведеться напряму за точним `sizeDoc.filename`, `sizeDoc.url` або детермінованим `path.join(rootDir, targetPath)`.
   - Жодного рекурсивного сканування файлової системи при звичайних GET-запитах.
7. **Zero-App-Boilerplate (Зауваження Архітектора від 21.09.2026)**:
   - Створення користувацького роутера `app/(frontend)/media/[...path]/route.ts` визнано порушенням автономності плагіна.
   - Плагін зобов'язаний сам реєструвати необхідні обробники через `collection.endpoints` у Payload CMS, щоб після додавання плагіна в `plugins` усе працювало "з коробки" без ручного коду в додатку.
   - Створений у `testing-app` файл роутера має бути видалений, а функціональність покрита контрактними тестами.



