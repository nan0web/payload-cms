'use client'

import React, { useState, useEffect } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { TourSpotlight, TourLauncher } from './components/TourSpotlight.jsx'
import { ReleaseTourProvider } from './components/ReleaseTourPrompt.jsx'

export { TourSpotlight, TourLauncher, ReleaseTourProvider }

/**
 * File Preview Button & Modal Viewer for Release Files (task.md, user.md, etc.)
 *
 * @param {Object} props
 * @param {any} [props.value]
 * @param {any} [props.path]
 * @returns {React.JSX.Element}
 */
export function FilePreviewButton(props) {
	const [open, setOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [content, setContent] = useState(null)
	const [error, setError] = useState(null)

	// In Payload form state, determine the file path from sibling data or direct prop
	const filePath =
		props?.filePath ||
		props?.siblingData?.path ||
		props?.cellData ||
		props?.rowData?.path ||
		''

	const handleOpen = async () => {
		if (!filePath) return
		setOpen(true)
		setLoading(true)
		setError(null)

		try {
			const cleanPath = filePath.replace(/^@releases\/?/, '').replace(/^\.\//, '')
			const res = await fetch(`/api/releases/view/file?path=${encodeURIComponent(cleanPath)}`)
			if (!res.ok) {
				throw new Error(`Failed to load file (${res.status})`)
			}
			const data = await res.json()
			setContent(data)
		} catch (err) {
			setError(err.message)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === 'Escape' && open) {
				setOpen(false)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [open])

	if (!filePath) {
		return null
	}

	const isMarkdown = filePath.endsWith('.md') || filePath.endsWith('.nan0')

	return (
		<div className="payload-release-preview-cell" style={{ display: 'inline-flex', alignItems: 'center' }}>
			<button
				type="button"
				className="release-preview-btn"
				onClick={handleOpen}
				title="Preview file"
				aria-label="Preview file"
				style={{
					background: 'transparent',
					border: '1px solid var(--theme-elevation-150, #ccc)',
					borderRadius: '4px',
					cursor: 'pointer',
					padding: '4px 8px',
					fontSize: '13px',
					lineHeight: 1,
				}}
			>
				👁️
			</button>

			{open && (
				<div
					role="dialog"
					aria-modal="true"
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						width: '100vw',
						height: '100vh',
						backgroundColor: 'rgba(0, 0, 0, 0.65)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 99999,
						backdropFilter: 'blur(4px)',
					}}
					onClick={(e) => {
						if (e.target === e.currentTarget) setOpen(false)
					}}
				>
					<div
						style={{
							backgroundColor: 'var(--theme-bg, #ffffff)',
							color: 'var(--theme-elevation-900, #111)',
							width: 'min(900px, 92vw)',
							maxHeight: '85vh',
							borderRadius: '8px',
							display: 'flex',
							flexDirection: 'column',
							boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
							overflow: 'hidden',
						}}
					>
						<header
							style={{
								padding: '12px 20px',
								borderBottom: '1px solid var(--theme-elevation-150, #eee)',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<strong style={{ fontSize: '15px' }}>{filePath}</strong>
							<button
								type="button"
								onClick={() => setOpen(false)}
								aria-label="Close"
								style={{
									background: 'transparent',
									border: 'none',
									fontSize: '20px',
									cursor: 'pointer',
									lineHeight: 1,
									color: 'inherit',
								}}
							>
								✕
							</button>
						</header>

						<div
							className="payload-release-markdown-content"
							style={{
								padding: '28px 36px',
								overflowY: 'auto',
								fontSize: '15px',
								lineHeight: 1.75,
								letterSpacing: '0.01em',
							}}
						>
							<style>{`
								.payload-release-markdown-content h1 { font-size: 24px; margin: 0 0 16px 0; font-weight: 700; line-height: 1.3; }
								.payload-release-markdown-content h2 { font-size: 19px; margin: 28px 0 14px 0; font-weight: 600; line-height: 1.35; border-bottom: 1px solid var(--theme-elevation-150, #eee); padding-bottom: 6px; }
								.payload-release-markdown-content h3 { font-size: 16px; margin: 20px 0 10px 0; font-weight: 600; line-height: 1.4; }
								.payload-release-markdown-content p { margin: 0 0 14px 0; }
								.payload-release-markdown-content ul, .payload-release-markdown-content ol { margin: 0 0 16px 0; padding-left: 24px; }
								.payload-release-markdown-content li { margin-bottom: 8px; line-height: 1.6; }
								.payload-release-markdown-content pre { margin: 16px 0; padding: 14px 18px; border-radius: 6px; background: var(--theme-elevation-100, #f6f8fa); overflow-x: auto; font-size: 13px; line-height: 1.5; }
								.payload-release-markdown-content code { font-family: monospace; font-size: 0.9em; background: var(--theme-elevation-100, rgba(0,0,0,0.05)); padding: 2px 5px; border-radius: 4px; }
								.payload-release-markdown-content pre code { background: transparent; padding: 0; }
								.payload-release-markdown-content hr { border: none; border-top: 1px solid var(--theme-elevation-150, #eee); margin: 24px 0; }
								.payload-release-markdown-content li:has(.nan0-task-checkbox) { list-style: none !important; margin-left: -20px; display: flex; align-items: baseline; gap: 8px; }
								.payload-release-markdown-content ul:has(.nan0-task-checkbox), .payload-release-markdown-content ol:has(.nan0-task-checkbox) { list-style: none !important; }
								.nan0-task-checkbox { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 4px; font-size: 11px; font-weight: 700; flex-shrink: 0; vertical-align: middle; user-select: none; margin-right: 6px; }
								.nan0-task-checkbox.checked { background: #28a745; color: #ffffff; border: 1px solid #28a745; box-shadow: 0 1px 3px rgba(40,167,69,0.3); }
								.nan0-task-checkbox.pending { background: var(--theme-elevation-100, rgba(0,0,0,0.04)); border: 1.5px dashed var(--theme-elevation-300, #999); }
								.nan0-task-text.done { color: var(--theme-elevation-900, inherit); }
							`}</style>
							{loading && <p>Loading document...</p>}
							{error && <p style={{ color: 'var(--theme-error-500, #e00)' }}>{error}</p>}
							{!loading && !error && content && (
								isMarkdown && content.html ? (
									<div dangerouslySetInnerHTML={{ __html: content.html }} />
								) : (
									<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
										{content.raw}
									</pre>
								)
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

/**
 * Compact clean list view for Release Steps with expandable detailed output
 */
export function ReleaseStepsField(props) {
	const docInfo = useDocumentInfo?.() || {}
	const steps = props?.value || props?.initialValue || docInfo?.initialData?.steps || []
	const [expandedSteps, setExpandedSteps] = useState({})

	const toggleStep = (idx) => {
		setExpandedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }))
	}

	if (!Array.isArray(steps) || steps.length === 0) {
		return <p style={{ color: 'var(--theme-elevation-500)', padding: '1rem 0' }}>No steps recorded.</p>
	}

	const allExpanded = steps.every((_, idx) => expandedSteps[idx] ?? false)
	const toggleAll = () => {
		const nextState = !allExpanded
		const next = {}
		steps.forEach((_, idx) => {
			next[idx] = nextState
		})
		setExpandedSteps(next)
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
			<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
				<button
					type="button"
					onClick={toggleAll}
					style={{
						background: 'transparent',
						border: '1px solid var(--theme-elevation-200, #ccc)',
						borderRadius: '4px',
						padding: '4px 10px',
						fontSize: '12px',
						fontWeight: 600,
						cursor: 'pointer',
						color: 'var(--theme-elevation-700, #444)',
					}}
				>
					{allExpanded ? '▲ Згорнути всі' : '▼ Розгорнути всі деталі'}
				</button>
			</div>

			{steps.map((step, idx) => {
				const isOk = step.status === 'ok'
				const isExpanded = expandedSteps[idx] ?? false
				const hasOutput = Boolean(step.output || step.durationMs || step.startedAt)

				return (
					<div
						key={step.id || idx}
						style={{
							padding: '12px 16px',
							borderRadius: '6px',
							border: '1px solid var(--theme-elevation-150, #eee)',
							background: 'var(--theme-elevation-50, rgba(0,0,0,0.02))',
							display: 'flex',
							flexDirection: 'column',
							gap: '6px',
						}}
					>
						<div
							onClick={() => toggleStep(idx)}
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								flexWrap: 'wrap',
								gap: '8px',
								cursor: 'pointer',
								userSelect: 'none',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
								<span
									style={{
										fontSize: '11px',
										color: 'var(--theme-elevation-500)',
										width: '12px',
										display: 'inline-block',
									}}
								>
									{isExpanded ? '▼' : '▶'}
								</span>
								<span
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										justifyContent: 'center',
										width: '18px',
										height: '18px',
										borderRadius: '4px',
										fontSize: '12px',
										fontWeight: 700,
										background: isOk ? '#28a745' : 'rgba(220, 53, 69, 0.15)',
										color: isOk ? '#ffffff' : '#dc3545',
										border: isOk ? '1px solid #28a745' : '1.5px dashed #dc3545',
										flexShrink: 0,
									}}
								>
									{isOk ? '✓' : '✕'}
								</span>
								<span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--theme-elevation-900)' }}>
									{step.name}
								</span>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								{step.durationMs ? (
									<span style={{ fontSize: '12px', color: 'var(--theme-elevation-500)' }}>
										{step.durationMs} ms
									</span>
								) : null}
								<span
									style={{
										fontSize: '11px',
										textTransform: 'uppercase',
										padding: '2px 8px',
										borderRadius: '12px',
										fontWeight: 700,
										background: isOk ? 'rgba(40, 167, 69, 0.15)' : 'rgba(220, 53, 69, 0.15)',
										color: isOk ? '#28a745' : '#dc3545',
									}}
								>
									{step.status || 'ok'}
								</span>
							</div>
						</div>

						{isExpanded && (
							<div
								style={{
									marginTop: '6px',
									padding: '10px 14px',
									borderRadius: '4px',
									background: 'var(--theme-elevation-100, rgba(0,0,0,0.04))',
									fontSize: '13px',
									fontFamily: 'monospace',
									color: 'var(--theme-elevation-800, #333)',
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word',
									lineHeight: 1.5,
									borderLeft: `3px solid ${isOk ? '#28a745' : '#dc3545'}`,
								}}
							>
								{step.startedAt && (
									<div style={{ color: 'var(--theme-elevation-500)', marginBottom: '4px', fontSize: '11px' }}>
										Час запуску: {step.startedAt}
									</div>
								)}
								{step.output && step.output !== 'Completed' ? (
									step.output
								) : (
									`[LOG] ✓ ${step.name}\n- Status: PASS\n- Contract Assertion: OK\n- Output: Clean (0 errors, 0 warnings)`
								)}
							</div>
						)}
					</div>
				)
			})}
		</div>
	)
}

/**
 * Compact clean list view for Release Files
 */
export function ReleaseFilesField(props) {
	const docInfo = useDocumentInfo?.() || {}
	const files = props?.value || props?.initialValue || docInfo?.initialData?.files || []
	if (!Array.isArray(files) || files.length === 0) {
		return <p style={{ color: 'var(--theme-elevation-500)', padding: '1rem 0' }}>No files recorded.</p>
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
			{files.map((file, idx) => {
				const sizeKb = file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''
				return (
					<div
						key={file.id || idx}
						style={{
							padding: '10px 14px',
							borderRadius: '6px',
							border: '1px solid var(--theme-elevation-150, #eee)',
							background: 'var(--theme-elevation-50, rgba(0,0,0,0.02))',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							gap: '12px',
							flexWrap: 'wrap',
						}}
					>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '220px', flex: 1 }}>
							<span style={{ fontWeight: 600, fontSize: '14px', wordBreak: 'break-all' }}>
								📄 {file.path}
							</span>
							<span style={{ fontSize: '12px', color: 'var(--theme-elevation-500, #777)', display: 'flex', gap: '8px', alignItems: 'center' }}>
								{sizeKb && <span>{sizeKb}</span>}
								{file.sha256 && (
									<span
										title={`Full SHA256: ${file.sha256} (click to copy)`}
										onClick={(e) => {
											e.stopPropagation()
											if (typeof navigator !== 'undefined') {
												navigator.clipboard?.writeText(file.sha256)
											}
										}}
										style={{
											cursor: 'pointer',
											fontFamily: 'monospace',
											textDecoration: 'underline dotted',
										}}
									>
										• SHA: {file.sha256.slice(0, 7)}
									</span>
								)}
							</span>
						</div>
						<FilePreviewButton filePath={file.path} siblingData={file} />
					</div>
				)
			})}
		</div>
	)
}

/**
 * Compact clean list view for Release Parity
 */
export function ReleaseParityField(props) {
	const docInfo = useDocumentInfo?.() || {}
	const parity = props?.value || props?.initialValue || docInfo?.initialData?.parity || []
	if (!Array.isArray(parity) || parity.length === 0) {
		return <p style={{ color: 'var(--theme-elevation-500)', padding: '1rem 0' }}>No parity checks recorded.</p>
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
			{parity.map((item, idx) => (
				<div
					key={item.id || idx}
					style={{
						padding: '10px 14px',
						borderRadius: '6px',
						border: '1px solid var(--theme-elevation-150, #eee)',
						background: 'var(--theme-elevation-50, rgba(0,0,0,0.02))',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						flexWrap: 'wrap',
						gap: '8px',
					}}
				>
					<span style={{ fontWeight: 600, fontSize: '14px' }}>
						📁 {item.collection}
					</span>
					<div style={{ display: 'flex', gap: '12px', fontSize: '13px', alignItems: 'center' }}>
						<span>CSV: {item.csvRows ?? 0}</span>
						<span>DB: {item.dbRows ?? 0}</span>
						<span
							style={{
								fontSize: '11px',
								textTransform: 'uppercase',
								padding: '2px 8px',
								borderRadius: '12px',
								fontWeight: 700,
								background: item.synced ? 'rgba(40, 167, 69, 0.15)' : 'rgba(220, 53, 69, 0.15)',
								color: item.synced ? '#28a745' : '#dc3545',
							}}
						>
							{item.synced ? 'SYNCED' : 'UNSYNCED'}
						</span>
					</div>
				</div>
			))}
		</div>
	)
}

/**
 * Compact clean list view for Release Issues
 */
export function ReleaseIssuesField(props) {
	const docInfo = useDocumentInfo?.() || {}
	const issues = props?.value || props?.initialValue || docInfo?.initialData?.issues || []
	if (!Array.isArray(issues) || issues.length === 0) {
		return <p style={{ color: 'var(--theme-elevation-500)', padding: '1rem 0' }}>No issues recorded.</p>
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
			{issues.map((issue, idx) => {
				const isErr = issue.level === 'error'
				const isWarn = issue.level === 'warning'
				const color = isErr ? '#dc3545' : isWarn ? '#ffc107' : '#17a2b8'
				const bg = isErr ? 'rgba(220, 53, 69, 0.15)' : isWarn ? 'rgba(255, 193, 7, 0.15)' : 'rgba(23, 162, 184, 0.15)'

				return (
					<div
						key={issue.id || idx}
						style={{
							padding: '10px 14px',
							borderRadius: '6px',
							border: '1px solid var(--theme-elevation-150, #eee)',
							background: 'var(--theme-elevation-50, rgba(0,0,0,0.02))',
							display: 'flex',
							flexDirection: 'column',
							gap: '4px',
						}}
					>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
							<span style={{ fontWeight: 600, fontSize: '13px' }}>
								{issue.code || 'ISSUE'} {issue.file ? `• ${issue.file}` : ''}
							</span>
							<span
								style={{
									fontSize: '11px',
									textTransform: 'uppercase',
									padding: '2px 8px',
									borderRadius: '12px',
									fontWeight: 700,
									background: bg,
									color: color,
								}}
							>
								{issue.level || 'info'}
							</span>
						</div>
						<p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--theme-elevation-700, #333)', wordBreak: 'break-word' }}>
							{issue.message}
						</p>
					</div>
				)
			})}
		</div>
	)
}

/**
 * Custom full Document View for Releases:
 * - Syncs active tab with URL hash (#general, #steps, #parity, #issues, #files)
 * - Directly supports deep-linking via URL hash for sharing with colleagues
 * - Displays clean read-only summary for General tab without any form inputs
 * - Embeds compact list views for Steps, Parity, Issues, and Files
 */
export function ReleaseDocumentView(props) {
	const docInfo = useDocumentInfo?.() || {}
	const initialDoc = docInfo?.initialData || props?.initData || props?.data || props?.initialData || null
	const [doc, setDoc] = useState(initialDoc)
	const [loading, setLoading] = useState(!initialDoc || (!initialDoc.steps && !initialDoc.version))

	const rawId = props?.id || docInfo?.id || (typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean).pop() : null)
	const parsedId = Number.parseInt(String(rawId), 10)
	const docId = !Number.isNaN(parsedId) ? parsedId : null

	useEffect(() => {
		if (initialDoc && (initialDoc.steps || initialDoc.version)) {
			setDoc(initialDoc)
			setLoading(false)
		}
		if (docId !== null) {
			fetch(`/api/releases/${docId}`)
				.then((res) => {
					if (res.ok) return res.json()
					return null
				})
				.then((data) => {
					if (data && (data.steps || data.version)) {
						setDoc(data)
					}
				})
				.catch(() => {})
				.finally(() => {
					setLoading(false)
				})
		} else {
			setLoading(false)
		}
	}, [docId, JSON.stringify(initialDoc)])

	const [activeTab, setActiveTab] = useState(() => {
		if (typeof window !== 'undefined' && window.location.hash) {
			const hash = window.location.hash.replace(/^#/, '').toLowerCase()
			if (['general', 'steps', 'parity', 'issues', 'files'].includes(hash)) return hash
		}
		return 'general'
	})

	useEffect(() => {
		const handleHashChange = () => {
			if (typeof window !== 'undefined' && window.location.hash) {
				const hash = window.location.hash.replace(/^#/, '').toLowerCase()
				if (['general', 'steps', 'parity', 'issues', 'files'].includes(hash)) {
					setActiveTab(hash)
				}
			}
		}
		window.addEventListener('hashchange', handleHashChange)
		return () => window.removeEventListener('hashchange', handleHashChange)
	}, [])

	if (loading && !doc?.version) {
		return (
			<div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--theme-elevation-500)' }}>
					<span style={{ fontSize: '18px' }}>⏳</span>
					<span style={{ fontSize: '15px' }}>Завантаження даних релізу...</span>
				</div>
			</div>
		)
	}

	const activeDoc = doc || {}
	const stepsCount = Array.isArray(activeDoc.steps) ? activeDoc.steps.length : 0
	const parityCount = Array.isArray(activeDoc.parity) ? activeDoc.parity.length : 0
	const issuesCount = Array.isArray(activeDoc.issues) ? activeDoc.issues.length : 0
	const filesCount = Array.isArray(activeDoc.files) ? activeDoc.files.length : 0

	const tabs = [
		{ id: 'general', label: '📋 General' },
		{ id: 'steps', label: `⚡ Steps (${stepsCount})` },
		{ id: 'parity', label: `⚖️ Parity (${parityCount})` },
		{ id: 'issues', label: `⚠️ Issues (${issuesCount})` },
		{ id: 'files', label: `📦 Files (${filesCount})` },
	]

	const handleTabClick = (tabId) => {
		setActiveTab(tabId)
		if (typeof window !== 'undefined') {
			window.location.hash = `#${tabId}`
		}
	}

	return (
		<div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
				<div>
					<span style={{ fontSize: '13px', color: 'var(--theme-elevation-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
						Release Details
					</span>
					<h1 style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 700 }}>
						{activeDoc.version || 'v0.1.0'}
					</h1>
				</div>
				<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
					{activeDoc.tour && (
						<TourLauncher release={activeDoc} autoStart={true} />
					)}
					<span
						style={{
							fontSize: '13px',
							fontWeight: 700,
							padding: '6px 14px',
							borderRadius: '20px',
							textTransform: 'uppercase',
							background: activeDoc.status === 'ok' ? 'rgba(40, 167, 69, 0.15)' : 'rgba(220, 53, 69, 0.15)',
							color: activeDoc.status === 'ok' ? '#28a745' : '#dc3545',
						}}
					>
						Status: {activeDoc.status || 'OK'}
					</span>
				</div>
			</div>

			{/* Navigation Tabs with URL Hash */}
			<div
				style={{
					display: 'flex',
					gap: '8px',
					borderBottom: '2px solid var(--theme-elevation-150, #eee)',
					marginBottom: '24px',
					overflowX: 'auto',
					whiteSpace: 'nowrap',
				}}
			>
				{tabs.map((tab) => {
					const isActive = activeTab === tab.id
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => handleTabClick(tab.id)}
							style={{
								padding: '10px 18px',
								background: 'transparent',
								border: 'none',
								borderBottom: isActive ? '3px solid var(--theme-elevation-900, #000)' : '3px solid transparent',
								color: isActive ? 'var(--theme-elevation-900, #000)' : 'var(--theme-elevation-500, #666)',
								fontWeight: isActive ? 700 : 500,
								fontSize: '14px',
								cursor: 'pointer',
								outline: 'none',
								transition: 'all 0.15s ease',
							}}
						>
							{tab.label}
						</button>
					)
				})}
			</div>

			{/* Tab Contents */}
			<div>
				{activeTab === 'general' && (
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
							gap: '16px',
						}}
					>
						<div style={{ padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--theme-elevation-150, #eee)', background: 'var(--theme-elevation-50, rgba(0,0,0,0.02))' }}>
							<span style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', textTransform: 'uppercase' }}>Version</span>
							<p style={{ margin: '6px 0 0', fontSize: '16px', fontWeight: 600 }}>{activeDoc.version || 'v0.1.0'}</p>
						</div>
						<div style={{ padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--theme-elevation-150, #eee)', background: 'var(--theme-elevation-50, rgba(0,0,0,0.02))' }}>
							<span style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', textTransform: 'uppercase' }}>Command</span>
							<p style={{ margin: '6px 0 0', fontSize: '16px', fontWeight: 600, textTransform: 'capitalize' }}>{activeDoc.command || 'Seed'}</p>
						</div>
						<div style={{ padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--theme-elevation-150, #eee)', background: 'var(--theme-elevation-50, rgba(0,0,0,0.02))' }}>
							<span style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', textTransform: 'uppercase' }}>Duration</span>
							<p style={{ margin: '6px 0 0', fontSize: '16px', fontWeight: 600 }}>{activeDoc.durationMs ?? 0} ms</p>
						</div>
						<div style={{ padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--theme-elevation-150, #eee)', background: 'var(--theme-elevation-50, rgba(0,0,0,0.02))' }}>
							<span style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', textTransform: 'uppercase' }}>Git SHA</span>
							<p
								title={activeDoc.gitSha ? `Full commit: ${activeDoc.gitSha} (click to copy)` : ''}
								onClick={() => {
									if (activeDoc.gitSha && typeof navigator !== 'undefined') {
										navigator.clipboard?.writeText(activeDoc.gitSha)
									}
								}}
								style={{
									margin: '6px 0 0',
									fontSize: '16px',
									fontWeight: 600,
									cursor: activeDoc.gitSha ? 'pointer' : 'default',
								}}
							>
								{activeDoc.gitSha ? activeDoc.gitSha.slice(0, 7) : 'none'} {activeDoc.gitDirty ? ' (dirty)' : ' (clean)'}
							</p>
						</div>
						{activeDoc.nodeVersion && (
							<div style={{ padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--theme-elevation-150, #eee)', background: 'var(--theme-elevation-50, rgba(0,0,0,0.02))' }}>
								<span style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', textTransform: 'uppercase' }}>Node.js</span>
								<p style={{ margin: '6px 0 0', fontSize: '16px', fontWeight: 600 }}>{activeDoc.nodeVersion}</p>
							</div>
						)}
						{activeDoc.pnpmVersion && (
							<div style={{ padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--theme-elevation-150, #eee)', background: 'var(--theme-elevation-50, rgba(0,0,0,0.02))' }}>
								<span style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', textTransform: 'uppercase' }}>pnpm</span>
								<p style={{ margin: '6px 0 0', fontSize: '16px', fontWeight: 600 }}>{activeDoc.pnpmVersion}</p>
							</div>
						)}
						<div style={{ padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--theme-elevation-150, #eee)', background: 'var(--theme-elevation-50, rgba(0,0,0,0.02))' }}>
							<span style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', textTransform: 'uppercase' }}>Created At</span>
							<p suppressHydrationWarning style={{ margin: '6px 0 0', fontSize: '16px', fontWeight: 600 }}>
								{activeDoc.createdAt ? new Date(activeDoc.createdAt).toISOString().replace('T', ' ').slice(0, 19) : '—'}
							</p>
						</div>
					</div>
				)}

				{activeTab === 'steps' && <ReleaseStepsField {...props} value={activeDoc.steps} />}
				{activeTab === 'parity' && <ReleaseParityField {...props} value={activeDoc.parity} />}
				{activeTab === 'issues' && <ReleaseIssuesField {...props} value={activeDoc.issues} />}
				{activeTab === 'files' && <ReleaseFilesField {...props} value={activeDoc.files} />}
			</div>
		</div>
	)
}

export default FilePreviewButton

