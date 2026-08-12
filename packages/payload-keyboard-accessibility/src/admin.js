'use client'

import { useEffect } from 'react'
import { createKeyboardFocusController } from './index.js'

export function KeyboardFocusAdmin({ fieldSelector, submitSelector, optOutAttribute, scopeSelector } = {}) {
  useEffect(() => {
    const controllers = new Map()
    const options = { fieldSelector, submitSelector, optOutAttribute, scopeSelector }
    const scopes = () => Array.from(document.querySelectorAll(scopeSelector || 'form, [role="dialog"]'))

    const sync = () => {
      for (const scope of scopes()) {
        if (!controllers.has(scope)) {
          const controller = createKeyboardFocusController({ scope, ...options })
          controllers.set(scope, controller)
          queueMicrotask(() => controller.focusFirstField())
          setTimeout(() => controller.focusFirstField(), 50)
          setTimeout(() => controller.focusFirstField(), 250)
        }
      }
      for (const scope of controllers.keys()) {
        if (!document.contains(scope)) controllers.delete(scope)
      }
    }

    const onKeyDown = (event) => {
      for (const [scope, controller] of controllers) {
        if (scope.contains(event.target)) controller.handleKeyDown(event)
      }
    }

    sync()
    document.addEventListener('keydown', onKeyDown)
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      observer.disconnect()
    }
  }, [fieldSelector, submitSelector, optOutAttribute, scopeSelector])

  return null
}
