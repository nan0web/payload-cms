---
status: done
type: minor
epic: EPIC-PAYLOAD-RELEASE
sprint: Sprint 44
tracker: https://github.com/nan0web/payload-cms/issues/{id}
---

# v0.2.0 — payload-release: Interactive Product Tour & Release Onboarding

## Опис та Мета
Впровадження системи інтерактивних турів нових релізів (Product Tour & Onboarding) для `@nan0web/payload-release` на основі архітектурного дослідження `docs/uk/architecture/tour-analysis.md`. Плагін надає користувачам адмін-панелі покроковий візуальний огляд нових можливостей із підтримкою підсвічування DOM-елементів (SVG Spotlight), перевіркою SPA-роутів, інтерактивними кроками (`next`, `click`, `select`, `fill`), декларативним маніфестом `tour.nan0` у структурі релізів, мультиязичністю (@nan0web/i18n) та збереженням прогресу (LocalStorage + User Preferences).

## Команда
- **Lead / Architect:** Олександр Снігірьов (@snigirev)
- **AI Lead Developer:** Agent Antigravity (@agy)
- **Auditor:** Security Bot (@sec-bot)

## Робочий План та Задачі

### 1. Моделі Даних та Маніфест Туру (Model-as-Schema & Variant B)
- [x] [#TOUR-1] Створення `TourStepModel.js` та `TourManifestModel.js` на базі `@nan0web/types` з валідацією полів: `version`, `title`, `steps` (`step`, `route`, `target`, `title`, `content`, `position`, `action`, `value`, `waitFor`).
- [x] [#TOUR-2] Парсер `tour.nan0` (підтримка YAML/Key-Value формату туру без зовнішніх залежностей) у `src/domain/TourStepModel.js`.
- [x] [#TOUR-3] Створення демонстраційних маніфестів туру за стандартом Варіанта Б: базовий англомовний `releases/0/2/v0.2.0/tour.nan0` та автономний локалізований `releases/0/2/v0.2.0/uk/tour.nan0`.

### 2. Серверний Дискавері та API Туру (Multilingual Discovery)
- [x] [#DISC-1] Розширення `discoverReleases()` зчитуванням маніфесту `tour.nan0` із директорії релізу та інтеграцією кроків у поле `tour` документа релізу.
- [x] [#DISC-2] Додавання поля `tour` у схему колекції `Releases` (JSON або масив кроків з заголовком та статусом).
- [x] [#DISC-3] Ендпоінт `GET /api/releases/:version/tour?locale=...` з прямою віддачею локалізованого маніфесту (`uk/tour.nan0`) або автоматичним fallback на базовий (`tour.nan0`).

### 3. UI-компоненти Туру (OLMUI & Zero Dependencies)
- [x] [#UI-1] Компонент `TourSpotlight`: плавний затемнюючий DOM-оверлей / SVG cutout навколо цільового елемента (`target`) з реакцією на скрол та ресайз.
- [x] [#UI-2] Компонент `TourPopover`: інформаційний тултіп з заголовком, текстом, кроками (наприклад `2 з 4`), кнопками «Назад», «Далі», «Пропустити» та автоматичним позиціонуванням (`top`, `bottom`, `left`, `right`).
- [x] [#UI-3] Інтерактивні тригери: перехід за SPA-роутом (`route`), очікування елемента (`waitFor`), перехоплення кліку користувача (`action: click`) або введення тексту (`action: fill`).
- [x] [#UI-4] Збереження стану туру: дворівневе збереження у `localStorage['@nan0web/release.tour']` та відправка прогресу на сервер у налаштування користувача.
- [x] [#UI-5] Кнопка запуску туру `TourLauncher` у рядку/шапці релізу (`👁️ Запустити тур релізу v0.2.0`) для повторного проходження.

## Критерії Прийнятності (DoD)
- [x] [#DOD-1] Створено реліз `releases/0/2/v0.2.0/` з артефактами `task.md`, `tour.nan0` та `task.spec.js`.
- [x] [#DOD-2] `TourStepModel` та `TourManifestModel` валідують коректність структури кроків туру.
- [x] [#DOD-3] `tour.nan0` парситься автоматично під час `discoverReleases()` та зв'язується з відповідною версією.
- [x] [#DOD-4] UI туру не має сторонніх важких бібліотек (0 зовнішніх залежностей типу shepherd чи intro.js).
- [x] [#DOD-5] Підтримуються інтерактивні кроки та переходи між сторінками Payload Admin.
- [x] [#DOD-6] Усі BDD/контрактні тести в `releases/0/2/v0.2.0/task.spec.js` проходять (`pnpm test`).
- [x] [#DOD-7] Перевірка сумісності пакета `pnpm pack:check` та білд `pnpm build` завершуються без помилок.
