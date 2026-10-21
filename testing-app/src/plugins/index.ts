import { Plugin } from 'payload'
import { payloadKeyboardFocus } from '@nan0web/payload-keyboard-accessibility'
import { payloadSigninThemeState } from '@nan0web/payload-signin-theme-state'
import { payloadBrowseByFolder } from '@nan0web/payload-browse-by-folder'
import { payloadSelfManual } from '@nan0web/payload-self-manual'
import { payloadRelease } from '@nan0web/payload-release'
import { basePayloadPlugins } from './basePayloadPlugins'

const nan0Plugins: Array<{ id: string, plugin: Plugin }> = [
  { id: 'keyboard-accessibility', plugin: payloadKeyboardFocus() as unknown as Plugin },
  { id: 'signin-theme-state', plugin: payloadSigninThemeState() as unknown as Plugin },
  { id: 'browse-by-folder', plugin: payloadBrowseByFolder() as unknown as Plugin },
  { id: 'self-manual', plugin: payloadSelfManual() as unknown as Plugin },
  { id: 'release', plugin: payloadRelease() as unknown as Plugin },
]

const envFilter = (process.env.PLUGINS || process.env.PLUGIN || '').trim().toLowerCase()
const activeFilterList = envFilter ? envFilter.split(',').map((s) => s.trim()) : null

const activeNan0Plugins = (
  activeFilterList
    ? nan0Plugins.filter((item) => activeFilterList.includes(item.id))
    : nan0Plugins
).map((item) => item.plugin)

export const plugins: Plugin[] = [
  ...basePayloadPlugins,
  ...activeNan0Plugins,
]
