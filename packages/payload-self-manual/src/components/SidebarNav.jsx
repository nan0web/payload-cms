import React from 'react'

/**
 * Sidebar Navigation Component for SelfManual Modal
 *
 * @param {Object} props
 * @param {string} props.searchQuery
 * @param {Function} props.onSearchChange
 * @param {Array<any>} props.filteredDocuments
 * @param {string} props.activeSlug
 * @param {string} props.currentPathSlug
 * @param {string} props.currentLocale
 * @param {Function} props.onSelectSlug
 * @param {Function} props.t
 * @param {Object} props.UI
 * @returns {React.JSX.Element}
 */
export function SidebarNav({
	searchQuery,
	onSearchChange,
	filteredDocuments,
	activeSlug,
	currentPathSlug,
	currentLocale,
	onSelectSlug,
	t,
	UI,
}) {
	return (
		<aside className="self-manual-sidebar">
			<div className="self-manual-search-box">
				<input
					type="text"
					className="self-manual-search-input"
					placeholder={t(UI.searchPlaceholder)}
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
			</div>

			<nav style={{ flex: 1, overflowY: 'auto' }}>
				<div className="self-manual-nav-header">
					{t(UI.manualsHeader, { locale: currentLocale.toUpperCase() })}
				</div>
				<button
					type="button"
					className={`self-manual-nav-item self-manual-nav-item--system${activeSlug === '__system_plugins__' ? ' self-manual-nav-item--active' : ''}`}
					onClick={() => onSelectSlug('__system_plugins__')}
				>
					⚡ {t(UI.pluginsTab)}
				</button>
				{filteredDocuments.map((item) => {
					const isCurrentPage =
						!activeSlug &&
						(currentPathSlug === item.slug ||
							(currentPathSlug === 'dashboard' && item.slug === 'dashboard'))
					const isActive = activeSlug === item.slug || isCurrentPage
					return (
						<button
							key={item.slug}
							type="button"
							className={`self-manual-nav-item${isActive ? ' self-manual-nav-item--active' : ''}`}
							onClick={() => onSelectSlug(item.slug)}
						>
							{item.title || item.slug}
						</button>
					)
				})}
			</nav>
		</aside>
	)
}
