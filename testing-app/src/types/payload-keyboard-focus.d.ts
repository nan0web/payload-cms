declare module 'payload-keyboard-focus' {
  import type { Config } from 'payload'

  type PayloadKeyboardFocusOptions = {
    fieldSelector?: string
    submitSelector?: string
    optOutAttribute?: string
    scopeSelector?: string
  }

  export function payloadKeyboardFocus(
    options?: PayloadKeyboardFocusOptions,
  ): (config: Config) => Config
}
