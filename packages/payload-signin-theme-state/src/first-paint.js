'use client'

export function getFirstPaintThemeScript(storageKey) {
  const key = JSON.stringify(storageKey)
  return `(function(){try{var d=document.documentElement;var t=localStorage.getItem(${key})||localStorage.getItem('payload-theme');if(t!=='light'&&t!=='dark'&&t!=='system')t='system';var isDark=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var th=isDark?'dark':'light';d.dataset.theme=th;d.setAttribute('data-theme',th);d.className=(d.className||'').replace(/theme-\\w+/g,'')+' theme-'+th;d.style.colorScheme=th}catch(e){}})()`
}

import React from 'react'

export function ThemeFirstPaint({ storageKey }) {
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    const code = getFirstPaintThemeScript(storageKey)
    try {
      const fn = new Function(code)
      fn()
    } catch {}
  }, [storageKey])

  return null
}
