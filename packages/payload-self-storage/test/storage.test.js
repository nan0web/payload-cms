import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { Readable } from 'node:stream'
import os from 'node:os'
import path from 'node:path'
import { createLocalFilesystemBackend, StorageCollisionError, StoragePathError } from '../src/index.js'

const dirs = []
afterEach(async () => { await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))) })

describe('local filesystem storage', () => {
  it('writes nested files, moves, reads, and deletes them', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'payload-storage-')); dirs.push(root)
    const backend = createLocalFilesystemBackend({ rootDir: root })
    await backend.write('/media/images/cards/Visa.webp', Readable.from('hello'))
    assert.equal(await readFile(path.join(root, 'images/cards/Visa.webp'), 'utf8'), 'hello')
    assert.equal(await backend.exists('/media/images/cards/Visa.webp'), true)
    await backend.move('/media/images/cards/Visa.webp', '/media/archive/Visa.webp')
    assert.equal(await backend.read('/media/archive/Visa.webp').then(async (s) => { let x=''; for await (const c of s) x += c; return x }), 'hello')
    await backend.delete('/media/archive/Visa.webp')
    assert.equal(await backend.exists('/media/archive/Visa.webp'), false)
  })
  it('rejects traversal and collisions', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'payload-storage-')); dirs.push(root)
    const backend = createLocalFilesystemBackend({ rootDir: root })
    assert.throws(() => backend.policy.storageKey('/media/../secret.txt'), StoragePathError)
    await backend.write('/media/a.txt', Readable.from('one'))
    await assert.rejects(() => backend.write('/media/a.txt', Readable.from('two')), StorageCollisionError)
  })
  it('prefers canonical files and supports legacy lookup', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'payload-storage-')); dirs.push(root)
    await writeFile(path.join(root, 'a.txt'), 'legacy')
    const backend = createLocalFilesystemBackend({ rootDir: root })
    assert.equal(await backend.read('/media/folder/a.txt').then(async (s) => { let x=''; for await (const c of s) x += c; return x }), 'legacy')
    await backend.promote('/media/folder/a.txt')
    assert.equal(await readFile(path.join(root, 'folder/a.txt'), 'utf8'), 'legacy')
    assert.equal(await backend.exists('/media/a.txt'), false)
    assert.equal(await backend.read('/media/folder/a.txt').then(async (s) => { let x=''; for await (const c of s) x += c; return x }), 'legacy')
  })
})
