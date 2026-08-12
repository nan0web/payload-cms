export const THEMES = ['light', 'dark', 'system']
export const DEFAULT_STORAGE_KEY = 'payload-signin-theme'

export function normalizeTheme(value) {
  return THEMES.includes(value) ? value : null
}

export function readTheme(storage, key = DEFAULT_STORAGE_KEY) {
  try {
    return normalizeTheme(storage?.getItem(key))
  } catch {
    return null
  }
}

export function writeTheme(storage, theme, key = DEFAULT_STORAGE_KEY) {
  const normalized = normalizeTheme(theme)
  if (!normalized) return false
  try {
    storage?.setItem(key, normalized)
    return true
  } catch {
    return false
  }
}

export function resolveTheme(theme, prefersDark) {
  return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
}

export function payloadSigninThemeState(options = {}) {
  return (config = {}) => {
    const key = options.storageKey || DEFAULT_STORAGE_KEY
    const providers = Array.isArray(config.admin?.components?.providers)
      ? config.admin.components.providers
      : config.admin?.components?.providers ? [config.admin.components.providers] : []
    return {
      ...config,
      admin: {
        ...config.admin,
        components: {
          ...config.admin?.components,
          providers: [...providers, '@nan0web/payload-signin-theme-state/admin#ThemeProvider'],
          beforeLogin: [...(config.admin?.components?.beforeLogin ? (Array.isArray(config.admin.components.beforeLogin) ? config.admin.components.beforeLogin : [config.admin.components.beforeLogin]) : []), '@nan0web/payload-signin-theme-state/first-paint#ThemeFirstPaint'],
        },
      },
    }
  }
}
