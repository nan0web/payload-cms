---
version: 0.1.0
type: feature
status: done
locale: uk
models: []
---

# Mission: Keyboard Focus для Payload Admin

## Overview

Створити окремий Payload CMS Admin-плагін, який дає передбачувану клавіатурну навігацію в усіх формах адміністративної панелі. Після відкриття форми або діалогового вікна користувач одразу може вводити дані, а `Cmd+Enter` на macOS чи `Ctrl+Enter` на Windows/Linux запускає основну дію збереження.

Плагін не належить до storage-адаптера і не змінює backend або схему даних Payload.

## User Stories

- Як користувач Payload Admin, я хочу після відкриття форми одразу мати фокус на першому доступному полю, щоб не шукати його мишкою.
- Як користувач Payload Admin, я хочу натискати `Cmd+Enter` на macOS або `Ctrl+Enter` на Windows/Linux, щоб зберігати форму з клавіатури.
- Як користувач Payload Admin, я хочу однакову поведінку у звичайних формах і модальних діалогах, щоб не запам'ятовувати різні правила.
- Як користувач Payload Admin, я хочу писати багаторядковий текст і працювати з rich-text редактором без випадкового submit через `Enter`.
- Як розробник Payload, я хочу підключити функцію окремим plugin/component без зміни колекцій та бізнес-логіки.

## Architecture

- Окремий npm-пакет `payload-keyboard-focus` для Payload 3.x.
- Публічний factory/plugin API: `payloadKeyboardFocus(options?)`.
- Client-side Admin component монтується через Payload Admin config.
- Фокус виконується після відкриття/рендерингу форми та після зміни активного діалогу.
- Ціль фокусу: перший видимий, enabled та не прихований `input`, `textarea`, `select` або `[contenteditable="true"]` у поточному scope.
- Елементи з `autofocus`, поточний фокус користувача та поля, позначені opt-out атрибутом, не перезаписуються.
- Keyboard handler працює на рівні поточної форми/діалогу та шукає primary submit button: `type="submit"`, Payload primary action або кнопку з доступною назвою Save/Submit.
- `Cmd+Enter` і `Ctrl+Enter` викликають submit без синтетичного натискання звичайного `Enter`.
- Події в `textarea`, rich-text editor, `contenteditable`, клавіатурних меню та полях з opt-out не submit-ять форму.
- Плагін не читає secrets, не змінює дані та не вимагає storage adapter.

## Scope

- [x] Створити package API та Payload 3.x admin integration.
- [x] Додати пошук першого доступного поля з коректним focus timing.
- [x] Додати `Meta+Enter`/`Ctrl+Enter` для submit усіх підтриманих форм.
- [x] Додати opt-out та конфігурацію selector/scope без обов'язкової ручної розмітки.
- [x] Покрити unit/contract тести DOM-поведінки.
- [ ] Додати Playwright E2E у Payload application для звичайної форми та діалогу.
- [x] Документувати встановлення, підключення та ручну перевірку на macOS і Windows/Linux.

## Out of Scope

- Заміна Payload Admin UI або кастомізація стилів.
- Submit при звичайному `Enter`.
- Автоматична зміна Tab order.
- Перехоплення клавіш усередині textarea/rich-text/editor menus.
- Зміни в `payload-self-storage`.

## Acceptance Criteria

- [x] `task.spec.js` описує прямі функціональні контракти та проходить після реалізації.
- [x] Після відкриття звичайної форми перший доступний input отримує focus.
- [x] Після відкриття діалогу перший доступний input у цьому діалозі отримує focus, а не поле поза діалогом.
- [x] При вже встановленому користувацькому focus плагін не краде focus під час ререндеру.
- [x] `Meta+Enter` виконує submit на macOS-подібній події.
- [x] `Ctrl+Enter` виконує submit на Windows/Linux-подібній події.
- [x] Shortcut працює для form submit без прямого доступу до внутрішніх Payload API.
- [x] Shortcut не виконує submit у textarea, rich-text/contenteditable та клавіатурних меню.
- [x] Недоступні, disabled та hidden поля пропускаються.
- [x] Відсутність submit-кнопки не викликає помилку і не ламає форму.
- [x] Плагін можна підключити в `buildConfig({ plugins: [...] })` без зміни колекцій.
- [ ] Unit/contract та Payload Playwright E2E тести проходять окремо з короткими таймаутами.
- [x] README містить встановлення та ручний сценарій перевірки.

## Verification

```text
npm run release:spec
npm test
npm run test:e2e -- --grep keyboard-focus
```

Для Payload application перевірити окремо:

1. відкрити `/admin`;
2. перейти до колекції з формою;
3. підтвердити focus першого поля;
4. змінити значення та натиснути `Cmd+Enter` або `Ctrl+Enter`;
5. відкрити modal relation/upload dialog і повторити перевірку;
6. у textarea/rich-text переконатися, що shortcut не перериває введення.

## User Verification

- **Дата:** 2026-08-11
- **Статус:** працює
- **Коментар:** Плагін протестовано вручну — фокус на перше поле, Cmd/Ctrl+Enter submit, textarea не блокується.
