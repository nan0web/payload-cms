'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { getTranslator, createSyncTranslator } from './i18n.js'
import { SelfManualConfigModel } from './SelfManualConfigModel.js'
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
	const [expandedPlugins, setExpandedPlugins] = useState({})

	const multiDocView = ui?.multiDocView || 'tabs'

	// Determine current locale - only on client side
	const [currentLocale, setCurrentLocale] = useState(defaultLocale.slice(0, 2))
	const [tFn, setTFn] = useState(() => createSyncTranslator({}, defaultLocale, translations))

	useEffect(() => {
		const getLocale = () => {
			const payloadLocale = window?.payload?.locale || window?.__PAYLOAD_LOCALE__
			if (payloadLocale) return payloadLocale.slice(0, 2)
			const docLang = document.documentElement.lang
			if (docLang) return docLang.slice(0, 2)
			return defaultLocale.slice(0, 2)
		}
		const loc = getLocale()
		setCurrentLocale(loc)
	}, [defaultLocale])

	// Lazy load vocabulary when locale or custom translations change
	useEffect(() => {
		let isMounted = true
		getTranslator(currentLocale, translations).then((translator) => {
			if (isMounted) {
				setTFn(() => translator)
			}
		})
		return () => {
			isMounted = false
		}
	}, [currentLocale, translations])

	const t = tFn

	// Current page slug fallback
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
				setActiveTab('all')
			})
			.catch(() => setActiveDocument({ found: false }))
			.finally(() => setLoading(false))
	}, [open, activeSlug, currentLocale, currentPathSlug])

	// Filter documents by search query
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
				className="self-manual-btn-help"
				aria-label={t(UI.helpButtonAria)}
				title={t(UI.helpButtonTitle)}
				onClick={() => setOpen((prev) => !prev)}
			>
				?
			</button>

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
						{/* Sidebar Navigation */}
						<aside className="self-manual-sidebar">
							<div className="self-manual-search-box">
								<input
									type="text"
									className="self-manual-search-input"
									placeholder={t(UI.searchPlaceholder)}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>

							<nav style={{ flex: 1, overflowY: 'auto' }}>
								<div className="self-manual-nav-header">
									{t(UI.manualsHeader, { locale: currentLocale.toUpperCase() })}
								</div>
								<button
									type="button"
									className={`self-manual-nav-item self-manual-nav-item--system${activeSlug === '__system_plugins__' ? ' self-manual-nav-item--active' : ''}`}
									onClick={() => setActiveSlug('__system_plugins__')}
								>
									⚡ {t(UI.pluginsTab)}
								</button>
								{filteredDocuments.map((item) => {
									const isCurrentPage = !activeSlug && (currentPathSlug === item.slug || (currentPathSlug === 'dashboard' && item.slug === 'dashboard'))
									const isActive = activeSlug === item.slug || isCurrentPage
									return (
										<button
											key={item.slug}
											type="button"
											className={`self-manual-nav-item${isActive ? ' self-manual-nav-item--active' : ''}`}
											onClick={() => setActiveSlug(item.slug)}
										>
											{item.title || item.slug}
										</button>
									)
								})}
							</nav>
						</aside>

						{/* Content Body */}
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
								<div className="self-manual-plugins-view">
									<h2 className="self-manual-plugins-title">{t(UI.pluginsHeader)}</h2>
									<div className="self-manual-plugins-table-container">
										<table className="self-manual-plugins-table">
											<thead>
												<tr>
													<th>{t(UI.pluginName)}</th>
													<th>{t(UI.pluginVersion)}</th>
													<th>{t(UI.pluginStatus)}</th>
													<th>{t(UI.pluginDocs)}</th>
													<th></th>
												</tr>
											</thead>
											<tbody>
												{(activeDocument?.system?.plugins || []).map((plugin) => {
													const hasOptions = plugin.options && Object.keys(plugin.options).length > 0
													const isExpanded = expandedPlugins[plugin.id]
													return (
														<React.Fragment key={plugin.id}>
															<tr className="self-manual-plugin-row">
																<td>
																	<div className="self-manual-plugin-title-cell">
																		<span className="self-manual-plugin-name">{plugin.title || plugin.name}</span>
																		<span className="self-manual-plugin-package">{plugin.name}</span>
																	</div>
																</td>
																<td>
																	{plugin.version ? (
																		<span className="self-manual-plugin-version">v{plugin.version}</span>
																	) : (
																		<span className="self-manual-plugin-version">—</span>
																	)}
																</td>
																<td>
																	<span className="self-manual-plugin-status-badge">
																		{t(UI.activeStatus)}
																	</span>
																</td>
																<td>
																	{plugin.hasDocs ? (
																		<span className="self-manual-docs-available">
																			✓ {t(UI.pluginDocsAvailable)}
																		</span>
																	) : (
																		<span className="self-manual-docs-missing">
																			— {t(UI.pluginDocsMissing)}
																		</span>
																	)}
																</td>
																<td style={{ textAlign: 'right' }}>
																	{hasOptions && (
																		<button
																			type="button"
																			className="self-manual-btn-config-toggle"
																			onClick={() =>
																				setExpandedPlugins((prev) => ({
																					...prev,
																					[plugin.id]: !prev[plugin.id],
																				}))
																			}
																		>
																			{isExpanded ? t(UI.hideConfig) : t(UI.viewConfig)}
																		</button>
																	)}
																</td>
															</tr>
															{hasOptions && isExpanded && (
																<tr className="self-manual-plugin-options-row">
																	<td colSpan={5}>
																		<pre className="self-manual-plugin-options">
																			<code>{JSON.stringify(plugin.options, null, 2)}</code>
																		</pre>
																	</td>
																</tr>
															)}
														</React.Fragment>
													)
												})}
											</tbody>
										</table>
									</div>
								</div>
							)}

							{!loading && activeSlug !== '__system_plugins__' && activeDocument && !activeDocument.found && (
								<article
									className="self-manual-article"
									style={{ lineHeight: 1.6, padding: '1.25rem 0' }}
									dangerouslySetInnerHTML={{ __html: activeDocument.html }}
								/>
							)}

							{!loading && activeSlug !== '__system_plugins__' && activeDocument?.found && (
								<>
									{Array.isArray(activeDocument.sections) &&
										activeDocument.sections.length > 1 &&
										multiDocView === 'tabs' && (
											<div className="self-manual-tabs">
												<button
													type="button"
													className={`self-manual-tab${activeTab === 'all' ? ' self-manual-tab--active' : ''}`}
													onClick={() => setActiveTab('all')}
												>
													{t(UI.tabAll)}
												</button>
												{activeDocument.sections.map((sec) => {
													const isSelected = activeTab === sec.id
													return (
														<button
															key={sec.id}
															type="button"
															className={`self-manual-tab${isSelected ? ' self-manual-tab--active' : ''}`}
															onClick={() => setActiveTab(sec.id)}
														>
															{sec.title || sec.source}
														</button>
													)
												})}
											</div>
										)}

									{Array.isArray(activeDocument.sections) && activeDocument.sections.length > 1 ? (
										multiDocView === 'tabs' && activeTab !== 'all' ? (
											// Single Tab View
											(() => {
												const sec =
													activeDocument.sections.find((s) => s.id === activeTab) ||
													activeDocument.sections[0]
												return (
													<article
														key={sec.id}
														className="self-manual-article"
														style={{ lineHeight: 1.6 }}
														dangerouslySetInnerHTML={{ __html: sec.html }}
													/>
												)
											})()
										) : (
											// All together (or Blocks mode)
											activeDocument.sections.map((sec) => (
												<div key={sec.id} className="self-manual-block-item">
													<div className="self-manual-source-badge">
														{t(UI.sourceLabel, { source: sec.source || sec.id })}
													</div>
													<article
														className="self-manual-article"
														style={{ lineHeight: 1.6 }}
														dangerouslySetInnerHTML={{ __html: sec.html }}
													/>
												</div>
											))
										)
									) : (
										// Default single doc
										<article
											className="self-manual-article"
											style={{ lineHeight: 1.6 }}
											dangerouslySetInnerHTML={{ __html: activeDocument.html }}
										/>
									)}
								</>
							)}
						</main>
					</div>
				</div>
			)}
		</>
	)
}

export default SelfManualHelp
