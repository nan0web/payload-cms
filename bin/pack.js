import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const packagesDir = path.join(rootDir, 'packages')
const testingAppDir = path.join(rootDir, 'testing-app')

function getPackages() {
  if (!fs.existsSync(packagesDir)) return []
  return fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .filter((entry) => fs.existsSync(path.join(packagesDir, entry.name, 'package.json')))
    .map((entry) => {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(packagesDir, entry.name, 'package.json'), 'utf8'))
      return {
        dirName: entry.name,
        pkgName: pkgJson.name,
        description: pkgJson.description || entry.name,
        version: pkgJson.version,
        path: path.join(packagesDir, entry.name)
      }
    })
}

import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

async function packPackages(selectedPackages) {
  if (!selectedPackages || selectedPackages.length === 0) {
    console.log('⚠️ No packages selected.')
    return
  }

  const validPackages = selectedPackages.filter((pkg) => pkg && pkg.pkgName)
  console.log(`\n📦 Packing ${validPackages.length} package(s) in parallel...`)

  // Step 1: Run `pnpm pack:local` in parallel for all selected packages
  await Promise.all(
    validPackages.map(async (pkg) => {
      console.log(`🔨 [${pkg.pkgName}] Building & Packing...`)
      await execAsync('pnpm pack:local', { cwd: pkg.path })
      console.log(`✅ [${pkg.pkgName}] Packed!`)
    })
  )

  // Step 2: Batch install all .tgz artifacts into testing-app at once
  if (fs.existsSync(testingAppDir)) {
    const relPaths = validPackages
      .map((pkg) => {
        const artifactName = `${pkg.pkgName.replace(/^@/, '').replace('/', '-')}-${pkg.version}.tgz`
        const artifactPath = path.join(pkg.path, '.artifacts', artifactName)
        return fs.existsSync(artifactPath) ? path.relative(testingAppDir, artifactPath) : null
      })
      .filter(Boolean)

    if (relPaths.length > 0) {
      console.log(`\n📥 Installing ${relPaths.length} artifact(s) into testing-app...`)
      execSync(`pnpm add ${relPaths.join(' ')}`, { cwd: testingAppDir, stdio: 'inherit' })
    }

    console.log(`\n🗺️ Regenerating importMap for testing-app...`)
    try {
      execSync('pnpm generate:importmap', { cwd: testingAppDir, stdio: 'inherit' })
    } catch {
      console.log('⚠️ Could not run pnpm generate:importmap automatically.')
    }
  }

  console.log('\n✨ All selected packages packed and updated in testing-app!')
}

async function main() {
  const packages = getPackages()
  if (packages.length === 0) {
    console.log('No packages found in packages/ directory.')
    return
  }

  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const isAll = process.argv.includes('--all')

  if (isAll) {
    await packPackages(packages)
    return
  }

  if (args.length > 0) {
    const targetNames = args.map((a) => a.toLowerCase())
    const selected = packages.filter(
      (p) => targetNames.includes(p.dirName.toLowerCase()) || targetNames.includes(p.pkgName.toLowerCase())
    )
    if (selected.length === 0) {
      console.log(`⚠️ Пакет(и) "${args.join(', ')}" не знайдено. Доступні: ${packages.map((p) => p.dirName).join(', ')}`)
      return
    }
    await packPackages(selected)
    return
  }

  // Use @nan0web/ui-cli multiselect / select component
  try {
    const { multiselect } = await import('@nan0web/ui-cli')
    const allMarker = { isAll: true }
    const options = [
      {
        title: 'Усі пакети (перезібрати все)',
        value: allMarker,
      },
      ...packages.map((p) => ({
        title: `${p.pkgName} (${p.description})`,
        value: p,
      })),
    ]

    const res = await multiselect({
      message: 'Оберіть пакети для перезбірки:',
      options,
    })

    const selected = res?.value || res
    const selectedList = Array.isArray(selected) ? selected : selected ? [selected] : []
    const hasAll = selectedList.some((item) => item && item.isAll)
    const selectedPkgs = hasAll ? packages : selectedList.filter((item) => item && !item.isAll)

    await packPackages(selectedPkgs)
  } catch (err) {
    if (err?.name === 'CancelError' || err?.cancelled) {
      console.log('\nСкасовано.')
      return
    }
    console.error('Помилка при роботі з @nan0web/ui-cli:', err)
  }
}

main().catch(console.error)
