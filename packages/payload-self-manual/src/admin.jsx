'use client'

import React, { useEffect, useState, useMemo } from 'react'

export default function SelfManualHelp({ docsDir = 'docs', defaultLocale = 'uk', availableLocales = [] }) {
  const [open, setOpen] = useState(false)
  const [documentList, setDocumentList] = useState([])
  const [activeSlug, setActiveSlug] = useState('')
  const [activeDocument, setActiveDocument] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Determine current locale - only on client side
  const [currentLocale, setCurrentLocale] = useState(defaultLocale.slice(0, 2))
  
  useEffect(() => {
    // Only run on client side
    const getLocale = () => {
      // Try to get locale from Payload's admin context first
      const payloadLocale = window?.payload?.locale || window?.__PAYLOAD_LOCALE__
      if (payloadLocale) return payloadLocale.slice(0, 2)
      
      // Fallback to document element language
      const docLang = document.documentElement.lang
      if (docLang) return docLang.slice(0, 2)
      
      return defaultLocale.slice(0, 2)
    }
    
    setCurrentLocale(getLocale())
  }, [defaultLocale])

  // Current page slug fallback
  const currentPathSlug = useMemo(() => {
    if (typeof window === 'undefined') return 'dashboard'
    const parts = window.location.pathname.split('/').filter(Boolean)
    if (parts.length === 0 || (parts.length === 1 && parts[0] === 'admin') || parts[parts.length - 1] === 'dashboard') {
      return 'dashboard'
    }
    if (parts.includes('collections') && parts.length >= 2) {
      return `collections/${parts[parts.length - 1]}`
    }
    return parts.slice(-2).join('/') || 'dashboard'
  }, [])

  // Toggle or close modal via Keyboard (Esc and Cmd+/)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && open) {
        event.preventDefault()
        setOpen(false)
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault()
        setOpen((previous) => !previous)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Fetch document index and active document when open
  useEffect(() => {
    if (!open) return
    setLoading(true)
    const targetSlug = activeSlug || currentPathSlug
    const query = new URLSearchParams({ locale: currentLocale, slug: targetSlug })

    fetch(`/api/_self-manual?${query}`)
      .then(async (res) => (res.ok ? res.json() : { found: false, index: [] }))
      .then((data) => {
        if (Array.isArray(data.index)) setDocumentList(data.index)
        setActiveDocument(data)
      })
      .catch(() => setActiveDocument({ found: false }))
      .finally(() => setLoading(false))
  }, [open, activeSlug, currentLocale, currentPathSlug])

  // Filter documents by search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documentList
    const q = searchQuery.toLowerCase()
    return documentList.filter(
      (doc) => doc.title?.toLowerCase().includes(q) || 
               doc.slug?.toLowerCase().includes(q) ||
               doc.searchText?.includes(q)
    )
  }, [documentList, searchQuery])

  // Handle internal & external markdown link clicks
  const handleContentClick = (event) => {
    const anchor = event.target.closest('a')
    if (!anchor) return
    const href = anchor.getAttribute('href')
    if (href && href.startsWith('#doc:')) {
      event.preventDefault()
      const newSlug = href.replace('#doc:', '')
      setActiveSlug(newSlug)
    } else if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      anchor.setAttribute('target', '_blank')
      anchor.setAttribute('rel', 'noopener noreferrer')
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Contextual Help (Cmd/Ctrl + /)"
        title="Help (⌘/ or Ctrl+/)"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          alignItems: 'center',
          background: 'var(--theme-elevation-100, #1e1e20)',
          border: '1px solid var(--theme-elevation-300, #333)',
          borderRadius: '50%',
          color: 'var(--theme-text, #fff)',
          cursor: 'pointer',
          display: 'inline-flex',
          fontSize: '16px',
          fontWeight: 700,
          height: '34px',
          justifyContent: 'center',
          lineHeight: 1,
          margin: '0 8px',
          width: '34px',
        }}
      >
        ?
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Documentation"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            inset: 0,
            justifyContent: 'center',
            padding: '24px',
            position: 'fixed',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: 'var(--theme-bg, #121214)',
              border: '1px solid var(--theme-elevation-200, #27272a)',
              borderRadius: '8px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'row',
              height: '85vh',
              maxWidth: '1100px',
              overflow: 'hidden',
              position: 'relative',
              width: '100%',
            }}
          >
            {/* Sidebar Navigation */}
            <aside
              style={{
                background: 'var(--theme-elevation-50, #18181b)',
                borderRight: '1px solid var(--theme-elevation-200, #27272a)',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px',
                width: '280px',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Search docs (⌘/)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'var(--theme-elevation-100, #202023)',
                    border: '1px solid var(--theme-elevation-200, #27272a)',
                    borderRadius: '4px',
                    color: 'var(--theme-text, #fff)',
                    fontSize: '13px',
                    padding: '8px 12px',
                    width: '100%',
                  }}
                />
              </div>

              <nav style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Manuals ({currentLocale.toUpperCase()})
                </div>
                {filteredDocuments.map((item) => {
                  const isActive = (activeSlug || currentPathSlug) === item.slug
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => setActiveSlug(item.slug)}
                      style={{
                        background: isActive ? 'var(--theme-elevation-200, #27272a)' : 'transparent',
                        border: 0,
                        borderRadius: '4px',
                        color: isActive ? 'var(--theme-success, #16a34a)' : 'var(--theme-text, #ccc)',
                        cursor: 'pointer',
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: isActive ? 600 : 400,
                        marginBottom: '4px',
                        padding: '8px 10px',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      {item.title || item.slug}
                    </button>
                  )
                })}
              </nav>
            </aside>

            {/* Content Body */}
            <main
              onClick={handleContentClick}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '32px 40px',
                position: 'relative',
              }}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '24px',
                  lineHeight: 1,
                  position: 'absolute',
                  right: '20px',
                  top: '16px',
                }}
              >
                ×
              </button>

              {loading && <p style={{ color: '#888' }}>Loading documentation…</p>}

              {!loading && activeDocument && !activeDocument.found && (
                <article
                  className="self-manual-article"
                  style={{ lineHeight: 1.6, padding: '20px 0' }}
                  dangerouslySetInnerHTML={{ __html: activeDocument.html }}
                />
              )}

              {!loading && activeDocument?.found && (
                <article
                  className="self-manual-article"
                  style={{ lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: activeDocument.html }}
                />
              )}
            </main>
          </div>
        </div>
      )}
    </>
  )
}
