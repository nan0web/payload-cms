import { test } from 'node:test'
import assert from 'node:assert'
import { payloadBrowseByFolder, DEFAULT_FOLDER_COLUMNS } from '../src/index.js'
import { FolderNavigation } from '../src/admin.js'

test('payloadBrowseByFolder customizes targeted collection admin options', () => {
  const plugin = payloadBrowseByFolder({ collections: ['media'] })
  const mockConfig = {
    collections: [
      { slug: 'media', access: { read: () => true }, admin: {} },
      { slug: 'posts', admin: {} }
    ]
  }

  const result = plugin(mockConfig)
  const media = result.collections[0]

  assert.strictEqual(media.admin.custom.browseByFolder.enabled, true)
  assert.deepStrictEqual(media.admin.custom.browseByFolder.columns, DEFAULT_FOLDER_COLUMNS)
  assert.strictEqual(media.admin.custom.browseByFolder.actions.openDocument, true)
  assert.equal(media.admin.components.beforeListTable.at(-1).path, '@nan0web/payload-browse-by-folder/admin#FolderNavigation')
  assert.equal(media.access.read(), true)
  assert.strictEqual(result.collections[1].admin.custom, undefined)
})

test('payloadBrowseByFolder preserves admin configuration and supports custom columns and actions', () => {
  const existing = { components: { views: { edit: 'ExistingEdit' }, beforeListTable: ['ExistingFolderControl'] }, custom: { feature: true } }
  const result = payloadBrowseByFolder({
    collections: ['assets'],
    columns: [{ accessor: 'filename', label: 'Name', active: true }],
    additionalColumns: [{ accessor: 'checksum', label: 'Checksum', active: false }],
    actions: { openDocument: false }
  })({ collections: [{ slug: 'assets', admin: existing }] })
  const admin = result.collections[0].admin

  assert.equal(admin.components.views.edit, 'ExistingEdit')
  assert.equal(admin.components.beforeListTable[0], 'ExistingFolderControl')
  assert.equal(admin.custom.feature, true)
  assert.deepStrictEqual(admin.custom.browseByFolder.columns, [
    { accessor: 'filename', label: 'Name', active: true },
    { accessor: 'checksum', label: 'Checksum', active: false }
  ])
  assert.deepStrictEqual(admin.custom.browseByFolder.actions, {
    openDocument: false,
    copyFileUrl: true,
    openFileUrl: true
  })
})

test('payloadBrowseByFolder handles configs without collections', () => {
  assert.deepStrictEqual(payloadBrowseByFolder()({}), {})
})

test('FolderNavigation renders complete nested folder paths and preserves query parameters', () => {
  const view = FolderNavigation({
    collectionSlug: 'media',
    data: { docs: [{ folder: { name: 'Images', parent: { name: 'Projects' } } }] },
    searchParams: { search: 'photo' }
  })
  const output = JSON.stringify(view)

  assert.match(output, /Projects\/Images/)
  assert.match(output, /search=photo&folder=Projects%2FImages/)
})
