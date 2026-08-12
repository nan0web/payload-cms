---
version: 0.1.0
type: feature
status: planning
locale: en
models: []
---

# Mission: Keyboard Focus for Payload Admin

## Overview

Create a separate Payload CMS Admin plugin that provides predictable keyboard navigation in all administrative forms. When a form or dialog opens, the user can immediately type, and `Cmd+Enter` on macOS or `Ctrl+Enter` on Windows/Linux triggers the primary save action.

The plugin is independent from the storage adapter and does not change Payload backend behavior or data schemas.

## User Stories

- As a Payload Admin user, I want the first available field focused when a form opens so I do not need the mouse.
- As a Payload Admin user, I want `Cmd+Enter` on macOS or `Ctrl+Enter` on Windows/Linux to save a form from the keyboard.
- As a Payload Admin user, I want the same behavior in regular forms and modal dialogs.
- As a user editing multiline or rich text, I do not want a normal Enter or the shortcut to accidentally submit while editing.
- As a Payload developer, I want to install the feature as an independent plugin without changing collections or business logic.

## Scope

- [ ] Create the package API and Payload 3.x Admin integration.
- [ ] Focus the first eligible field after form/dialog mount.
- [ ] Add `Meta+Enter`/`Ctrl+Enter` primary submit behavior.
- [ ] Add opt-out and selector/scope configuration.
- [ ] Add unit/contract DOM tests.
- [ ] Add Playwright E2E coverage in the Payload application.
- [ ] Document installation and manual verification on macOS and Windows/Linux.

## Acceptance Criteria

- [ ] `task.spec.js` contains direct functional contracts and passes after implementation.
- [ ] The first visible, enabled field in a regular form receives focus.
- [ ] The first eligible field inside an opened dialog receives focus.
- [ ] Existing user focus is not stolen during rerenders.
- [ ] `Meta+Enter` submits on macOS-like events.
- [ ] `Ctrl+Enter` submits on Windows/Linux-like events.
- [ ] The shortcut does not submit from textarea, rich-text/contenteditable, or keyboard menus.
- [ ] Hidden and disabled fields are skipped.
- [ ] Missing submit buttons are handled without errors.
- [ ] The plugin can be added to `buildConfig({ plugins: [...] })` without collection changes.
- [ ] Unit/contract tests and Payload Playwright E2E tests pass independently.
- [ ] README documents installation and manual verification.

## Verification

```text
npm run release:spec
npm test
npm run test:e2e -- --grep keyboard-focus
```
