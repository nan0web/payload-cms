import { ReleaseConfigModel } from '../domain/ReleaseConfigModel.js'

/**
 * Creates dynamic tab label with count badge
 * @param {string} baseLabel
 * @param {string} arrayFieldName
 * @returns {import('payload').LabelFunction}
 */
function createTabBadgeLabel(baseLabel, arrayFieldName) {
	return ({ data }) => {
		const parts = arrayFieldName.split('.')
		let val = data
		for (const p of parts) {
			val = val?.[p]
		}
		if (Array.isArray(val) && val.length > 0) {
			return baseLabel.replace('{count}', String(val.length))
		}
		// Return clean label without ' (0)' placeholder if no items or data not loaded yet
		return baseLabel.replace(' ({count})', '').replace('{count}', '')
	}
}

/**
 * Builds the Payload CMS Collection configuration for Releases.
 *
 * @param {Object} [options]
 * @param {boolean} [options.allowPreview=true]
 * @returns {import('payload').CollectionConfig}
 */
export function buildReleasesCollection(options = {}) {
	const allowPreview = options.allowPreview !== false
	const fileEndpointHandler = options.fileEndpointHandler

	return {
		slug: 'releases',
		labels: {
			singular: ReleaseConfigModel.UI.singular,
			plural: ReleaseConfigModel.UI.plural,
		},
		endpoints: fileEndpointHandler
			? [
					{
						path: '/:id/file',
						method: 'get',
						handler: fileEndpointHandler,
					},
					{
						path: '/view/file',
						method: 'get',
						handler: fileEndpointHandler,
					},
				]
			: [],
		access: {
			read: () => true,
			create: () => false,
			update: () => false,
			delete: () => false,
		},
		admin: {
			useAsTitle: 'version',
			defaultColumns: ['version', 'command', 'status', 'durationMs', 'createdAt'],
			group: ReleaseConfigModel.UI.group,
			hideAPIURL: false,
			components: {
				beforeList: [],
				views: {
					edit: {
						default: {
							Component: '@nan0web/payload-release/admin#ReleaseDocumentView',
						},
					},
				},
			},
		},
		fields: [
			{
				type: 'tabs',
				tabs: [
					{
						label: ReleaseConfigModel.UI.tabGeneral,
						fields: [
							{
								type: 'row',
								fields: [
									{
										name: 'version',
										type: 'text',
										required: true,
										unique: true,
										index: true,
										admin: { width: '50%' },
									},
									{
										name: 'status',
										type: 'select',
										defaultValue: 'ok',
										options: [
											{ label: 'OK', value: 'ok' },
											{ label: 'Failed', value: 'failed' },
										],
										admin: { width: '50%' },
									},
								],
							},
							{
								type: 'row',
								fields: [
									{
										name: 'command',
										type: 'select',
										options: [
											{ label: 'Seed', value: 'seed' },
											{ label: 'Fresh', value: 'fresh' },
											{ label: 'Migrate', value: 'migrate' },
										],
										admin: { width: '50%' },
									},
									{
										name: 'durationMs',
										type: 'number',
										admin: { width: '50%' },
									},
								],
							},
							{
								type: 'row',
								fields: [
									{
										name: 'gitSha',
										type: 'text',
										admin: { width: '50%' },
									},
									{
										name: 'gitDirty',
										type: 'checkbox',
										admin: { width: '50%' },
									},
								],
							},
							{
								type: 'row',
								fields: [
									{
										name: 'nodeVersion',
										type: 'text',
										admin: { width: '50%' },
									},
									{
										name: 'pnpmVersion',
										type: 'text',
										admin: { width: '50%' },
									},
								],
							},
							{
								name: 'tour',
								type: 'group',
								fields: [
									{
										type: 'row',
										fields: [
											{ name: 'version', type: 'text', admin: { width: '40%' } },
											{ name: 'title', type: 'text', admin: { width: '60%' } },
										],
									},
									{
										name: 'steps',
										type: 'array',
										fields: [
											{
												type: 'row',
												fields: [
													{ name: 'step', type: 'number', admin: { width: '15%' } },
													{ name: 'route', type: 'text', admin: { width: '35%' } },
													{ name: 'action', type: 'text', admin: { width: '25%' } },
													{ name: 'position', type: 'text', admin: { width: '25%' } },
												],
											},
											{
												type: 'row',
												fields: [
													{ name: 'target', type: 'text', admin: { width: '50%' } },
													{ name: 'title', type: 'text', admin: { width: '50%' } },
												],
											},
											{
												name: 'content',
												type: 'textarea',
											},
										],
									},
								],
							},
						],
					},
					{
						label: createTabBadgeLabel(ReleaseConfigModel.UI.tabSteps, 'steps'),
						fields: [
							{
								name: 'steps',
								type: 'array',
								admin: {
									components: {
										Field: '@nan0web/payload-release/admin#ReleaseStepsField',
									},
								},
								fields: [
									{
										type: 'row',
										fields: [
											{ name: 'name', type: 'text', required: true, admin: { width: '40%' } },
											{
												name: 'status',
												type: 'select',
												defaultValue: 'ok',
												options: [
													{ label: 'OK', value: 'ok' },
													{ label: 'Error', value: 'error' },
												],
												admin: { width: '20%' },
											},
											{ name: 'startedAt', type: 'date', admin: { width: '20%' } },
											{ name: 'durationMs', type: 'number', admin: { width: '20%' } },
										],
									},
									{
										name: 'output',
										type: 'textarea',
										admin: { rows: 3 },
									},
								],
							},
						],
					},
					{
						label: createTabBadgeLabel(ReleaseConfigModel.UI.tabParity, 'parity'),
						fields: [
							{
								name: 'parity',
								type: 'array',
								admin: {
									components: {
										Field: '@nan0web/payload-release/admin#ReleaseParityField',
									},
								},
								fields: [
									{
										type: 'row',
										fields: [
											{ name: 'collection', type: 'text', required: true, admin: { width: '30%' } },
											{ name: 'csvRows', type: 'number', admin: { width: '25%' } },
											{ name: 'dbRows', type: 'number', admin: { width: '25%' } },
											{
												name: 'synced',
												type: 'checkbox',
												defaultValue: true,
												admin: { width: '20%' },
											},
										],
									},
								],
							},
						],
					},
					{
						label: createTabBadgeLabel(ReleaseConfigModel.UI.tabIssues, 'issues'),
						fields: [
							{
								name: 'issues',
								type: 'array',
								admin: {
									components: {
										Field: '@nan0web/payload-release/admin#ReleaseIssuesField',
									},
								},
								fields: [
									{
										type: 'row',
										fields: [
											{
												name: 'level',
												type: 'select',
												defaultValue: 'warning',
												options: [
													{ label: 'Info', value: 'info' },
													{ label: 'Warning', value: 'warning' },
													{ label: 'Error', value: 'error' },
												],
												admin: { width: '25%' },
											},
											{ name: 'code', type: 'text', admin: { width: '25%' } },
											{ name: 'source', type: 'text', admin: { width: '25%' } },
											{ name: 'file', type: 'text', admin: { width: '25%' } },
										],
									},
									{
										name: 'message',
										type: 'textarea',
										required: true,
									},
								],
							},
						],
					},
					{
						label: createTabBadgeLabel(ReleaseConfigModel.UI.tabFiles, 'files'),
						fields: [
							{
								name: 'files',
								type: 'array',
								admin: {
									components: {
										Field: '@nan0web/payload-release/admin#ReleaseFilesField',
									},
								},
								fields: [
									{
										type: 'row',
										fields: [
											{ name: 'path', type: 'text', required: true, admin: { width: '40%' } },
											{ name: 'size', type: 'number', admin: { width: '20%' } },
											{ name: 'sha256', type: 'text', admin: { width: '30%' } },
											...(allowPreview
												? [
														{
															name: 'preview',
															type: 'ui',
															admin: {
																width: '10%',
																components: {
																	Field: '@nan0web/payload-release/admin#FilePreviewButton',
																},
															},
														},
													]
												: []),
										],
									},
								],
							},
						],
					},
				],
			},
		],
	}
}

export const ReleasesCollection = buildReleasesCollection()
