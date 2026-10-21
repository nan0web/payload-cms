'use client'

import React, { useState, useEffect } from 'react'
import { TourSpotlight } from './TourSpotlight.jsx'

/**
 * Global Release Tour Provider & Floater/Modal for Payload CMS Admin.
 * Runs on any admin route via config.admin.components.providers.
 * Detects unseen releases (multi-version support) and displays an unobtrusive
 * announcement card / modal dialog with options to take the tour.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {React.JSX.Element}
 */
export function ReleaseTourProvider({ children }) {
	const [unseenReleases, setUnseenReleases] = useState([])
	const [selectedRelease, setSelectedRelease] = useState(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [isBannerDismissed, setIsBannerDismissed] = useState(false)
	const [activeTour, setActiveTour] = useState(null)
	const [isTourRunning, setIsTourRunning] = useState(false)

	const detectLocale = () => {
		if (typeof window !== 'undefined') {
			const payloadUserLang =
				window?.__payload?.user?.language ||
				window?.__PAYLOAD_USER__?.language ||
				localStorage.getItem('@payload-language') ||
				localStorage.getItem('i18nextLng')
			if (payloadUserLang) {
				if (payloadUserLang.startsWith('uk')) return 'uk'
				if (payloadUserLang.startsWith('en')) return 'en'
			}
		}
		if (typeof document !== 'undefined') {
			const htmlLang = document.documentElement?.lang
			if (htmlLang && htmlLang.startsWith('uk')) return 'uk'
			if (htmlLang && htmlLang.startsWith('en')) return 'en'
		}
		if (typeof navigator !== 'undefined') {
			const navLang = navigator.language || ''
			if (navLang.startsWith('uk')) return 'uk'
		}
		return 'en'
	}

	const isUk = detectLocale() === 'uk'

	// Fetch releases and identify all unseen releases with a tour
	useEffect(() => {
		let isMounted = true
		const checkReleases = async () => {
			try {
				const res = await fetch('/api/releases?limit=50&sort=-createdAt')
				if (!res.ok) return
				const data = await res.json()
				const docs = data?.docs || []

				// Read completed tours from localStorage
				let completedList = []
				try {
					const raw = localStorage.getItem('@nan0web/release.tour.completed')
					if (raw) {
						completedList = JSON.parse(raw)
					} else {
						// Backward compatibility with single version key
						const single = localStorage.getItem('@nan0web/release.tour')
						if (single && single.includes('#complete')) {
							completedList = [single.split('#')[0]]
						}
					}
				} catch {}

				// Check dismissed session or permanent dismissed
				let dismissedMap = {}
				try {
					const rawDis = localStorage.getItem('@nan0web/release.tour.dismissed')
					if (rawDis) dismissedMap = JSON.parse(rawDis)
				} catch {}

				const unseen = docs.filter((r) => {
					if (!r.tour) return false
					const isCompleted = completedList.includes(r.version)
					const isDismissed = dismissedMap[r.version]
					return !isCompleted && !isDismissed
				})

				if (isMounted) {
					setUnseenReleases(unseen)
					if (unseen.length > 0) {
						setSelectedRelease(unseen[0])
					}

					// Restore in-progress tour if page was navigated/reloaded during tour
					try {
						const activeVer = localStorage.getItem('@nan0web/release.tour.active')
						if (activeVer) {
							const targetDoc = docs.find((d) => d.version === activeVer)
							if (targetDoc?.tour) {
								const loc = detectLocale()
								fetch(`/api/releases/${encodeURIComponent(targetDoc.version)}/tour?locale=${loc}`)
									.then((r) => (r.ok ? r.json() : null))
									.then((data) => {
										if (data?.tour && isMounted) {
											setActiveTour(data.tour)
											setIsTourRunning(true)
										} else if (targetDoc.tour && isMounted) {
											setActiveTour(targetDoc.tour)
											setIsTourRunning(true)
										}
									})
									.catch(() => {})
							}
						}
					} catch {}
				}
			} catch {}
		}

		checkReleases()
		return () => {
			isMounted = false
		}
	}, [])

	const handleDismissAll = () => {
		setIsBannerDismissed(true)
		setIsModalOpen(false)
		try {
			const dismissedMap = {}
			for (const r of unseenReleases) {
				dismissedMap[r.version] = true
			}
			localStorage.setItem('@nan0web/release.tour.dismissed', JSON.stringify(dismissedMap))
		} catch {}
	}

	const startTourForRelease = async (release) => {
		try {
			localStorage.setItem('@nan0web/release.tour.active', release.version)
		} catch {}

		try {
			const loc = detectLocale()
			const res = await fetch(`/api/releases/${encodeURIComponent(release.version)}/tour?locale=${loc}`)
			if (res.ok) {
				const data = await res.json()
				if (data.tour) {
					setActiveTour(data.tour)
					setIsTourRunning(true)
					setIsModalOpen(false)
					setIsBannerDismissed(true)
					return
				}
			}
		} catch {}

		if (release.tour) {
			setActiveTour(release.tour)
			setIsTourRunning(true)
			setIsModalOpen(false)
			setIsBannerDismissed(true)
		}
	}

	const handleTourClose = () => {
		try {
			localStorage.removeItem('@nan0web/release.tour.active')
		} catch {}
		setIsTourRunning(false)
		setActiveTour(null)
	}

	const handleTourComplete = (version) => {
		try {
			localStorage.removeItem('@nan0web/release.tour.active')
			let completedList = []
			try {
				const raw = localStorage.getItem('@nan0web/release.tour.completed')
				if (raw) completedList = JSON.parse(raw)
			} catch {}

			if (!completedList.includes(version)) {
				completedList.push(version)
				localStorage.setItem('@nan0web/release.tour.completed', JSON.stringify(completedList))
			}
			localStorage.setItem('@nan0web/release.tour', `${version}#complete`)
		} catch {}

		setIsTourRunning(false)
		setActiveTour(null)
		// Remove completed from unseen list
		setUnseenReleases((prev) => prev.filter((r) => r.version !== version))
	}

	const hasUnseen = unseenReleases.length > 0 && !isBannerDismissed

	return (
		<>
			{children}

			{/* Floating Prompt Banner (Bottom-Right) */}
			{hasUnseen && !isModalOpen && !isTourRunning && (
				<div
					style={{
						position: 'fixed',
						bottom: '24px',
						right: '24px',
						zIndex: 99990,
						backgroundColor: 'var(--theme-elevation-0, #ffffff)',
						color: 'var(--theme-elevation-900, #111111)',
						border: '1px solid var(--theme-elevation-200, #e1e4e8)',
						borderRadius: '12px',
						boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
						padding: '16px 20px',
						maxWidth: '380px',
						display: 'flex',
						flexDirection: 'column',
						gap: '12px',
						animation: 'nan0FadeIn 0.3s ease',
					}}
				>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<span style={{ fontSize: '20px' }}>🚀</span>
							<div>
								<h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
									{isUk ? 'Нове оновлення системи!' : 'New system update available!'}
								</h4>
								<span style={{ fontSize: '12px', color: 'var(--theme-elevation-500, #666)' }}>
									{unseenReleases.length === 1
										? `${unseenReleases[0].version}`
										: (isUk ? `Доступно ${unseenReleases.length} нових релізи` : `${unseenReleases.length} new releases available`)}
								</span>
							</div>
						</div>
						<button
							type="button"
							onClick={handleDismissAll}
							aria-label="Close"
							style={{
								background: 'none',
								border: 'none',
								fontSize: '16px',
								cursor: 'pointer',
								color: 'var(--theme-elevation-500, #888)',
								padding: '2px',
							}}
						>
							✕
						</button>
					</div>

					<p style={{ margin: 0, fontSize: '13px', lineHeight: 1.45, color: 'var(--theme-elevation-700, #444)' }}>
						{unseenReleases.length === 1
							? (isUk ? `Ознайомтеся з новими функціями та змінами у версії ${unseenReleases[0].version}.` : `Explore new features and changes in ${unseenReleases[0].version}.`)
							: (isUk ? 'З моменту вашого останнього візиту вийшло кілька релізів. Перегляньте ключові оновлення.' : 'Multiple releases were published since your last visit. Explore what changed.')}
					</p>

					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
						{unseenReleases.length > 1 ? (
							<button
								type="button"
								onClick={() => setIsModalOpen(true)}
								style={{
									padding: '6px 14px',
									fontSize: '12px',
									fontWeight: 600,
									borderRadius: '6px',
									border: 'none',
									background: '#0066cc',
									color: '#fff',
									cursor: 'pointer',
								}}
							>
								{isUk ? '📋 Список оновлень' : '📋 Review Updates'}
							</button>
						) : (
							<button
								type="button"
								onClick={() => startTourForRelease(unseenReleases[0])}
								style={{
									padding: '6px 14px',
									fontSize: '12px',
									fontWeight: 600,
									borderRadius: '6px',
									border: 'none',
									background: '#0066cc',
									color: '#fff',
									cursor: 'pointer',
								}}
							>
								{isUk ? '✨ Пройти тур' : '✨ Start Tour'}
							</button>
						)}
					</div>
				</div>
			)}

			{/* Modal Dialog: Multi-Release Overview (Option A) */}
			{isModalOpen && (
				<div
					role="dialog"
					aria-modal="true"
					style={{
						position: 'fixed',
						inset: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.65)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 99995,
						backdropFilter: 'blur(3px)',
					}}
					onClick={(e) => {
						if (e.target === e.currentTarget) setIsModalOpen(false)
					}}
				>
					<div
						style={{
							backgroundColor: 'var(--theme-elevation-0, #ffffff)',
							color: 'var(--theme-elevation-900, #111111)',
							width: 'min(640px, 92vw)',
							maxHeight: '85vh',
							borderRadius: '12px',
							display: 'flex',
							flexDirection: 'column',
							boxShadow: '0 24px 48px rgba(0, 0, 0, 0.28)',
							overflow: 'hidden',
						}}
					>
						<header
							style={{
								padding: '16px 24px',
								borderBottom: '1px solid var(--theme-elevation-150, #eee)',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
								<span style={{ fontSize: '22px' }}>🚀</span>
								<div>
									<h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
										{isUk ? 'Що нового з моменту вашого останнього візиту?' : 'What’s new since your last visit?'}
									</h3>
									<span style={{ fontSize: '12px', color: 'var(--theme-elevation-500, #666)' }}>
										{isUk ? `Доступно ${unseenReleases.length} пропущених оновлень` : `${unseenReleases.length} updates available`}
									</span>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setIsModalOpen(false)}
								aria-label="Close"
								style={{
									background: 'none',
									border: 'none',
									fontSize: '18px',
									cursor: 'pointer',
									color: 'inherit',
								}}
							>
								✕
							</button>
						</header>

						<div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
							{unseenReleases.map((release) => (
								<div
									key={release.version}
									style={{
										padding: '14px 18px',
										borderRadius: '8px',
										border: '1px solid var(--theme-elevation-150, #eee)',
										background: 'var(--theme-elevation-50, rgba(0,0,0,0.02))',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										gap: '16px',
										flexWrap: 'wrap',
									}}
								>
									<div style={{ flex: 1, minWidth: '200px' }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
											<strong style={{ fontSize: '15px' }}>{release.version}</strong>
											{release.tour?.title && (
												<span style={{ fontSize: '13px', color: 'var(--theme-elevation-700, #555)' }}>
													— {release.tour.title}
												</span>
											)}
										</div>
										<p style={{ margin: 0, fontSize: '12px', color: 'var(--theme-elevation-500, #777)' }}>
											{isUk
												? `Інтерактивний тур з ${release.tour?.steps?.length || 0} кроків`
												: `Interactive tour with ${release.tour?.steps?.length || 0} steps`}
										</p>
									</div>

									<button
										type="button"
										onClick={() => startTourForRelease(release)}
										style={{
											padding: '6px 14px',
											fontSize: '12px',
											fontWeight: 600,
											borderRadius: '6px',
											border: '1px solid #0066cc',
											background: 'rgba(0, 102, 204, 0.08)',
											color: '#0066cc',
											cursor: 'pointer',
										}}
									>
										{isUk ? '▶ Запустити тур' : '▶ Start Tour'}
									</button>
								</div>
							))}
						</div>

						<footer
							style={{
								padding: '14px 24px',
								borderTop: '1px solid var(--theme-elevation-150, #eee)',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<button
								type="button"
								onClick={handleDismissAll}
								style={{
									background: 'none',
									border: 'none',
									fontSize: '13px',
									color: 'var(--theme-elevation-500, #666)',
									cursor: 'pointer',
								}}
							>
								{isUk ? 'Більше не нагадувати' : 'Don’t show again'}
							</button>

							<button
								type="button"
								onClick={() => setIsModalOpen(false)}
								style={{
									padding: '6px 16px',
									fontSize: '13px',
									fontWeight: 600,
									borderRadius: '6px',
									border: '1px solid var(--theme-elevation-200, #ccc)',
									background: 'none',
									cursor: 'pointer',
								}}
							>
								{isUk ? 'Закрити' : 'Close'}
							</button>
						</footer>
					</div>
				</div>
			)}

			{/* Active Spotlight Tour */}
			{isTourRunning && activeTour && (
				<TourSpotlight
					tour={activeTour}
					isOpen={isTourRunning}
					onClose={handleTourClose}
					onComplete={() => handleTourComplete(activeTour.version)}
				/>
			)}
		</>
	)
}
