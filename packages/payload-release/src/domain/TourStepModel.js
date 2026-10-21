import { Model } from '@nan0web/types'

/**
 * Validates individual step within a product tour.
 */
export class TourStepModel extends Model {
	static step = {
		type: 'number',
		required: true,
		validate: (v) => (typeof v === 'number' && v > 0) || 'step must be a positive integer',
	}

	static route = {
		type: 'string',
		required: true,
		validate: (v) => (typeof v === 'string' && v.startsWith('/')) || 'route must start with /',
	}

	static target = {
		type: 'string',
		required: true,
		validate: (v) => (typeof v === 'string' && v.trim().length > 0) || 'target CSS selector required',
	}

	static title = {
		type: 'string',
		required: true,
	}

	static content = {
		type: 'string',
		required: true,
	}

	static position = {
		type: 'string',
		default: 'bottom',
		validate: (v) => ['top', 'bottom', 'left', 'right'].includes(v) || 'invalid position',
	}

	static action = {
		type: 'string',
		default: 'next',
		validate: (v) => ['next', 'click', 'select', 'fill'].includes(v) || 'invalid action',
	}

	static value = {
		type: 'string',
	}

	static waitFor = {
		type: 'string',
	}

	/**
	 * @param {Partial<TourStepModel>} [data]
	 * @param {import('@nan0web/types').ModelOptions} [options]
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {number} */ this.step
		/** @type {string} */ this.route
		/** @type {string} */ this.target
		/** @type {string} */ this.title
		/** @type {string} */ this.content
		/** @type {string} */ this.position
		/** @type {string} */ this.action
		/** @type {string} */ this.value
		/** @type {string} */ this.waitFor
	}
}

/**
 * Validates complete tour manifest for a release.
 */
export class TourManifestModel extends Model {
	static version = {
		type: 'string',
		required: true,
	}

	static title = {
		type: 'string',
		required: true,
	}

	static steps = {
		type: 'array',
		model: TourStepModel,
		required: true,
	}

	/**
	 * @param {Partial<TourManifestModel>} [data]
	 * @param {import('@nan0web/types').ModelOptions} [options]
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string} */ this.version
		/** @type {string} */ this.title
		/** @type {Array<TourStepModel>} */ this.steps
	}
}

/**
 * Lightweight native parser for tour.nan0 YAML/Key-Value structure.
 * Zero external dependencies.
 *
 * @param {string} raw
 * @returns {TourManifestModel}
 */
export function parseTourNan0(raw) {
	const lines = String(raw || '').split('\n')
	let version = ''
	let title = ''
	const steps = []
	let currentStep = null

	for (let line of lines) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue

		// Root properties
		if (!line.startsWith(' ') && !line.startsWith('\t')) {
			const rootMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*:\s*(.*)$/)
			if (rootMatch) {
				const key = rootMatch[1]
				let val = rootMatch[2].trim()
				val = val.replace(/^["'](.*)["']$/, '$1')
				if (key === 'version') version = val
				if (key === 'title') title = val
			}
			continue
		}

		// Step array entry start: "- step: 1" or "-"
		if (trimmed.startsWith('-')) {
			if (currentStep) {
				steps.push(new TourStepModel(currentStep))
			}
			currentStep = {}
			const rest = trimmed.replace(/^-\s*/, '')
			if (rest) {
				const stepPropMatch = rest.match(/^([a-zA-Z0-9_]+)\s*:\s*(.*)$/)
				if (stepPropMatch) {
					const k = stepPropMatch[1]
					let v = stepPropMatch[2].trim().replace(/^["'](.*)["']$/, '$1')
					if (k === 'step') v = Number(v)
					currentStep[k] = v
				}
			}
			continue
		}

		// Inside current step
		if (currentStep) {
			const propMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*:\s*(.*)$/)
			if (propMatch) {
				const k = propMatch[1]
				let v = propMatch[2].trim().replace(/^["'](.*)["']$/, '$1')
				if (k === 'step') v = Number(v)
				currentStep[k] = v
			}
		}
	}

	if (currentStep) {
		steps.push(new TourStepModel(currentStep))
	}

	return new TourManifestModel({
		version,
		title,
		steps,
	})
}

/**
 * Overlays localized titles and contents on top of base tour steps.
 *
 * @param {TourManifestModel} baseTour
 * @param {TourManifestModel|null} localizedTour
 * @returns {TourManifestModel}
 */
export function mergeTourWithLocale(baseTour, localizedTour) {
	if (!baseTour) return localizedTour
	if (!localizedTour) return baseTour

	const localizedStepMap = new Map()
	for (const s of localizedTour.steps || []) {
		if (s.step) localizedStepMap.set(s.step, s)
	}

	const mergedSteps = (baseTour.steps || []).map((step) => {
		const loc = localizedStepMap.get(step.step)
		if (!loc) return step
		return new TourStepModel({
			...step,
			title: loc.title || step.title,
			content: loc.content || step.content,
		})
	})

	return new TourManifestModel({
		...baseTour,
		title: localizedTour.title || baseTour.title,
		steps: mergedSteps,
	})
}
