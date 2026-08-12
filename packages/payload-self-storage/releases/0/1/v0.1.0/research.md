# Research: 500 errors та плоскі URL в Admin UI

## Дата дослідження
2026-08-12

## Стан системи після v0.1.0 релізу

### Що працює ✅
- Файли на диску переміщені правильно (ієрархічна структура `storage/<folder>/<filename>.webp`)
- Кастомний endpoint `/api/media/file/:path*` повертає HTTP 200 для запитів з повними шляхами
- On-demand thumbnail generation через sharp працює
- Кириличні імена файлів декодуються коректно
- Міграційний скрипт `scripts/migrate-media-urls.ts` оновив URL в БД (9 документів)
- `filenameCompoundIndex: ['filename']` додано до Media колекції

### Що НЕ працює ❌

#### Проблема 1: 500 Error для деяких файлів
```
[01:15:24] ERROR: File мапа-300x300.jpg for collection media is missing on the disk. Expected path: /Users/i/src/apps/payload-cms/testing-app/storage/мапа-300x300.jpg
GET /api/media/file/%D0%BC%D0%B0%D0%BF%D0%B0-300x300.jpg 500 in 66ms
```

**Причина:** Payload's `getFileHandler` (`payload/dist/uploads/endpoints/getFile.js:51-53`) бере тільки `basename` з URL:
```js
const fileDir = collection.config.upload?.staticDir;
const filePath = path.resolve(resolvedDir, filename); // ← ТІЛЬКИ basename!
```

Файл лежить на диску як `storage/2026/08/мапа-300x300.webp`, але Payload шукає `storage/мапа-300x300.jpg` → ENOENT → 500.

**Чому кастомний endpoint не спрацьовує:**
Наш кастомний endpoint `/api/media/file/:path*` додається в кінець масиву `config.endpoints` у `plugin.js`:
```js
endpoints: [
  ...(resolvedConfig.endpoints || []),
  { path: `/api/${cleanPrefix}/file/:path*`, method: 'get', handler: ... }
]
```

Але Payload реєструє свої upload-ендпоінти **після** санізації конфігу — тому наш кастомний endpoint ніколи не спрацьовує. Payload's власний `/file/:filename` перехоплює запит першим.

**Підтверджено через код Payload:**
- `payload/dist/uploads/endpoints/index.js:11-13` — `getFileHandler` реєструється з шляхом `/file/:filename`
- `payload/dist/config/sanitize.js:90-94` — `config.endpoints` ініціалізується порожнім масивом, потім туди пушаться endpoints з колекцій, globals, auth
- Upload endpoints додаються окремо, не в main `config.endpoints`

#### Проблема 2: Плоскі посилання в Admin UI
Admin UI показує старі плоскі URL-адреси (`/media/yaro-rasta.webp`) замість ієрархічних (`/media/Root/2026/08/yaro-rasta.webp`).

**Причина:** Хуки `beforeChange`/`afterChange` спрацьовують лише при зміні документа. Існуючі записи залишилися зі старими URL.

**Рішення:** Створено міграційний скрипт `scripts/migrate-media-urls.ts`, який:
- Пройшов по всіх media-документах з `depth: 1`
- Знайшов файли на диску з fallback по розширеннях (.webp/.jpg/.png)
- Оновив URL в БД на повні ієрархічні шляхи

**Статус:** Скрипт запущено, 9 документів оновлено, 7 пропущено (вже мали правильні URL).

#### Проблема 3: Розширення файлів не збігаються
Оригінали конвертуються в `.webp`, але в БД можуть зберігатися старі `.jpg`/`.png` URL.

**Рішення:** Міграційний скрипт має fallback логіку — шукає файл з іншим розширенням якщо точна назва не знайдена.

## Архітектурний аналіз маршрутизації Payload

### Як Payload будує маршрути
1. `buildConfig()` → `sanitizeConfig()` → `config.endpoints = []`
2. Пушаться endpoints з колекцій (`collection.endpoints`)
3. Пушаться endpoints з globals
4. Пушаться auth endpoints
5. Upload endpoints додаються **окремо** через `uploadCollectionEndpoints`

### Чому наш endpoint не працює
Наш plugin додає endpoint `/api/media/file/:path*` у `config.endpoints`. Але Payload's upload endpoint `/file/:filename` реєструється на окремій ділянці маршрутів і обробляє запити раніше.

### Правильний механізм Payload — `upload.handlers`
Згідно з docs Payload CMS:
```ts
upload: {
  handlers: [myCustomHandler]
}
```

`handlers` виконуються ПЕРЕД локальним fallback у `getFileHandler`. Якщо handler повертає Response — він відправляється клієнту і все.

**Але проблема:** `serveUploadFile` вже доданий як handler, але він отримує:
- `params.filename` — плоский basename (наприклад "yaro-rasta-300x386.webp")
- `doc.url` — може бути старим плоским URL з БД

Тобто навіть якщо handler спрацює, він не знає повного ієрархічного шляху.

## Потрібне рішення

### Варіант A: Перевизначити getFileHandler напряму
Створити wrapper навколо Payload's `getFileHandler`, який:
1. Приймає запит з повним ієрархічним шляхом
2. Шукає файл на диску по повному шляху
3. Якщо не знайдено — fallback до recursive search
4. Повертає Response або null (щоб Payload продовжив обробку)

### Варіант B: Використати кастомний endpoint на рівні колекції
Додати endpoint `/file/:path*` безпосередньо в Media колекцію:
```ts
export const Media: CollectionConfig = {
  slug: 'media',
  endpoints: [
    { path: '/file/:path*', method: 'get', handler: myHandler }
  ]
}
```

Це створить маршрут `/api/media/file/:path*` який буде оброблятися **після** стандартного `/file/:filename` (бо кастомні endpoints додаються після автоматичних).

### Варіант C: Змінити порядок реєстрації endpoint'ів
Модифікувати `plugin.js` щоб додати кастомні endpoints **перед** `...(resolvedConfig.endpoints || [])`:
```js
endpoints: [
  { path: `/api/${cleanPrefix}/file/:path*`, method: 'get', handler: ... },
  ...(resolvedConfig.endpoints || []),
]
```

Але це не допоможе бо upload endpoints додаються окремо.

### Варіант D: Використати Next.js Route Handler
Створити Next.js route handler у `testing-app/src/app/api/media/file/[...path]/route.ts` який перехоплюватиме запити ДО Payload.

Це найнадійніший підхід — Next.js маршрутизація працює на рівні файлової системи і завжди матиме пріоритет над Payload's internal routing.

## Рекомендація

**Найкращий підхід:** Комбінація Варіанту B + покращення `serveUploadFile`.

1. Додати кастомний endpoint `/file/:path*` на рівні Media колекції через плагін
2. Endpoint буде перевіряти чи є `req.routeParams.path` (повний шлях)
3. Якщо так — шукати файл по повному шляху на диску
4. Якщо ні — повернути null і дозволити Payload обробити запит стандартним способом
5. Покращити `serveUploadFile` щоб він використовував `doc.url` (який тепер ієрархічний після міграції)

## Заблоковані моменти
- Не вдалося прочитати Next.js llms.txt повністю (обмеження API)
- Не перевірено чи варіант B дійсно працює (потрібен тест)
- Не перевірено чи `upload.handlers` мають доступ до повного URL запиту

## Наступні кроки
1. Реалізувати Варіант B (endpoint на рівні колекції)
2. Або Варіант D (Next.js route handler) як fallback
3. Протестувати з реальними запитами з Admin UI
4. Оновити backlog.md статус
