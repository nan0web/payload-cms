/**
 * Inspects active plugins and system configuration from Payload config.
 *
 * @param {Object} [config={}] Payload configuration object
 * @returns {{ plugins: Array<{ id: string, name: string, title: string, version?: string, status: string, hasDocs: boolean, docsDir?: string, options?: any }> }}
 */
export function inspectPlugins(config = {}) {
	const pluginsMap = new Map()

	// 1. Check selfManual plugin registration in admin.custom
	const selfManualCustom = config.admin?.custom?.selfManual
	if (selfManualCustom?.enabled) {
		pluginsMap.set('self-manual', {
			id: 'self-manual',
			name: '@nan0web/payload-self-manual',
			title: 'Self Manual',
			version: selfManualCustom.version || '0.1.0',
			status: 'active',
			hasDocs: Boolean(selfManualCustom.docsDir),
			docsDir: selfManualCustom.docsDir || 'docs',
			options: {
				defaultLocale: selfManualCustom.defaultLocale,
				multiDocView: selfManualCustom.ui?.multiDocView,
				releaseNotifications: selfManualCustom.releaseNotifications,
			},
		})
	}

	// 2. Check registered doc sources in custom.selfManualDocs
	const customDocs = Array.isArray(config.custom?.selfManualDocs)
		? config.custom.selfManualDocs
		: []
	for (const docSource of customDocs) {
		if (!docSource) continue
		const id = docSource.id || docSource.source || 'custom-plugin'
		const name = docSource.source || docSource.id || id
		const existing = pluginsMap.get(id) || {}
		pluginsMap.set(id, {
			id,
			name,
			title: docSource.title || name,
			version: docSource.version || existing.version || '0.1.0',
			status: 'active',
			hasDocs: Boolean(docSource.docsDir),
			docsDir: docSource.docsDir,
			options: docSource.options || existing.options,
		})
	}

	// 3. Check admin.custom for registered plugin metadata
	const adminCustom = config.admin?.custom || {}
	if (
		adminCustom.browseByFolder?.enabled &&
		!pluginsMap.has('browse-by-folder')
	) {
		pluginsMap.set('browse-by-folder', {
			id: 'browse-by-folder',
			name: '@nan0web/payload-browse-by-folder',
			title: 'Browse by Folder',
			version: '0.1.0',
			status: 'active',
			hasDocs: true,
			docsDir: 'docs',
			options: adminCustom.browseByFolder,
		})
	}
	if (
		adminCustom.keyboardFocus?.enabled &&
		!pluginsMap.has('keyboard-accessibility')
	) {
		pluginsMap.set('keyboard-accessibility', {
			id: 'keyboard-accessibility',
			name: '@nan0web/payloadcms-keyboard-accessibility',
			title: 'Keyboard Accessibility',
			version: '0.1.0',
			status: 'active',
			hasDocs: true,
			docsDir: 'docs',
			options: adminCustom.keyboardFocus.options,
		})
	}
	if (
		adminCustom.signinThemeState?.enabled &&
		!pluginsMap.has('signin-theme-state')
	) {
		pluginsMap.set('signin-theme-state', {
			id: 'signin-theme-state',
			name: '@nan0web/payload-signin-theme-state',
			title: 'Signin Theme State',
			version: '0.1.0',
			status: 'active',
			hasDocs: true,
			docsDir: 'docs',
			options: adminCustom.signinThemeState,
		})
	}
	if (
		adminCustom.selfStorage?.enabled &&
		!pluginsMap.has('self-storage')
	) {
		pluginsMap.set('self-storage', {
			id: 'self-storage',
			name: adminCustom.selfStorage.name || '@nan0web/payload-self-storage',
			title: adminCustom.selfStorage.title || 'Self Storage',
			version: adminCustom.selfStorage.version || '0.2.0',
			status: adminCustom.selfStorage.status || 'active',
			hasDocs: Boolean(adminCustom.selfStorage.docsDir || adminCustom.selfStorage.hasDocs),
			docsDir: adminCustom.selfStorage.docsDir || 'docs',
			options: adminCustom.selfStorage.options,
		})
	}

	// Check collections for custom plugin registrations
	if (Array.isArray(config.collections)) {
		for (const col of config.collections) {
			if (
				col.admin?.custom?.browseByFolder?.enabled &&
				!pluginsMap.has('browse-by-folder')
			) {
				pluginsMap.set('browse-by-folder', {
					id: 'browse-by-folder',
					name: '@nan0web/payload-browse-by-folder',
					title: 'Browse by Folder',
					version: '0.1.0',
					status: 'active',
					hasDocs: true,
					docsDir: 'docs',
					options: col.admin.custom.browseByFolder,
				})
			}
		}
	}

	// 4. Check plugins array in config.plugins
	if (Array.isArray(config.plugins)) {
		for (let i = 0; i < config.plugins.length; i++) {
			const plugin = config.plugins[i]
			if (typeof plugin === 'function' && plugin.name) {
				const id = plugin.name
				if (!pluginsMap.has(id)) {
					pluginsMap.set(id, {
						id,
						name: plugin.name,
						title: plugin.name,
						status: 'active',
						hasDocs: false,
					})
				}
			}
		}
	}

	// Fallback if none detected but plugin is running
	if (pluginsMap.size === 0) {
		pluginsMap.set('self-manual', {
			id: 'self-manual',
			name: '@nan0web/payload-self-manual',
			title: 'Self Manual',
			version: '0.1.0',
			status: 'active',
			hasDocs: true,
			docsDir: 'docs',
		})
	}

	return {
		plugins: Array.from(pluginsMap.values()),
	}
}
