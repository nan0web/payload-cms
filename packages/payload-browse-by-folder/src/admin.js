import React from 'react'

const element = React.createElement

function folderPath(folder, paths = new Map()) {
  if (!folder) return ''
  if (typeof folder === 'string') return folder
  if (paths.has(folder.id)) return paths.get(folder.id)
  const path = [folder.name, folder.parent && folderPath(folder.parent, paths)].filter(Boolean).reverse().join('/')
  if (folder.id) paths.set(folder.id, path)
  return path
}

/**
 * Adds folder-aware navigation before Payload's native list/grid view.
 * @param {Object} props Payload BeforeListTableClientProps
 */
export function FolderNavigation({ collectionSlug, data, searchParams = {} }) {
  const paths = new Map()
  const folders = [...new Set((data?.docs || []).map((document) => folderPath(document.folder, paths)).filter(Boolean))].sort()
  const currentFolder = searchParams.folder || ''
  const href = (folder) => {
    const params = new URLSearchParams(searchParams)
    if (folder) params.set('folder', folder)
    else params.delete('folder')
    return `/admin/collections/${collectionSlug}?${params}`
  }

  return element('nav', { className: 'browse-by-folder-navigation', 'aria-label': 'Folders' },
    element('strong', null, 'Folders: '),
    element('a', { href: href(''), 'aria-current': !currentFolder ? 'page' : undefined }, 'All'),
    ...folders.map((path) => element('a', { key: path, href: href(path), 'aria-current': currentFolder === path ? 'page' : undefined }, path))
  )
}

export { FolderNavigation as BrowseByFolderView }
