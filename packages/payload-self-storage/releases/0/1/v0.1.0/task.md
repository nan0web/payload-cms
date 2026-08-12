# payload-self-storage v0.1.0

## Мета

Автономний плагін збереження медіа-файлів у структуровані каталоги на диску, конвертації в WebP та генерації мініатюр за вимогою (On-Demand).

## Scope

- Physical subfolder organization (`storage/<folder>/<filename>.webp`).
- On-Demand thumbnail generation: generate specific sizes (e.g. `300x300.webp`) dynamically via `sharp` only when requested by browser/Admin UI, saving disk space.
- Full Cyrillic / non-ASCII filename support via `decodeURIComponent`.
- Automatic fallback `alt` text generation from clean filename in `beforeChange`.
- Streaming backup and restore engine with SHA-256 verification.

## Виправлення та технічні деталі

1. **On-Demand Thumbnails**: Замість створення десятків не використовуваних розмірів, мініатюри генеруються `sharp` за вимогою під час звернення до `/api/media/file/<name>-<size>.webp`.
2. **Декодування кирилиці**: Додано `decodeURIComponent` при розборі URL для коректної роботи з папами та файлами (наприклад `storage/Hello/Проєбалі.webp`).

## Виправлені проблеми ✅

### 1. 500 Error при сервісі файлів з ієрархічних папок ✅ ВИПРАВЛЕНО

**Причина:** Payload's `getFileHandler` (`payload/dist/uploads/endpoints/getFile.js:51-53`) бере тільки `basename` з URL:
```js
const fileDir = collection.config.upload?.staticDir;
const filePath = path.resolve(resolvedDir, filename); // ← ТІЛЬКИ basename!
```
Файл лежить на диску як `storage/Hello/yaro-rasta-300x386.webp`, але Payload шукає `storage/yaro-rasta-300x386.webp` → ENOENT → 500.

**Рішення (реалізовано):**
- Endpoint переміщено з `config.endpoints` → `collection.upload.endpoints` (plugin.js:330-339)
- Collection-level endpoints реєструються **після** автоматичних upload-endpoint'ів Payload
- `/file/:path*` перехоплює ієрархічні шляхи, які `/file/:filename` пропускає
- `serveStorageFile()` використовує повний шлях з URL через `backend.locate()`

### 2. Унікальність filename блокує однакові імена в різних папках ✅ ВИПРАВЛЕНО

**Причина:** `getBaseFields.js:82-83`:
```js
if (!collection.upload.filenameCompoundIndex) {
    filename.unique = true;  // flat uniqueness — "yaro-rasta.webp" унікальний скрізь
}
```
Два файли `Hello/yaro-rasta.webp` і `Root/yaro-rasta.webp` мають однаковий `filename` у БД → другий відкидається.

**Рішення (реалізовано):** `filenameCompoundIndex: true` додано в upload-конфіг плагіну (plugin.js:325).

### 3. SSG URL містить зайвий `/media` префікс ✅ ВИПРАВЛЕНО

**Причина:** `webpMetadata()` використовувала regex для видалення prefix, що давало помилки на edge-case (подвійний prefix, спеціальні символи).

**Рішення (реалізовано):** Замінено regex на `startsWith` + `slice` (plugin.js:50-53). Надійніше і без side-effect'ів.

### 4. Кастомний endpoint не перехоплює запити — 500 errors ✅ ВИПРАВЛЕНО

**Причина:** Кастомний endpoint `/api/media/file/:path*` додавався в кінець `config.endpoints`, але Payload реєструє свої upload-ендпоінти **окремо і пізніше**. Тому наш endpoint ніколи не спрацьовував — Payload's власний `/file/:filename` перехоплював запит першим.

**Детальний аналіз:** див. `releases/0/1/v0.1.0/research.md`

**Підтверджено через код Payload:**
- `payload/dist/uploads/endpoints/index.js:11-13` — `getFileHandler` з шляхом `/file/:filename`
- `payload/dist/config/sanitize.js:90-94` — endpoints пушаться після ініціалізації, upload endpoints окремо
- `getFileHandler` бере тільки `basename` з `req.routeParams.filename`

**Рішення (реалізовано — Варіант B):**
- Endpoint переміщено на рівень `collection.upload.endpoints` (plugin.js:330-339)
- Collection-level endpoints додаються **після** автоматичних upload-endpoint'ів
- `/file/:path*` працює для ієрархічних шляхів, `/file/:filename` — тільки для плоских

## Definition of Done

- Media documents in subfolders return HTTP 200 without 500 errors.
- Alt text is auto-populated if left blank on upload.
- On-demand thumbnails generate on request.
- Same-named files in different folders are stored and served correctly.
- SSG/server-side URLs strip `/media` prefix.
- Admin UI shows hierarchical URLs (not flat).
- `filenameCompoundIndex: ['filename']` в Media колекції.
- Міграційний скрипт для оновлення існуючих документів.
