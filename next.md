Edited next.md
Searched for "@nan0web/release"
Viewed task.md:50-68
Ran command: `pnpm --filter @nan0web/release run test:all`
Ran command: `dilo validate packages/release`
Viewed user.md:1-28
Ran command: `git status -s packages/release/ apps/release.app/`

### Що зроблено та аналіз ситуації

1. **Очищення приватності у [next.md](file:///Users/i/src/nan.web/apps/3rdparty/payload-cms/next.md#L42-L62):**
   - Усі згадки приватного проєкту `industrialbank` видалено з публічного репозиторію.
   - Розділ узагальнено як універсальний покроковий гайд підключення `@nan0web/payload-release` до будь-якого споживчого додатку Payload CMS.

2. **Стан пакетів та версій:**
   - **`@nan0web/release` (ядро PMaC / `dilo`):**
     - В npm опубліковано: `3.5.0`.
     - У робочій копії монорепозиторію повністю розроблено `3.6.0`:
       - 9 з 9 завдань виконано;
       - Усі контрактні тести, документаційні тести (`test:docs`), `tsc` та `knip` — **100% Green**;
       - Усі зміни локальні (ще не закомічені та не запечатані).
   - **`@nan0web/payload-release` (плагін CMS):**
     - Версія: `0.1.0`.
     - Ще не публікувався в npm (E404).
     - Повністю проходить валідацію `dilo validate` та `test:all`.

3. **Логіка та стратегія:**
   - Ваша думка повністю обґрунтована: спершу запечатати й опублікувати **`@nan0web/release@3.6.0`** в npm (оскільки саме там реалізовано покращений парсинг frontmatter, `dilo example`, гнучкі маски контрактів і закриття тестів).
   - Після цього `@nan0web/payload-release` (та будь-які інші пакети) зможуть спиратися на актуальний CLI/SDK `^3.6.0`.

---

### Наступні кроки для випуску `@nan0web/release@3.6.0`:

1. **Запечатати реліз `v3.6.0` у `@nan0web/release`:**
   - Перевести статус у `done` в [task.md](file:///Users/i/src/nan.web/packages/release/releases/3/6/v3.6.0/task.md) та [user.md](file:///Users/i/src/nan.web/packages/release/releases/3/6/v3.6.0/user.md);
   - Виконати закриття спеки: перейменувати або перемістити `task.spec.js` в `src/tests/releases/3/6/v3.6.0/task.test.js` (через `dilo close v3.6.0`);
   - Оновити `releases/current.js` на v3.6.0.
2. **Опублікувати `@nan0web/release@3.6.0` в npm.**
3. **Опублікувати `@nan0web/payload-release@0.1.0` в npm.**

Чи переходимо до процедури запечатування та публікації `@nan0web/release@3.6.0`?
