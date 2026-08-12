const DEFAULT_FIELD_SELECTOR = 'input, textarea, select, [contenteditable="true"]'
const DEFAULT_SUBMIT_SELECTOR = [
  'button[type="submit"]',
  'input[type="submit"]',
  '[data-payload-primary-action="true"]',
  'button',
].join(', ')

const DEFAULT_OPTIONS = {
  fieldSelector: DEFAULT_FIELD_SELECTOR,
  submitSelector: DEFAULT_SUBMIT_SELECTOR,
  optOutAttribute: 'data-keyboard-focus-ignore',
  scopeSelector: 'form, [role="dialog"]',
}

function isVisible(element) {
  if (!element || element.hidden || element.disabled) return false
  if (element.getAttribute?.('aria-hidden') === 'true') return false
  if (typeof element.getClientRects === 'function' && element.getClientRects().length === 0) {
    return Boolean(element.offsetParent) || element.getClientRects().length > 0
  }
  return true
}

function isOptedOut(element, attribute) {
  return Boolean(element?.hasAttribute?.(attribute) || element?.closest?.(`[${attribute}]`))
}

function isKeyboardMenuTarget(target) {
  return Boolean(target?.closest?.('[role="menu"], [role="listbox"], [data-keyboard-menu]'))
}

export function isSubmitShortcut(event) {
  return event?.key === 'Enter' && Boolean(event.metaKey || event.ctrlKey) && !event.altKey
}

export function createKeyboardFocusController({ scope, ...inputOptions } = {}) {
  const options = { ...DEFAULT_OPTIONS }
  for (const [key, value] of Object.entries(inputOptions)) {
    if (value !== undefined) options[key] = value
  }
  const root = scope || (typeof document !== 'undefined' ? document : null)
  let focusedByController = false

  const getFields = () => root?.querySelectorAll?.(options.fieldSelector) || []
  const getSubmit = () => {
    const candidates = root?.querySelectorAll?.(options.submitSelector) ||
      (root?.querySelector ? [root.querySelector(options.submitSelector)] : [])
    return Array.from(candidates).find((element) => {
      const text = element?.textContent?.trim().toLowerCase() || ''
      const label = element?.getAttribute?.('aria-label')?.toLowerCase() || ''
      const isSubmit = element?.matches?.('button[type="submit"], input[type="submit"], [data-payload-primary-action="true"]')
      return isVisible(element) && (isSubmit || text === 'save' || text === 'submit' || label === 'save' || label === 'submit' || !element?.matches)
    })
  }

  return {
    focusFirstField() {
      if (!root || root.activeElement?.matches?.(options.fieldSelector)) return false
      const field = Array.from(getFields()).find((element) =>
        isVisible(element) && !element.autofocus && !isOptedOut(element, options.optOutAttribute),
      )
      if (!field?.focus) return false
      field.focus()
      focusedByController = true
      return true
    },
    handleKeyDown(event) {
      if (!isSubmitShortcut(event) || isKeyboardMenuTarget(event.target) ||
        isOptedOut(event.target, options.optOutAttribute)) return false
      const submit = getSubmit()
      if (!submit?.click) return false
      event.preventDefault?.()
      submit.click()
      return true
    },
    isFocusedByController() {
      return focusedByController
    },
  }
}

export function payloadKeyboardFocus(options = {}) {
  return (config) => {
    const existing = config?.admin?.components?.beforeNav || []
    return {
      ...config,
      admin: {
        ...config?.admin,
        components: {
          ...config?.admin?.components,
          beforeNav: [...(Array.isArray(existing) ? existing : [existing]), {
            path: '@nan0web/payloadcms-keyboard-accessibility/admin#KeyboardFocusAdmin',
            clientProps: options,
          }],
        },
      },
    }
  }
}

export { DEFAULT_FIELD_SELECTOR, DEFAULT_OPTIONS }
