'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Interactive SVG Spotlight and Popover for Product Onboarding Tour.
 * Zero external dependencies. Uses CSS/SVG mask and Theme tokens.
 *
 * @param {Object} props
 * @param {import('../domain/TourStepModel.js').TourManifestModel} props.tour
 * @param {boolean} [props.isOpen]
 * @param {() => void} [props.onClose]
 * @param {(step: number) => void} [props.onStepChange]
 * @param {() => void} [props.onComplete]
 * @returns {React.JSX.Element|null}
 */
export function TourSpotlight({
	tour,
	isOpen = false,
	onClose,
	onStepChange,
	onComplete,
}) {
	const router = useRouter()
	const version = tour?.version || ''
	const storageStepKey = version ? `@nan0web/release.tour.step.${version}` : ''

	const [currentStepIndex, setCurrentStepIndex] = useState(() => {
		if (typeof window !== 'undefined' && storageStepKey) {
			const saved = localStorage.getItem(storageStepKey)
			if (saved) {
				const idx = Number.parseInt(saved, 10)
				if (!Number.isNaN(idx) && idx >= 0 && idx < (tour?.steps?.length || 0)) {
					return idx
				}
			}
		}
		return 0
	})
	const [targetRect, setTargetRect] = useState(null)
	const [isWaiting, setIsWaiting] = useState(false)

	const steps = tour?.steps || []
	const currentStep = steps[currentStepIndex] || null

	// Persist active step in localStorage
	useEffect(() => {
		if (isOpen && storageStepKey) {
			try {
				localStorage.setItem(storageStepKey, String(currentStepIndex))
			} catch {}
		}
	}, [isOpen, currentStepIndex, storageStepKey])

	const isUkrainian = typeof document !== 'undefined'
		? (document.documentElement?.lang?.startsWith('uk') || (typeof navigator !== 'undefined' && navigator.language?.startsWith('uk')))
		: false

	// Locate element on screen and handle waitFor / dynamic elements
	const updateTargetPosition = useCallback(() => {
		if (!currentStep?.target) {
			setTargetRect(null)
			return
		}

		// If current step specifies tab or route hash, or target selector belongs to files/steps tab
		if (typeof window !== 'undefined') {
			if (currentStep.route && currentStep.route.includes('#')) {
				const expectedHash = currentStep.route.split('#')[1]
				if (window.location.hash !== `#${expectedHash}`) {
					window.location.hash = `#${expectedHash}`
				}
			} else if (
				(currentStep.target.includes('release-preview') ||
				 currentStep.target.includes('Preview') ||
				 currentStep.target.includes('Перегляд') ||
				 currentStep.target.includes('payload-release-preview-cell')) &&
				window.location.hash !== '#files'
			) {
				// Automatically switch to #files tab if target element is a file preview button!
				window.location.hash = '#files'
			}
		}

		const el = document.querySelector(currentStep.target)
		if (el) {
			const rect = el.getBoundingClientRect()
			setTargetRect({
				top: rect.top,
				left: rect.left,
				width: rect.width,
				height: rect.height,
				bottom: rect.bottom,
				right: rect.right,
			})
			setIsWaiting(false)
		} else {
			setTargetRect(null)
			setIsWaiting(true)
		}
	}, [currentStep])

	// Listen for route changes or target DOM appearance
	useEffect(() => {
		if (!isOpen || !currentStep) return

		updateTargetPosition()

		const interval = setInterval(updateTargetPosition, 400)
		window.addEventListener('resize', updateTargetPosition)
		window.addEventListener('scroll', updateTargetPosition, true)

		return () => {
			clearInterval(interval)
			window.removeEventListener('resize', updateTargetPosition)
			window.removeEventListener('scroll', updateTargetPosition, true)
		}
	}, [isOpen, currentStep, updateTargetPosition])

	// Handle interactive click actions
	useEffect(() => {
		if (!isOpen || !currentStep || currentStep.action !== 'click') return

		const el = document.querySelector(currentStep.target)
		if (!el) return

		const handleClick = () => {
			setTimeout(() => {
				handleNext()
			}, 300)
		}

		el.addEventListener('click', handleClick)
		return () => el.removeEventListener('click', handleClick)
	}, [isOpen, currentStep, currentStepIndex])

	if (!isOpen || !currentStep) return null

	const navigateToStepRoute = (stepObj) => {
		if (typeof window === 'undefined' || !stepObj?.route) return
		const currentPath = window.location.pathname
		const targetRoute = stepObj.route.replace(/\/$/, '')

		// If current URL does not match target route, navigate via SPA Next.js router
		if (currentPath !== targetRoute && currentPath !== `${targetRoute}/`) {
			// If step has a target selector on current page that is a link to the route, click it
			const linkEl = document.querySelector(`a[href*="${targetRoute}"]`)
			if (linkEl && typeof linkEl.click === 'function') {
				linkEl.click()
				return
			}
			if (router && typeof router.push === 'function') {
				router.push(targetRoute)
			} else {
				window.location.assign(targetRoute)
			}
		}
	}

	const handleNext = () => {
		// If current step has action: click, try clicking the target element to trigger its native SPA action
		if (currentStep?.action === 'click' && currentStep?.target) {
			const targetEl = document.querySelector(currentStep.target)
			if (targetEl && typeof targetEl.click === 'function') {
				targetEl.click()
			}
		}

		if (currentStepIndex + 1 < steps.length) {
			const nextIdx = currentStepIndex + 1
			const nextStepObj = steps[nextIdx]
			setCurrentStepIndex(nextIdx)
			onStepChange?.(nextIdx + 1)
			if (nextStepObj?.route) {
				navigateToStepRoute(nextStepObj)
			}
		} else {
			if (storageStepKey && typeof window !== 'undefined') {
				try { localStorage.removeItem(storageStepKey) } catch {}
			}
			onComplete?.()
			onClose?.()
		}
	}

	const handleClose = () => {
		if (storageStepKey && typeof window !== 'undefined') {
			try { localStorage.removeItem(storageStepKey) } catch {}
		}
		onClose?.()
	}

	const handlePrev = () => {
		if (currentStepIndex > 0) {
			const prevIdx = currentStepIndex - 1
			const prevStepObj = steps[prevIdx]
			setCurrentStepIndex(prevIdx)
			onStepChange?.(prevIdx + 1)
			if (prevStepObj?.route) {
				navigateToStepRoute(prevStepObj)
			}
		}
	}

	// Calculate popover positioning relative to targetRect
	let popoverTop = 100
	let popoverLeft = 100

	if (targetRect) {
		const pos = currentStep.position || 'bottom'
		if (pos === 'bottom') {
			popoverTop = Math.min(window.innerHeight - 250, targetRect.bottom + 16)
			popoverLeft = Math.max(20, Math.min(window.innerWidth - 380, targetRect.left))
		} else if (pos === 'top') {
			popoverTop = Math.max(20, targetRect.top - 200)
			popoverLeft = Math.max(20, Math.min(window.innerWidth - 380, targetRect.left))
		} else if (pos === 'right') {
			popoverTop = Math.max(20, Math.min(window.innerHeight - 250, targetRect.top))
			popoverLeft = Math.min(window.innerWidth - 380, targetRect.right + 16)
		} else if (pos === 'left') {
			popoverTop = Math.max(20, Math.min(window.innerHeight - 250, targetRect.top))
			popoverLeft = Math.max(20, targetRect.left - 360)
		}
	} else {
		popoverTop = window.innerHeight / 2 - 100
		popoverLeft = window.innerWidth / 2 - 170
	}

	return (
		<div
			className="nan0-tour-overlay"
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 99999,
				pointerEvents: 'none',
			}}
		>
			{/* SVG Mask Cutout - pointer-events auto only on dark mask, cutout is transparent */}
			<svg
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					pointerEvents: 'auto',
				}}
			>
				<defs>
					<mask id="nan0-tour-mask">
						<rect x="0" y="0" width="100%" height="100%" fill="white" />
						{targetRect && (
							<rect
								x={Math.max(0, targetRect.left - 6)}
								y={Math.max(0, targetRect.top - 6)}
								width={targetRect.width + 12}
								height={targetRect.height + 12}
								rx="8"
								fill="black"
							/>
						)}
					</mask>
				</defs>
				<rect
					x="0"
					y="0"
					width="100%"
					height="100%"
					fill="rgba(0, 0, 0, 0.65)"
					mask="url(#nan0-tour-mask)"
				/>
				{targetRect && (
					<rect
						x={Math.max(0, targetRect.left - 6)}
						y={Math.max(0, targetRect.top - 6)}
						width={targetRect.width + 12}
						height={targetRect.height + 12}
						rx="8"
						fill="none"
						stroke="#0066cc"
						strokeWidth="2"
						strokeDasharray="4 2"
					/>
				)}
			</svg>

			{/* Tour Popover Card */}
			<div
				className="nan0-tour-popover"
				style={{
					position: 'absolute',
					top: `${popoverTop}px`,
					left: `${popoverLeft}px`,
					width: '340px',
					backgroundColor: 'var(--theme-elevation-0, #ffffff)',
					color: 'var(--theme-elevation-900, #111111)',
					border: '1px solid var(--theme-elevation-200, #e1e4e8)',
					borderRadius: '12px',
					boxShadow: '0 16px 36px rgba(0, 0, 0, 0.22)',
					padding: '20px',
					zIndex: 100000,
					pointerEvents: 'auto',
					transition: 'top 0.2s ease, left 0.2s ease',
				}}
			>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
					<span
						style={{
							fontSize: '11px',
							fontWeight: 700,
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
							color: '#0066cc',
						}}
					>
						{isUkrainian
							? `Крок ${currentStepIndex + 1} з ${steps.length}`
							: `Step ${currentStepIndex + 1} of ${steps.length}`}
					</span>
					<button
						type="button"
						onClick={handleClose}
						style={{
							background: 'none',
							border: 'none',
							fontSize: '16px',
							cursor: 'pointer',
							color: 'var(--theme-elevation-500, #888)',
							lineHeight: 1,
						}}
					>
						✕
					</button>
				</div>

				<h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>
					{currentStep.title}
				</h3>

				<p style={{ margin: '0 0 16px', fontSize: '13px', lineHeight: 1.5, color: 'var(--theme-elevation-700, #444)' }}>
					{currentStep.content}
				</p>

				{isWaiting && (
					<div style={{ fontSize: '12px', color: '#e67e22', marginBottom: '12px' }}>
						{isUkrainian ? '⏳ Очікуємо переходу або появи елемента...' : '⏳ Waiting for action or element to appear...'}
					</div>
				)}

				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--theme-elevation-150, #eee)' }}>
					<button
						type="button"
						disabled={currentStepIndex === 0}
						onClick={handlePrev}
						style={{
							padding: '6px 12px',
							fontSize: '12px',
							borderRadius: '6px',
							border: '1px solid var(--theme-elevation-200, #ccc)',
							background: 'none',
							cursor: currentStepIndex === 0 ? 'default' : 'pointer',
							opacity: currentStepIndex === 0 ? 0.4 : 1,
						}}
					>
						{isUkrainian ? 'Назад' : 'Back'}
					</button>

					<div style={{ display: 'flex', gap: '8px' }}>
						<button
							type="button"
							onClick={handleClose}
							style={{
								padding: '6px 12px',
								fontSize: '12px',
								borderRadius: '6px',
								border: 'none',
								background: 'none',
								color: 'var(--theme-elevation-600, #666)',
								cursor: 'pointer',
							}}
						>
							{isUkrainian ? 'Пропустити' : 'Skip'}
						</button>

						<button
							type="button"
							onClick={handleNext}
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
							{currentStepIndex + 1 === steps.length
								? (isUkrainian ? 'Завершити' : 'Finish')
								: (isUkrainian ? 'Далі' : 'Next')}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

