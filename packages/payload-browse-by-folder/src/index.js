/**
 * Default visible columns for Browse by Folder Admin View
 */
export const DEFAULT_FOLDER_COLUMNS = [
  { accessor: 'filename', label: 'Filename', active: true },
  { accessor: 'preview', label: 'Preview', active: true },
  { accessor: 'mimeType', label: 'MIME Type', active: true },
  { accessor: 'filesize', label: 'Size', active: true },
  { accessor: 'dimensions', label: 'Dimensions', active: true },
  { accessor: 'folder', label: 'Folder', active: true },
  { accessor: 'createdAt', label: 'Created At', active: false },
  { accessor: 'updatedAt', label: 'Updated At', active: true }
]

const FOLDER_NAV_PATH = '@nan0web/payload-browse-by-folder/admin#FolderNavigation'

/**
 * Configure the Browse by Folder Admin view.
 * @param {Object} options
 * @param {string[]} [options.collections=['media']] Targeted upload collections
 * @param {Array<{accessor: string, label?: string, active?: boolean}>} [options.columns] Custom column configuration
 * @param {Array<Object>} [options.additionalColumns] Collection-specific columns
 * @param {Object} [options.actions] Document and file URL actions
 */
export function payloadBrowseByFolder(options = {}) {
  const targetedCollections = options.collections || ['media']
  const columns = [...(options.columns || DEFAULT_FOLDER_COLUMNS), ...(options.additionalColumns || [])]
  const actions = {
    openDocument: true,
    copyFileUrl: true,
    openFileUrl: true,
    ...options.actions
  }

  return (config) => {
    if (!config.collections) return config

    return {
      ...config,
      collections: config.collections.map((collection) => {
      if (!targetedCollections.includes(collection.slug)) return collection

      return {
        ...collection,
        admin: {
          ...collection.admin,
          components: {
            ...collection.admin?.components,
            beforeListTable: [
              ...(collection.admin?.components?.beforeListTable
                ? (Array.isArray(collection.admin.components.beforeListTable)
                  ? collection.admin.components.beforeListTable
                  : [collection.admin.components.beforeListTable])
                : []),
              { path: FOLDER_NAV_PATH, clientProps: { columns, actions } }
            ],
          },
          custom: {
            ...collection.admin?.custom,
            browseByFolder: { enabled: true, columns, actions }
          }
        }
      }
      })
    }
  }
}

export { BrowseByFolderView } from './admin.js'
