# @nan0web/payload-self-storage

Автономний плагін збереження медіа-файлів у структуровані фізичні каталоги на диску, швидкої дедуплікації, конвертації в WebP та резервного копіювання для Payload CMS 3.x.

## Можливості v0.2.0

- **Фізичні папки за `sourcePath`**: Можливість явно задати фізичний шлях файлу на диску (наприклад, `img/products/cards/Visa-Instant.webp`).
- **Ієрархія віртуальних папок (`payload-folders`)**: Автоматичне збереження файлів у фізичні директорії, що повторюють структуру папок у Payload Admin UI (`storage/<папка>/<файл>.<ext>`), із рекурсивним розкриттям через `findByID`.
- **Підтримка довільних розширень**: Збереження файлів будь-яких типів (`.pdf`, `.svg`, `.zip`, `.mp4` тощо) зі збереженням оригінального розширення та MIME-типу.
- **Швидка дедуплікація (Розмір + SHA-256 Хеш)**: 
  - Запобігає генерації суфіксів дублікатів (`-1`, `-2`) при повторному завантаженні ідентичного файлу.
  - Очищує тимчасові завантаження та прив'язує документ до існуючого канонічного файлу.
  - Позначає документ метаданими `isDuplicate: true` та `duplicateMessage`.
- **Канонічні URL**: Формування URL у повному узгодженні з фізичним розташуванням файлів на диску для RSC та SSG.
- **Повна ізоляція роутингу (`isolateRouting: true`)**: Автономна реєстрація роздачі файлів через `config.endpoints` у Payload CMS без необхідності створення ручних Next.js `route.ts`.
- **Ліниві мініатюри (`lazySizes: true`)**: Вимкнення синхронного створення розмірів при завантаженні оригіналу; динамічна генерація Sharp виключно при першому запиті.
- **Параметризований файловий сервер**: Налаштування `mimeTypes`, `cacheControl` та `thumbnailFormats` із багатим дефолтним реєстром для аудіо, відео, документів, шрифтів та сучасних форматів зображень.

## Використання

### 1. Підключення плагіна в `payload.config.ts`

```ts
import { buildConfig } from 'payload'
import { payloadSelfStorage } from '@nan0web/payload-self-storage'
import path from 'node:path'

export default payloadSelfStorage({
  rootDir: path.resolve(process.cwd(), 'storage'),
  publicUrlPrefix: '/media',
  collections: ['media'],
  lazySizes: true,
})(buildConfig({
  // ваша конфігурація Payload
}))
```

### 2. Підключення роутингу для фронтенду у Next.js App Router

У Payload 3.x (Next.js App Router) кастомні `endpoints` змонтовані під `/api/...`.
Якщо ви використовуєте чистий URL-префікс (наприклад, `/media`), створіть однорядковий Route Handler у вашому Next.js додатку:

**`src/app/(frontend)/media/[...path]/route.ts`** (або `src/app/media/[...path]/route.ts`):
```ts
import { createMediaRouteHandler } from '@nan0web/payload-self-storage'
import path from 'node:path'

export const GET = createMediaRouteHandler({
  rootDir: path.resolve(process.cwd(), 'storage'),
  publicUrlPrefix: '/media',
})
```

> **Автоматична діагностика та попередження:**
> Якщо `publicUrlPrefix` не починається з `/api` і відповідний файл `route.ts` не знайдено, плагін автоматично виведе попередження в консоль сервера під час старту Payload та зафіксує його в метаданих адмінки (`admin.custom.selfStorage.routeWarning`).

### 3. Робота з SSG (Static Site Generation)

Перед запуском статичної генерації або для експорту асетів можна викликати утиліту синхронізації:
```ts
import { syncStorageToDist } from '@nan0web/payload-self-storage'

await syncStorageToDist({
  rootDir: './storage',
  targetDir: './public/media', // або './out/media'
})
```

## Документація для розробників та агентів

- [Паспорт релізу v0.2.0](../../releases/0/2/v0.2.0/task.md)
- [Контрактна специфікація TDD v0.2.0](../../releases/0/2/v0.2.0/task.spec.js)
- [Посібник користувача та довідка сховища (Media)](./payload/collections/media.md)
