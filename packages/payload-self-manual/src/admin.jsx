'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { getTranslator, createSyncTranslator } from './i18n.js'
import { SelfManualConfigModel } from './SelfManualConfigModel.js'
import { HelpButton } from './components/HelpButton.jsx'
import { SidebarNav } from './components/SidebarNav.jsx'
import { PluginsTableView } from './components/PluginsTableView.jsx'
import { DocArticleView } from './components/DocArticleView.jsx'
import './admin.css'

const { UI } = SelfManualConfigModel

/**
 * SelfManual Help Modal & Action Component for Payload CMS Admin.
 *
 * @param {Object} props
 * @param {string} [props.docsDir='docs']
 * @param {string} [props.defaultLocale='uk']
 * @param {string[]} [props.availableLocales=[]]
 * @param {Object} [props.ui={}]
 * @param {Record<string, Record<string, string>>} [props.translations={}]
 * @returns {React.JSX.Element}
 */
export function SelfManualHelp({
	docsDir = 'docs',
	defaultLocale = 'uk',
	availableLocales = [],
	ui = {},
	translations = {},
}) {
	const [open, setOpen] = useState(false)
	const [documentList, setDocumentList] = useState([])
	const [activeSlug, setActiveSlug] = useState('')
	const [activeDocument, setActiveDocument] = useState(null)
	const [activeTab, setActiveTab] = useState('all')
	const [loading, setLoading] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')

	const multiDocView = ui?.multiDocView || 'tabs'
	const [currentLocale, setCurrentLocale] = useState(defaultLocale.slice(0, 2))
	const [tFn, setTFn] = useState(() =>
		createSyncTranslator({}, defaultLocale, translations)
	)

	useEffect(() => {
		const getLocale = () => {
			const payloadLocale =
				window?.payload?.locale || window?.__PAYLOAD_LOCALE__
			if (payloadLocale) return payloadLocale.slice(0, 2)
			const docLang = document.documentElement.lang
			if (docLang) return docLang.slice(0, 2)
			return defaultLocale.slice(0, 2)
		}
		setCurrentLocale(getLocale())
	}, [defaultLocale])

	useEffect(() => {
		let isMounted = true
		getTranslator(currentLocale, translations).then((translator) => {
			if (isMounted) setTFn(() => translator)
		})
		return () => {
			isMounted = false
		}
	}, [currentLocale, translations])

	const t = tFn

	const currentPathSlug = useMemo(() => {
		if (typeof window === 'undefined') return 'dashboard'
		const parts = window.location.pathname.split('/').filter(Boolean)
		if (
			parts.length === 0 ||
			(parts.length === 1 && parts[0] === 'admin') ||
			parts[parts.length - 1] === 'dashboard'
		) {
			return 'dashboard'
		}
		if (parts.includes('collections') && parts.length >= 2) {
			return `collections/${parts[parts.length - 1]}`
		}
		return parts.slice(-2).join('/') || 'dashboard'
	}, [])

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === 'Escape' && open) {
				event.preventDefault()
				setOpen(false)
				return
			}
			if ((event.metaKey || event.ctrlKey) && event.key === '/') {
				event.preventDefault()
				setOpen((prev) => !prev)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [open])

	useEffect(() => {
		if (!open) return
		setLoading(true)
		const targetSlug = activeSlug || currentPathSlug
		const query = new URLSearchParams({
			locale: currentLocale,
			slug: targetSlug,
		})

		fetch(`/api/_self-manual?${query}`)
			.then(async (res) => (res.ok ? res.json() : { found: false, index: [] }))
			.then((data) => {
				if (Array.isArray(data.index)) setDocumentList(data.index)
				setActiveDocument(data)
				setActiveTab('all')
			})
			.catch(() => setActiveDocument({ found: false }))
			.finally(() => setLoading(false))
	}, [open, activeSlug, currentLocale, currentPathSlug])

	const filteredDocuments = useMemo(() => {
		if (!searchQuery.trim()) return documentList
		const q = searchQuery.toLowerCase()
		return documentList.filter(
			(doc) =>
				doc.title?.toLowerCase().includes(q) ||
				doc.slug?.toLowerCase().includes(q) ||
				doc.searchText?.includes(q)
		)
	}, [documentList, searchQuery])

	const handleContentClick = (event) => {
		const anchor = event.target.closest('a')
		if (!anchor) return
		const href = anchor.getAttribute('href')
		if (href && href.startsWith('#doc:')) {
			event.preventDefault()
			setActiveSlug(href.replace('#doc:', ''))
		} else if (
			href &&
			(href.startsWith('http://') || href.startsWith('https://'))
		) {
			anchor.setAttribute('target', '_blank')
			anchor.setAttribute('rel', 'noopener noreferrer')
		}
	}

	return (
		<>
			<HelpButton onToggle={() => setOpen((prev) => !prev)} t={t} UI={UI} />

			{open && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label={t(UI.dialogAria)}
					className="self-manual-overlay"
					onClick={(e) => {
						if (e.target === e.currentTarget) setOpen(false)
					}}
				>
					<div className="self-manual-modal">
						<SidebarNav
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							filteredDocuments={filteredDocuments}
							activeSlug={activeSlug}
							currentPathSlug={currentPathSlug}
							currentLocale={currentLocale}
							onSelectSlug={setActiveSlug}
							t={t}
							UI={UI}
						/>

						<main onClick={handleContentClick} className="self-manual-content">
							<button
								type="button"
								aria-label={t(UI.closeAria)}
								className="self-manual-btn-close"
								onClick={() => setOpen(false)}
							>
								×
							</button>

							{loading && <p className="self-manual-loading">{t(UI.loading)}</p>}

							{!loading && activeSlug === '__system_plugins__' && (
								<PluginsTableView
									plugins={activeDocument?.system?.plugins || []}
									t={t}
									UI={UI}
								/>
							)}

							{!loading && activeSlug !== '__system_plugins__' && (
								<DocArticleView
									activeDocument={activeDocument}
									activeTab={activeTab}
									onSelectTab={setActiveTab}
									multiDocView={multiDocView}
									t={t}
									UI={UI}
								/>
							)}
						</main>
					</div>
				</div>
			)}
		</>
	)
}
