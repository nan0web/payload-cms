'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_STORAGE_KEY, readTheme, resolveTheme, writeTheme } from './index.js'

const ThemeContext = createContext(null)

export function ThemeProvider({ children, storageKey = DEFAULT_STORAGE_KEY }) {
  const [theme, setTheme] = useState(() => readTheme(typeof localStorage === 'undefined' ? null : localStorage, storageKey) || 'system')
  const [prefersDark, setPrefersDark] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const update = () => setPrefersDark(media.matches)
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])
  useEffect(() => {
    writeTheme(localStorage, theme, storageKey)
    const resolved = resolveTheme(theme, prefersDark)
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved
  }, [theme, prefersDark, storageKey])
  const value = useMemo(() => ({ theme, setTheme: (next) => setTheme(next), resolvedTheme: resolveTheme(theme, prefersDark) }), [theme, prefersDark])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
