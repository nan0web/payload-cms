# @nan0web/payloadcms-keyboard-accessibility

Плагін Payload CMS Admin для передбачуваної клавіатурної навігації у формах і модальних діалогах.

## Можливості

- встановлює фокус на першому видимому та доступному полі після відкриття форми або діалогу;
- підтримує `Cmd+Enter` на macOS та `Ctrl+Enter` на Windows/Linux для основної дії збереження;
- працює у звичайних формах і модальних діалогах;
- не забирає вже встановлений користувацький фокус під час повторного рендерингу;
- пропускає приховані, вимкнені та позначені для виключення поля;
- підтримує `textarea` і `contenteditable`, не перехоплюючи звичайний `Enter`;
- коректно працює, якщо у формі немає кнопки submit.

Плагін не змінює backend Payload, схеми, колекції або storage adapter.

## Встановлення

```bash
pnpm add @nan0web/payloadcms-keyboard-accessibility
```

## Підключення

```js
import { buildConfig } from 'payload'
import { payloadKeyboardFocus } from '@nan0web/payloadcms-keyboard-accessibility'

export default buildConfig({
  plugins: [payloadKeyboardFocus()],
})
```

Опції дозволяють налаштувати selectors полів, submit, scope та opt-out:

```js
payloadKeyboardFocus({
  fieldSelector: 'input, textarea, select, [contenteditable="true"]',
  submitSelector: 'button[type="submit"], button',
  scopeSelector: 'form, [role="dialog"]',
  optOutAttribute: 'data-keyboard-focus-ignore',
})
```

## Поведінка клавіатури

- звичайний `Enter` не перехоплюється;
- `Cmd+Enter` або `Ctrl+Enter` запускає основну submit-дію поточної форми чи діалогу;
- shortcut працює у textarea та rich-text/contenteditable полях;
- фокус обмежується поточним scope форми або діалогу.

## Перевірки розробки

```bash
pnpm test
pnpm test:all
```

## Ліцензія

ISC
