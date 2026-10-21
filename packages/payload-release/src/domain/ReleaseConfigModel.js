import { Model } from '@nan0web/types'

/**
 * Configuration schema for @nan0web/payload-release plugin.
 * Implements Model-as-Schema pattern.
 */
export class ReleaseConfigModel extends Model {
	/**
	 * Path to releases directory relative to project root.
	 */
	static releasesDir = {
		type: 'string',
		default: 'releases',
		help: 'Path to releases directory relative to project root',
		validate: (v) =>
			(typeof v === 'string' && v.trim().length > 0) ||
			'releasesDir must be a non-empty string',
	}

	/**
	 * Whether Markdown file preview is enabled in Admin UI.
	 */
	static allowPreview = {
		type: 'boolean',
		default: true,
		help: 'Allow modal preview of release Markdown documents',
	}

	/**
	 * UI labels and translation tokens.
	 */
	static UI = {
		singular: 'Release',
		plural: 'Releases',
		group: 'System',
		tabGeneral: '📋 General',
		tabSteps: '⚡ Steps ({count})',
		tabParity: '⚖️ Parity ({count})',
		tabIssues: '⚠️ Issues ({count})',
		tabFiles: '📦 Files ({count})',
		tabTour: '✨ Tour ({count})',
		previewButton: 'Preview',
		modalClose: 'Close',
		launchTourButton: 'Start Tour',
		loading: 'Loading content...',
		errorNotFound: 'Document not found or inaccessible',
	}

	/**
	 * @param {Partial<ReleaseConfigModel>} [data]
	 * @param {import('@nan0web/types').ModelOptions} [options]
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string} */ this.releasesDir
		/** @type {boolean} */ this.allowPreview
	}
}
