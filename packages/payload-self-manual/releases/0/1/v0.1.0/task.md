# payload-self-manual v0.1.0

## Мета

Вбудована контекстна довідка у форматі Markdown для Payload CMS Admin UI.

## Scope

- In-admin contextual help modal via top header `?` button and `⌘ /` / `Ctrl + /` keyboard shortcut.
- Fast modal dismissal via `Esc` key and toggle shortcut.
- Full-text search and permanent sidebar index for all available guides.
- Multi-language (N-locale) support with cascading fallback (`en` -> `uk`).
- Rich Markdown rendering (internal `#doc:` links, external `target="_blank"` links, embedded images, and Mermaid flowcharts).
- In-package embedded documentation (`docs/{locale}/README.md`).

## Виправлення та технічні деталі

1. **Каскадна локалізація**: Якщо для запитаної локалі (наприклад `en`) немає окремого файлу, індекс завантажує заумочувальну мову `uk` або вбудований довідник пакета, запобігаючи помилкам 404 та збереженню сайдбару.
2. **Багатий вміст**: Забезпечено коректну обробку кліків по посиланнях, відмальовування схем Mermaid та підтримку медіа-ілюстрацій.

## Definition of Done

- Help modal toggles cleanly with keyboard shortcuts `Esc` and `⌘/`.
- Sidebar menu never disappears when switching articles.
- Embedded rich markdown renders correctly.
