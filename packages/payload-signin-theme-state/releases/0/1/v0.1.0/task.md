# payload-signin-theme-state v0.1.0

## Мета

Окремий Payload CMS 3.x plugin для збереження теми Admin UI у браузері та усунення спалаху (Zero-Flicker) на сторінці входу.

## Scope

- Persist selected light/dark theme in browser `localStorage`, independently of Payload user records.
- Apply the saved theme before Login UI paints, avoiding a bright flash on a dark preference.
- Set default `#0f0f10` dark canvas background in CSS so initial HTTP response has non-glaring background before JS hydration.
- Fix React 19 / Payload 3.87 console script warning (`Encountered a script tag...`) by using isomorphic layout effects.
- Use a stable, configurable storage key and validate stored values.
- Support system preference fallback when no explicit browser preference exists.
- Add tests for theme persistence, invalid values, first-paint behavior, and configuration transforms.

## Виправлення та технічні деталі

1. **Запобігання попередженням React 19**: Тег `<script>` у JSX компонента `ThemeFirstPaint` замінено на `useIsomorphicLayoutEffect`, що виключає помилки рендерингу у Payload 3.87.
2. **Темний колір фону за замовчуванням**: У статичних стилях `custom.scss` зафіксовано `background-color: #0f0f10 !important; color-scheme: dark;`, що гарантує відсутність білого спалаху при найпершому завантаженні сторінки авторизації.

## Definition of Done

- Reloading Login/Admin preserves the selected theme from `localStorage`.
- Login does not flash light theme for a saved dark preference.
- All unit tests pass cleanly.
