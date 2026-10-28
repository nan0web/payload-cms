'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { MailTesterConfigModel } from './MailTesterConfigModel.js'
import { getTranslator, createSyncTranslator } from './i18n.js'
import './admin.css'

const { UI } = MailTesterConfigModel

/**
 * Diagnostic View for testing and inspecting the mail configuration.
 */
export function MailTesterView() {
  const [locale, setLocale] = useState('uk')
  const [tFn, setTFn] = useState(() => createSyncTranslator({}, 'uk'))
  const [statusData, setStatusData] = useState(null)
  const [checking, setChecking] = useState(true)
  const [recipient, setRecipient] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)

  useEffect(() => {
    const loc = (typeof document !== 'undefined' && document.documentElement.lang) || 'uk'
    const short = loc.slice(0, 2)
    setLocale(short)
    getTranslator(short).then((translator) => {
      setTFn(() => translator)
    })
  }, [])

  const t = tFn

  const checkStatus = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/mail-tester?action=status')
      const data = await res.json()
      setStatusData(data)
    } catch (err) {
      setStatusData({ status: 'error', message: err.message })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const handleSendTest = async (e) => {
    e.preventDefault()
    if (!recipient) return

    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/mail-tester?action=send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipient }),
      })
      const data = await res.json()
      setSendResult({ ok: res.ok && data.ok, data })
    } catch (err) {
      setSendResult({ ok: false, data: { message: err.message } })
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = () => {
    if (checking) {
      return <span className="mail-tester-badge loading">⏳ {t(UI.statusChecking)}</span>
    }
    if (statusData?.isMock) {
      return <span className="mail-tester-badge mock">⚠️ {t(UI.statusMock)}</span>
    }
    if (statusData?.status === 'ready') {
      return <span className="mail-tester-badge ready">🟢 {t(UI.statusReady)}</span>
    }
    return <span className="mail-tester-badge error">🔴 {t(UI.statusError)}</span>
  }

  return (
    <div className="mail-tester-container">
      <header className="mail-tester-header">
        <h1 className="mail-tester-title">{t(UI.pageTitle)}</h1>
        <p className="mail-tester-desc">{t(UI.pageDescription)}</p>
      </header>

      {/* Transport Status Card */}
      <section className="mail-tester-card">
        <div className="mail-tester-card-title">
          <span>{t(UI.statusTitle)}</span>
          {getStatusBadge()}
        </div>

        <div className="mail-tester-meta-row">
          <span className="mail-tester-label">{t(UI.transportLabel)}</span>
          <span className="mail-tester-val">{statusData?.type || '—'}</span>
        </div>

        {statusData?.sendmailPath && (
          <div className="mail-tester-meta-row">
            <span className="mail-tester-label">Sendmail Path</span>
            <span className="mail-tester-val">{statusData.sendmailPath}</span>
          </div>
        )}

        {statusData?.message && (
          <div className="mail-tester-meta-row">
            <span className="mail-tester-label">Info</span>
            <span style={{ fontSize: '0.85rem' }}>{statusData.message}</span>
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="mail-tester-btn-secondary"
            onClick={checkStatus}
            disabled={checking}
          >
            {checking ? '…' : t(UI.refreshStatus)}
          </button>
        </div>
      </section>

      {/* Send Test Email Card */}
      <section className="mail-tester-card">
        <h2 className="mail-tester-card-title">{t(UI.sendTestBtn)}</h2>

        <form onSubmit={handleSendTest} className="mail-tester-form">
          <div className="mail-tester-field">
            <label htmlFor="mail-tester-to" className="mail-tester-label">
              {t(UI.recipientLabel)}
            </label>
            <input
              id="mail-tester-to"
              type="email"
              required
              className="mail-tester-input"
              placeholder={t(UI.recipientPlaceholder)}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="mail-tester-actions">
            <button
              type="submit"
              className="mail-tester-btn-primary"
              disabled={sending || !recipient}
            >
              {sending ? t(UI.sending) : t(UI.sendTestBtn)}
            </button>
          </div>
        </form>
      </section>

      {/* Server / SMTP Logs Card */}
      <section className="mail-tester-card">
        <h2 className="mail-tester-card-title">{t(UI.serverLogsTitle)}</h2>

        {sendResult ? (
          <div>
            <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: sendResult.ok ? '#16a34a' : '#dc2626' }}>
              {sendResult.ok ? `✓ ${t(UI.sendSuccess)}` : `✕ ${t(UI.sendFailed)}`}
            </div>
            <pre className="mail-tester-log-box">
              {JSON.stringify(sendResult.data, null, 2)}
            </pre>
          </div>
        ) : (
          <p style={{ color: 'var(--theme-elevation-500, #888)', margin: 0, fontSize: '0.9rem' }}>
            {t(UI.noLogs)}
          </p>
        )}
      </section>
    </div>
  )
}

/**
 * Sidebar Navigation Link Component to be injected into Admin panel afterNavLinks.
 */
export function MailTesterNavLink() {
  const [tFn, setTFn] = useState(() => createSyncTranslator({}, 'uk'))

  useEffect(() => {
    const loc = (typeof document !== 'undefined' && document.documentElement.lang) || 'uk'
    getTranslator(loc.slice(0, 2)).then((translator) => {
      setTFn(() => translator)
    })
  }, [])

  return (
    <Link href="/admin/mail-tester" className="mail-tester-nav-link">
      <span>✉️</span>
      <span>{tFn(UI.navLabel)}</span>
    </Link>
  )
}

export default MailTesterView
