import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const packagesDir = path.join(rootDir, 'packages')

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

async function buildPackages(selectedPackages) {
  if (!selectedPackages || selectedPackages.length === 0) {
    console.log('⚠️ No packages selected.')
    return
  }

  const validPackages = selectedPackages.filter((pkg) => pkg && pkg.pkgName)
  console.log(`\n📦 Building ${validPackages.length} package(s) in parallel...`)

  // Validate each package bundle (no build step — these are pure ESM)
  await Promise.all(
    validPackages.map(async (pkg) => {
      console.log(`🔨 [${pkg.pkgName}] Checking...`)
      await execAsync('pnpm pack:check', { cwd: pkg.path })
      console.log(`✅ [${pkg.pkgName}] OK`)
    })
  )

  console.log('\n✨ All packages validated!')
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
    await buildPackages(packages)
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
    await buildPackages(selected)
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

    await buildPackages(selectedPkgs)
  } catch (err) {
    if (err?.name === 'CancelError' || err?.cancelled) {
      console.log('\nСкасовано.')
      return
    }
    console.error('Помилка при роботі з @nan0web/ui-cli:', err)
  }
}

main().catch(console.error)