/**
 * Button to launch a product tour for a release.
 *
 * @param {Object} props
 * @param {any} props.release
 * @param {string} [props.label]
 * @returns {React.JSX.Element|null}
 */
export function TourLauncher({ release, label, autoStart = false }) {
	const [activeTour, setActiveTour] = useState(null)
	const [isOpen, setIsOpen] = useState(false)

	const detectLocale = () => {
		// 1. Explicit locale from user account preferences / props
		if (release?.userLocale) return release.userLocale

		if (typeof window !== 'undefined') {
			// Check Payload admin user preferences or window state
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

		// 2. HTML lang tag set by Payload admin layout
		if (typeof document !== 'undefined') {
			const htmlLang = document.documentElement?.lang
			if (htmlLang && htmlLang.startsWith('uk')) return 'uk'
			if (htmlLang && htmlLang.startsWith('en')) return 'en'
		}

		// 3. Fallback to browser navigator
		if (typeof navigator !== 'undefined') {
			const navLang = navigator.language || ''
			if (navLang.startsWith('uk')) return 'uk'
		}

		return 'en'
	}

	const locale = detectLocale()
	const defaultLabel = locale === 'uk' ? '✨ Запустити тур' : '✨ Start Tour'
	const buttonLabel = label || defaultLabel

	const startTour = async () => {
		try {
			const version = release?.version || 'v0.2.0'
			const res = await fetch(`/api/releases/${encodeURIComponent(version)}/tour?locale=${locale}`)
			if (res.ok) {
				const data = await res.json()
				if (data.tour) {
					setActiveTour(data.tour)
					setIsOpen(true)
					return
				}
			}
		} catch {}

		if (release?.tour) {
			setActiveTour(release.tour)
			setIsOpen(true)
		}
	}

	// Auto-start tour on first visit if requested and not completed
	useEffect(() => {
		if (!autoStart || !release?.version) return
		try {
			const saved = localStorage.getItem('@nan0web/release.tour')
			const isCompleted = saved === `${release.version}#complete`
			if (!isCompleted) {
				startTour()
			}
		} catch {}
	}, [autoStart, release?.version])

	return (
		<>
			<button
				type="button"
				onClick={startTour}
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: '6px',
					padding: '6px 12px',
					fontSize: '12px',
					fontWeight: 600,
					borderRadius: '6px',
					border: '1px solid #0066cc',
					background: 'rgba(0, 102, 204, 0.08)',
					color: '#0066cc',
					cursor: 'pointer',
				}}
			>
				{buttonLabel}
			</button>

			{isOpen && activeTour && (
				<TourSpotlight
					tour={activeTour}
					isOpen={isOpen}
					onClose={() => setIsOpen(false)}
					onComplete={() => {
						try {
							localStorage.setItem(
								'@nan0web/release.tour',
								`${activeTour.version}#complete`
							)
						} catch {}
						setIsOpen(false)
					}}
				/>
			)}
		</>
	)
}
