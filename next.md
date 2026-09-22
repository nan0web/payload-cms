# Контекст Розробки: `payload-cms` & `@nan0web/payload-self-storage`

> **Призначення файлу**: Синхронізація контексту відповідно до Правила 5 (`AGENTS.md`).

---

## 🏆 Реліз v0.3.0: Успішно Завершено (Sealed & Verified)

Реліз **v0.3.0** для `@nan0web/payload-self-storage` повністю завершено з дотриманням принципу **Zero-App-Boilerplate**:

1. **Zero-App-Boilerplate & Next.js App Router підтримка**:
   - Роздача файлів підтримується як через `collection.endpoints` (`/api/media/file/:path*`), так і через чистий шлях `/media/:path*`.
   - Для проектів Next.js App Router, які бажають прямий доступ `/media/...` без префіксу `/api/`, надано хелпер `createMediaRouteHandler({ rootDir, publicUrlPrefix })`.
   - Реалізовано автоматичну діагностику: плагін логує warning при відсутності Next.js Route Handler, якщо `publicUrlPrefix` не починається з `/api`.

2. **Ієрархічні підрозміри O(1)**:
   - Всі підрозміри у `doc.sizes[key]` зберігають та повертають повний шлях папки (`screenshots/recent/image-300x82.webp`) у `filename` та `url`.
   - Підтримка лінивої генерації Sharp on-demand у `.thumbnails`.

3. **Підтримка кореневих шляхів**:
   - `publicUrlPrefix: ''` дозволяє роботу без штучного `/media`.

4. **Розділення життєвих циклів (SSG vs SSR)**:
   - **SSG**: Реалізовано функцію експорту `syncStorageToDist({ rootDir, targetDir, thumbnailsDir })` для переносу медіа та мініатюр у папку публікації (`out/`, `dist/`).
   - **SSR / Dev**: Кешування лінивих мініатюр у `.thumbnails` з повною ізоляцією від бекапів (`backend.list()`).

---

## 🧪 Результати Верифікації

- `npm test` у `@nan0web/payload-self-storage` — **32/32 pass**.
- `npm run build` (`tsc`) — **успішно (0 errors)**.
- `curl -I http://localhost:3000/media/Root/yaro-logo-gray.webp` — **200 OK**.
- `curl -I http://localhost:3000/media/Root/yaro-logo-gray-300x150.webp` — **200 OK** (генерація мініатюри на льоту).
- Документація:
  - `docs/uk/README.md`, `docs/en/README.md` — оновлено.
  - `docs/uk/payload/collections/media.md`, `docs/en/payload/collections/media.md` — оновлено з описом роута.
  - `releases/0/3/v0.3.0/` — підготовлено до релізу.

