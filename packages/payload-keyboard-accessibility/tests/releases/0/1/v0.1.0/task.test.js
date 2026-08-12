import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createKeyboardFocusController, isSubmitShortcut, payloadKeyboardFocus } from '../../../../../src/index.js'

describe('payload-keyboard-focus 0.1.0 contract', () => {
	it('focuses the first visible and enabled field in a form scope', () => {
		const hidden = { type: 'input', hidden: true }
		const disabled = { type: 'input', disabled: true }
		const first = { type: 'input', focus() { this.focused = true } }
		const second = { type: 'input', focus() { this.focused = true } }
		const scope = { querySelectorAll: () => [hidden, disabled, first, second] }
		const controller = createKeyboardFocusController({ scope })

		assert.equal(controller.focusFirstField(), true)
		assert.equal(first.focused, true)
		assert.equal(second.focused, undefined)
	})

	it('recognizes Cmd+Enter and Ctrl+Enter as submit shortcuts', () => {
		assert.equal(isSubmitShortcut({ key: 'Enter', metaKey: true, ctrlKey: false }), true)
		assert.equal(isSubmitShortcut({ key: 'Enter', metaKey: false, ctrlKey: true }), true)
		assert.equal(isSubmitShortcut({ key: 'Enter', metaKey: false, ctrlKey: false }), false)
		assert.equal(isSubmitShortcut({ key: 'Escape', metaKey: true, ctrlKey: false }), false)
	})

	it('submits the current form from the keyboard shortcut', () => {
		let submitted = false
		const submit = { type: 'submit', click() { submitted = true } }
		const form = { querySelector: () => submit }
		const controller = createKeyboardFocusController({ scope: form })
		const event = { key: 'Enter', metaKey: true, ctrlKey: false, preventDefault() { this.prevented = true } }

		assert.equal(controller.handleKeyDown(event), true)
		assert.equal(event.prevented, true)
		assert.equal(submitted, true)
	})

	it('submits while editing a form field with the keyboard shortcut', () => {
		let submitted = false
		const form = { querySelector: () => ({ click() { submitted = true } }) }
		const controller = createKeyboardFocusController({ scope: form })
		const event = {
			key: 'Enter',
			metaKey: true,
			ctrlKey: false,
			target: { tagName: 'TEXTAREA' },
			preventDefault() { this.prevented = true }
		}

		assert.equal(controller.handleKeyDown(event), true)
		assert.equal(event.prevented, true)
		assert.equal(submitted, true)
	})

	it('registers the admin controller globally before navigation', () => {
		const config = { admin: { components: { beforeNav: [] } } }
		const updated = payloadKeyboardFocus()(config)

		assert.equal(updated.admin.components.beforeNav[0].path, '@nan0web/payloadcms-keyboard-accessibility/admin#KeyboardFocusAdmin')
	})

	it('keeps default selectors when optional admin props are undefined', () => {
		const field = { focus() { this.focused = true } }
		const scope = {
			activeElement: null,
			querySelectorAll(selector) { return selector.includes('input') ? [field] : [] },
		}
		const controller = createKeyboardFocusController({ scope, fieldSelector: undefined })

		assert.equal(controller.focusFirstField(), true)
		assert.equal(field.focused, true)
	})
})
