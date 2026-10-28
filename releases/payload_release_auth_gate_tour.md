# 📋 Backlog для пакета `@nan0web/payload-release` (v0.3.0)

> **Цільовий пакет:** `@nan0web/payload-release` (репозиторій `payload-cms/packages/payload-release`)  
> **Пріоритет:** Critical (Виправлення 404 у перегляді специфікацій, ендпоїнтах туру та витоку на формі логіну)  
> **Мітка:** `bugfix`, `security`, `ux`, `endpoints`

---

## 1. Дефект 1: Помилка 404 при перегляді файлів релізу (File Preview 404)
### Симптом:
При кліку на кнопку перегляду специфікації файлу (наприклад, `releases/0/3/v0.3.0/task.md` у вкладці 📦 Files або ⚡ Steps):
```
Failed to load file (404)
```
### Корінь проблеми:
У `payloadRelease` функція `readReleaseFile` формує список кандидатів:
```javascript
const candidatePaths = [
    path.resolve(projectRoot, cleanPath),
    path.resolve(projectRoot, releasesDir, cleanPath),
    path.resolve(packageRoot, cleanPath),
    ...
]
```
Коли `releasesDir` передано як абсолютний шлях (`/Users/.../releases`) або коли `cleanPath` вже містить префікс `releases/` (наприклад `releases/0/3/v0.3.0/task.md`), виклик `path.resolve(projectRoot, releasesDir, cleanPath)` дає хибний дубльований шлях:
`.../releases/releases/0/3/v0.3.0/task.md`!
Крім того, перевірка `allowedBases` блокує файли, якщо вони знаходяться у зовнішній монорепозиторній директорії `releases`.

### Необхідне виправлення в `readReleaseFile`:
1. Нормалізувати `cleanPath`: якщо він починається з `releases/`, видаляти цей префікс перед поєднанням з `releasesDir`.
2. Додати кандидатів:
   - `path.resolve(releasesDir, cleanPath)`
   - `path.resolve(releasesDir, cleanPath.replace(/^releases\/?/, ''))`
3. Додати `path.resolve(releasesDir)` до `allowedBases`.

---

## 2. Дефект 2: Помилка 404 при зверненні до `/api/releases/:version/tour`
### Симптом:
У консолі браузера:
```
XHR GET http://localhost:3001/api/releases/v0.3.0/tour?locale=en [HTTP/1.1 404 Not Found]
```
### Корінь проблеми:
1. **Маршрутизація ендпоїнта**: Ендпоїнт `/releases/:version/tour` зареєстровано в кореневому `config.endpoints`, але не у `collection.endpoints` колекції `releases`. У Next.js App Router (Payload 3.x) запити до `/api/releases/...` маршрутизуються як операції колекції, якщо не збігаються точно з префіксом колекції.
2. **Параметри шляху**: Регулярний вираз `match(/\/releases\/([^/]+)\/tour/)` у `tourEndpointHandler` не завжди отримує `req.routeParams` у Next.js API-хендлері.
3. **Обробка відсутності туру**: Якщо для релізу немає файлу `tour.nan0`, ендпоїнт повинен повертати `{ version, locale, tour: null }` зі статусом `200 OK`, а не спричиняти падіння запиту.

### Необхідне виправлення:
1. Зареєструвати `tourEndpointHandler` безпосередньо в `collection.endpoints` колекції `Releases` як `/:id/tour` та `/version/:version/tour`, або уніфікувати в кореневих ендпоїнтах.
2. Гарантувати повернення `Response.json({ version, locale, tour: null }, { status: 200 })`, якщо тур не знайдено, щоб клієнтський `ReleaseTourPrompt` не викидав помилку 404 у консоль.

---

## 3. Дефект 3: Показ анонсу оновлень на сторінці входу `/admin/login` (Auth Gate)
### Симптом:
Неавторизований відвідувач на сторінці логіну бачить плаваючу картку «New system update available!».

### Необхідне виправлення в `ReleaseTourPrompt.jsx`:
1. Використати `useAuth()` із `@payloadcms/ui`:
```jsx
const { user } = useAuth?.() || {}
if (!user) return <>{children}</>
```
2. Якщо користувач не залогінений, компонент не виконує жодних запитів до `/api/releases` та не рендерить віджети туру.

---

## 4. План дій для випуску `@nan0web/payload-release@0.3.0`
- [ ] Виправити нормалізацію шляхів у `readReleaseFile` (підтримка абсолютного `releasesDir` та видалення дублікату `releases/`).
- [ ] Додати ендпоїнт туру до `collection.endpoints` та повертати `200` з `tour: null` при відсутності файлу туру.
- [ ] Огорнути рендер `ReleaseTourProvider` у перевірку `useAuth()`.
- [ ] Покрити виправлення сценарними тестами у `packages/payload-release/releases/0/3/v0.3.0/task.spec.js`.
- [ ] Зібрати та опублікувати `@nan0web/payload-release@0.3.0`.

