import React from 'react'

/**
 * Header Help Button Component
 *
 * @param {Object} props
 * @param {Function} props.onToggle
 * @param {Function} props.t
 * @param {Object} props.UI
 * @returns {React.JSX.Element}
 */
export function HelpButton({ onToggle, t, UI }) {
	return (
		<button
			type="button"
			className="self-manual-btn-help"
			aria-label={t(UI.helpButtonAria)}
			title={t(UI.helpButtonTitle)}
			onClick={onToggle}
		>
			?
		</button>
	)
}
