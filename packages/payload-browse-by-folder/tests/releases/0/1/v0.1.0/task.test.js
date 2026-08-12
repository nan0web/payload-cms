import { describe, it } from 'node:test'
import assert from 'node:assert'
import { payloadBrowseByFolder, DEFAULT_FOLDER_COLUMNS } from '../../../../../src/index.js'
import { FolderNavigation } from '../../../../../src/admin.js'

describe('v0.1.0 — Browse by Folder plugin', () => {
  describe('Configurable Browse by folder Admin view for selected upload collections', () => {
    it('targets only specified collections, leaves others untouched', () => {
      const plugin = payloadBrowseByFolder({ collections: ['media'] })
      const config = {
        collections: [
          { slug: 'media', admin: {} },
          { slug: 'posts', admin: {} },
          { slug: 'images', admin: {} }
        ]
      }
      const result = plugin(config)
      assert.strictEqual(result.collections[0].admin.custom.browseByFolder.enabled, true)
      assert.strictEqual(result.collections[1].admin.custom, undefined)
      assert.strictEqual(result.collections[2].admin.custom, undefined)
    })

    it('defaults to ["media"] when no collections option provided', () => {
      const plugin = payloadBrowseByFolder()
      const config = { collections: [{ slug: 'media', admin: {} }, { slug: 'other', admin: {} }] }
      const result = plugin(config)
      assert.strictEqual(result.collections[0].admin.custom.browseByFolder.enabled, true)
      assert.strictEqual(result.collections[1].admin.custom, undefined)
    })

    it('returns config unchanged when no collections array exists', () => {
      const plugin = payloadBrowseByFolder()
      assert.deepStrictEqual(plugin({}), {})
      assert.deepStrictEqual(plugin({ foo: 'bar' }), { foo: 'bar' })
    })
  })

  describe('Configure visible columns per collection', () => {
    it('uses DEFAULT_FOLDER_COLUMNS when no custom columns provided', () => {
      const plugin = payloadBrowseByFolder({ collections: ['media'] })
      const result = plugin({ collections: [{ slug: 'media', admin: {} }] })
      assert.deepStrictEqual(
        result.collections[0].admin.custom.browseByFolder.columns,
        DEFAULT_FOLDER_COLUMNS
      )
    })

    it('replaces defaults with options.columns and appends additionalColumns', () => {
      const plugin = payloadBrowseByFolder({
        collections: ['assets'],
        columns: [{ accessor: 'filename', label: 'Name', active: true }],
        additionalColumns: [
          { accessor: 'checksum', label: 'Checksum', active: false },
          { accessor: 'uploadedBy', label: 'Uploaded By', active: false }
        ]
      })
      const result = plugin({ collections: [{ slug: 'assets', admin: {} }] })
      const columns = result.collections[0].admin.custom.browseByFolder.columns
      assert.strictEqual(columns.length, 3)
      assert.strictEqual(columns[0].accessor, 'filename')
      assert.strictEqual(columns[0].label, 'Name')
      assert.strictEqual(columns[1].accessor, 'checksum')
      assert.strictEqual(columns[2].accessor, 'uploadedBy')
    })

    it('preserves column active flag from configuration', () => {
      const columns = [
        { accessor: 'filename', label: 'Filename', active: true },
        { accessor: 'preview', label: 'Preview', active: false }
      ]
      const plugin = payloadBrowseByFolder({ collections: ['media'], columns })
      const result = plugin({ collections: [{ slug: 'media', admin: {} }] })
      const cfg = result.collections[0].admin.custom.browseByFolder.columns
      assert.strictEqual(cfg[0].active, true)
      assert.strictEqual(cfg[1].active, false)
    })

    it('injects beforeListTable component with columns and actions as clientProps', () => {
      const customCols = [{ accessor: 'custom', label: 'Custom', active: true }]
      const plugin = payloadBrowseByFolder({
        collections: ['media'],
        columns: customCols
      })
      const result = plugin({ collections: [{ slug: 'media', admin: {} }] })
      const navComponent = result.collections[0].admin.components.beforeListTable.at(-1)
      assert.strictEqual(navComponent.path, '@nan0web/payload-browse-by-folder/admin#FolderNavigation')
      assert.deepStrictEqual(navComponent.clientProps.columns, customCols)
    })
  })

  describe('Support configurable actions', () => {
    it('includes default actions: openDocument, copyFileUrl, openFileUrl', () => {
      const plugin = payloadBrowseByFolder({ collections: ['media'] })
      const result = plugin({ collections: [{ slug: 'media', admin: {} }] })
      const actions = result.collections[0].admin.custom.browseByFolder.actions
      assert.deepStrictEqual(actions, {
        openDocument: true,
        copyFileUrl: true,
        openFileUrl: true
      })
    })

    it('allows overriding individual actions via options.actions', () => {
      const plugin = payloadBrowseByFolder({
        collections: ['media'],
        actions: { openDocument: false, copyFileUrl: false }
      })
      const result = plugin({ collections: [{ slug: 'media', admin: {} }] })
      const actions = result.collections[0].admin.custom.browseByFolder.actions
      assert.strictEqual(actions.openDocument, false)
      assert.strictEqual(actions.copyFileUrl, false)
      assert.strictEqual(actions.openFileUrl, true)
    })

    it('spreads action overrides on top of defaults', () => {
      const plugin = payloadBrowseByFolder({
        collections: ['media'],
        actions: { openFileUrl: false }
      })
      const result = plugin({ collections: [{ slug: 'media', admin: {} }] })
      const actions = result.collections[0].admin.custom.browseByFolder.actions
      assert.strictEqual(actions.openDocument, true)
      assert.strictEqual(actions.copyFileUrl, true)
      assert.strictEqual(actions.openFileUrl, false)
    })
  })

  describe('Preserve Payload folder navigation, document links, access control, pagination, search/filter behavior', () => {
    it('preserves existing admin components (views, beforeListTable)', () => {
      const existing = {
        components: {
          views: { edit: 'MyEditView' },
          beforeListTable: ['ExistingControl']
        }
      }
      const result = payloadBrowseByFolder({ collections: ['media'] })(
        { collections: [{ slug: 'media', admin: existing }] }
      )
      const admin = result.collections[0].admin
      assert.strictEqual(admin.components.views.edit, 'MyEditView')
      assert.strictEqual(admin.components.beforeListTable[0], 'ExistingControl')
      assert.strictEqual(
        admin.components.beforeListTable[1].path,
        '@nan0web/payload-browse-by-folder/admin#FolderNavigation'
      )
    })

    it('handles single-element beforeListTable (non-array)', () => {
      const existing = {
        components: { beforeListTable: 'SingleControl' }
      }
      const result = payloadBrowseByFolder({ collections: ['media'] })(
        { collections: [{ slug: 'media', admin: existing }] }
      )
      const list = result.collections[0].admin.components.beforeListTable
      assert.strictEqual(list[0], 'SingleControl')
      assert.strictEqual(list[1].path, '@nan0web/payload-browse-by-folder/admin#FolderNavigation')
    })

    it('preserves existing admin.custom properties', () => {
      const existing = { custom: { featureFlag: true, theme: 'dark' } }
      const result = payloadBrowseByFolder({ collections: ['media'] })(
        { collections: [{ slug: 'media', admin: existing }] }
      )
      assert.strictEqual(result.collections[0].admin.custom.featureFlag, true)
      assert.strictEqual(result.collections[0].admin.custom.theme, 'dark')
      assert.strictEqual(result.collections[0].admin.custom.browseByFolder.enabled, true)
    })

    it('preserves collection access control', () => {
      const readFn = () => false
      const result = payloadBrowseByFolder({ collections: ['media'] })(
        { collections: [{ slug: 'media', admin: {}, access: { read: readFn } }] }
      )
      assert.strictEqual(result.collections[0].access.read(), false)
    })

    it('preserves collection-level fields outside admin', () => {
      const result = payloadBrowseByFolder({ collections: ['media'] })(
        { collections: [{ slug: 'media', admin: {}, fields: [{ name: 'title', type: 'text' }] }] }
      )
      assert.deepStrictEqual(result.collections[0].fields, [{ name: 'title', type: 'text' }])
    })
  })

  describe('Extension points for collection-specific columns', () => {
    it('additionalColumns are appended after options.columns', () => {
      const plugin = payloadBrowseByFolder({
        collections: ['docs'],
        columns: [{ accessor: 'title', label: 'Title', active: true }],
        additionalColumns: [
          { accessor: 'author', label: 'Author', active: true },
          { accessor: 'status', label: 'Status', active: true }
        ]
      })
      const result = plugin({ collections: [{ slug: 'docs', admin: {} }] })
      const cols = result.collections[0].admin.custom.browseByFolder.columns
      assert.strictEqual(cols.length, 3)
      assert.strictEqual(cols[0].accessor, 'title')
      assert.strictEqual(cols[1].accessor, 'author')
      assert.strictEqual(cols[2].accessor, 'status')
    })

    it('empty additionalColumns does not break configuration', () => {
      const plugin = payloadBrowseByFolder({
        collections: ['media'],
        additionalColumns: []
      })
      const result = plugin({ collections: [{ slug: 'media', admin: {} }] })
      assert.deepStrictEqual(
        result.collections[0].admin.custom.browseByFolder.columns,
        DEFAULT_FOLDER_COLUMNS
      )
    })
  })

  describe('FolderNavigation renders complete nested folder paths and preserves query parameters', () => {
    it('renders flat folder path', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: { docs: [{ folder: { name: 'Images' } }] },
        searchParams: {}
      })
      const output = JSON.stringify(view)
      assert.match(output, /"Images"/)
      assert.match(output, /"href":"\/admin\/collections\/media\?"/)
    })

    it('renders nested folder path with slash separator', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: { docs: [{ folder: { name: 'Images', parent: { name: 'Projects' } } }] },
        searchParams: {}
      })
      const output = JSON.stringify(view)
      assert.match(output, /Projects\/Images/)
    })

    it('URL-encodes folder paths in href', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: { docs: [{ folder: { name: 'Images', parent: { name: 'Projects' } } }] },
        searchParams: {}
      })
      const output = JSON.stringify(view)
      assert.match(output, /folder=Projects%2FImages/)
    })

    it('preserves existing search params when adding folder filter', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: { docs: [{ folder: { name: 'Images' } }] },
        searchParams: { search: 'photo', limit: '20' }
      })
      const output = JSON.stringify(view)
      assert.match(output, /search=photo/)
      assert.match(output, /limit=20/)
      assert.match(output, /folder=Images/)
    })

    it('shows "All" link when no folder filter is active', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: { docs: [{ folder: { name: 'Images' } }, { folder: { name: 'Docs' } }] },
        searchParams: {}
      })
      const output = JSON.stringify(view)
      assert.match(output, /"All"/)
      // All link has aria-current when no folder filter is active
      assert.match(output, /"aria-current":"page"/)
    })

    it('marks current folder with aria-current="page"', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: { docs: [{ folder: { name: 'Images' } }, { folder: { name: 'Docs' } }] },
        searchParams: { folder: 'Images' }
      })
      const output = JSON.stringify(view)
      // Images should have aria-current, Docs should not
      const imagesMatch = output.match(/"Images"[^}]*"aria-current":"page"/)
      assert.ok(imagesMatch, 'Images folder should have aria-current="page"')
    })

    it('deduplicates folders across multiple documents', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: {
          docs: [
            { folder: { name: 'Images' } },
            { folder: { name: 'Images' } },
            { folder: { name: 'Docs' } }
          ]
        },
        searchParams: {}
      })
      // Count <a> elements with folder paths (exclude "All" link)
      const parsed = JSON.parse(JSON.stringify(view))
      const children = parsed.props.children
      const folderLinks = children.filter(
        (c) => c.type === 'a' && c.props.children !== 'All'
      )
      assert.strictEqual(folderLinks.length, 2, 'Should have exactly 2 unique folder links')
      const names = folderLinks.map((l) => l.props.children).sort()
      assert.deepStrictEqual(names, ['Docs', 'Images'])
    })

    it('sorts folder paths alphabetically', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: {
          docs: [
            { folder: { name: 'Zebra' } },
            { folder: { name: 'Alpha' } },
            { folder: { name: 'Middle' } }
          ]
        },
        searchParams: {}
      })
      const output = JSON.stringify(view)
      const alphaIdx = output.indexOf('"Alpha"')
      const middleIdx = output.indexOf('"Middle"')
      const zebraIdx = output.indexOf('"Zebra"')
      assert.ok(alphaIdx < middleIdx && middleIdx < zebraIdx, 'Folders should be sorted')
    })

    it('handles circular folder references via cache Map', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: {
          docs: [{
            folder: {
              id: 'a',
              name: 'A',
              parent: {
                id: 'b',
                name: 'B',
                parent: { id: 'a', name: 'A' } // circular
              }
            }
          }]
        },
        searchParams: {}
      })
      const output = JSON.stringify(view)
      assert.match(output, /A/)
      assert.match(output, /B/)
    })

    it('handles string folder values directly', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: { docs: [{ folder: 'simple/path' }] },
        searchParams: {}
      })
      const output = JSON.stringify(view)
      assert.match(output, /simple\/path/)
    })

    it('handles empty or missing docs gracefully', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: { docs: [] },
        searchParams: {}
      })
      const output = JSON.stringify(view)
      assert.match(output, /Folders:/)
      assert.match(output, /"All"/)
    })

    it('handles undefined data.docs gracefully', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: {},
        searchParams: {}
      })
      const output = JSON.stringify(view)
      assert.match(output, /Folders:/)
    })

    it('handles null/undefined folder on a document', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: { docs: [{ folder: null }, { folder: { name: 'Valid' } }] },
        searchParams: {}
      })
      const output = JSON.stringify(view)
      assert.match(output, /Valid/)
    })

    it('deletes folder param when clicking "All"', () => {
      const view = FolderNavigation({
        collectionSlug: 'media',
        data: { docs: [{ folder: { name: 'Images' } }] },
        searchParams: { folder: 'Images', search: 'test' }
      })
      const output = JSON.stringify(view)
      // All link should NOT contain folder param
      const allLinkMatch = output.match(/"All"[^}]*/)
      assert.ok(allLinkMatch)
      assert.ok(!allLinkMatch[0].includes('folder='))
    })
  })
})
