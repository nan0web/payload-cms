import React, { useState } from 'react'

/**
 * Plugins Table View Component
 *
 * @param {Object} props
 * @param {Array<any>} props.plugins
 * @param {Function} props.t
 * @param {Object} props.UI
 * @returns {React.JSX.Element}
 */
export function PluginsTableView({ plugins = [], t, UI }) {
	const [expandedPlugins, setExpandedPlugins] = useState({})

	return (
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
						{plugins.map((plugin) => {
							const hasOptions =
								plugin.options && Object.keys(plugin.options).length > 0
							const isExpanded = expandedPlugins[plugin.id]
							return (
								<React.Fragment key={plugin.id}>
									<tr className="self-manual-plugin-row">
										<td>
											<div className="self-manual-plugin-title-cell">
												<span className="self-manual-plugin-name">
													{plugin.title || plugin.name}
												</span>
												<span className="self-manual-plugin-package">
													{plugin.name}
												</span>
											</div>
										</td>
										<td>
											{plugin.version ? (
												<span className="self-manual-plugin-version">
													v{plugin.version}
												</span>
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
													<code>
														{JSON.stringify(plugin.options, null, 2)}
													</code>
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
	)
}
