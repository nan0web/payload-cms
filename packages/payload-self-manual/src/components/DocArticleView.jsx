import React from 'react'

/**
 * Documentation Article View Component
 *
 * @param {Object} props
 * @param {any} props.activeDocument
 * @param {string} props.activeTab
 * @param {Function} props.onSelectTab
 * @param {string} props.multiDocView
 * @param {Function} props.t
 * @param {Object} props.UI
 * @returns {React.JSX.Element}
 */
export function DocArticleView({
	activeDocument,
	activeTab,
	onSelectTab,
	multiDocView = 'tabs',
	t,
	UI,
}) {
	if (!activeDocument) return null

	if (!activeDocument.found) {
		return (
			<article
				className="self-manual-article"
				style={{ lineHeight: 1.6, padding: '1.25rem 0' }}
				dangerouslySetInnerHTML={{ __html: activeDocument.html }}
			/>
		)
	}

	const hasMultipleSections =
		Array.isArray(activeDocument.sections) &&
		activeDocument.sections.length > 1

	return (
		<>
			{hasMultipleSections && multiDocView === 'tabs' && (
				<div className="self-manual-tabs">
					<button
						type="button"
						className={`self-manual-tab${activeTab === 'all' ? ' self-manual-tab--active' : ''}`}
						onClick={() => onSelectTab('all')}
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
								onClick={() => onSelectTab(sec.id)}
							>
								{sec.title || sec.source}
							</button>
						)
					})}
				</div>
			)}

			{hasMultipleSections ? (
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
	)
}
