# @nan0web/payloadcms-keyboard-accessibility

Payload CMS Admin plugin for predictable keyboard navigation in forms and modal dialogs.

## Документація

- [Українська документація](docs/uk/README.md)

## Install

```bash
pnpm add @nan0web/payloadcms-keyboard-accessibility
```

## Configuration

```js
import { buildConfig } from 'payload'
import { payloadKeyboardFocus } from '@nan0web/payloadcms-keyboard-accessibility'

export default buildConfig({
  plugins: [payloadKeyboardFocus()],
})
```

Options allow customizing field, submit, scope, and opt-out selectors:

```js
payloadKeyboardFocus({
  fieldSelector: 'input, textarea, select, [contenteditable="true"]',
  submitSelector: 'button[type="submit"], button',
  scopeSelector: 'form, [role="dialog"]',
  optOutAttribute: 'data-keyboard-focus-ignore',
})
```

## Keyboard behavior

- Ordinary `Enter` is not intercepted.
- `Cmd+Enter` on macOS or `Ctrl+Enter` on Windows/Linux triggers the primary submit action in the current form or dialog.
- The shortcut works from textareas and rich-text/contenteditable fields.
- Focus is limited to the current form or dialog scope.

## Manual verification

In a Payload application:

1. Open `/admin`.
2. Navigate to a collection with a form.
3. Confirm the first visible and enabled field receives focus.
4. Change a value and press `Cmd+Enter` on macOS or `Ctrl+Enter` on Windows/Linux.
5. Open a modal relation/upload dialog and repeat the focus and submit check.
6. In a `textarea` or rich-text editor, confirm `Cmd/Ctrl+Enter` submits while ordinary `Enter` does not.

## Testing

```bash
npm run release:spec
npm test
npm run test:e2e -- --grep keyboard-focus
```

Unit/contract and Playwright E2E tests run independently.

## Out of scope

This plugin is not intended for:

- replacing Payload Admin UI or customizing its styles;
- automatic Tab order changes;
- submitting via ordinary `Enter`;
- submitting via ordinary `Enter` inside `textarea` or rich-text/editor;
- modifying `payload-self-storage`.

## License

ISC
