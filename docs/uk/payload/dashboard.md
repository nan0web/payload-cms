# Панель керування та Інструкція користувача

Ласкаво просимо до адміністративної системи Payload CMS!

## Архітектура плагінів системи

Нижче представлена схема взаємодії 5 плагінів нашої екосистеми:

![Payload Architecture Diagram](../../media/architecture.png)

### Інтерактивна діаграма Mermaid

```mermaid
graph TD
  A["Пользовательский запрос"] --> B["Payload CMS Admin"]
  B --> C["Theme Plugin (Zero Flash)"]
  B --> D["Self Storage Plugin"]
  D --> E["On-Demand WebP Files"]
  B --> F["Contextual Manual Plugin"]
```

---

## Швидка навігація

- 📁 **[Перейти до інструкції з Медіа-файлів](#doc:collections/media)**
- 🌐 **[Офіційна документація Payload CMS (Зовнішнє посилання)](https://payloadcms.com)**

## Швидкі клавіші
- `⌘ /` або `Ctrl + /` — Перемикання цієї довідки
- `Esc` — Закрити модальне вікно
- `⌘ Enter` — Швидке збереження форми
