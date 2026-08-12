# @nan0web/payload-self-manual

Contextual Markdown documentation for Payload CMS Admin.

## Usage

```js
import { payloadSelfManual } from '@nan0web/payload-self-manual'

export default buildConfig({
  plugins: [
    payloadSelfManual({
      docsDir: 'docs',
      defaultLocale: 'uk',
    }),
  ],
})
```

Documentation is loaded from:

```text
docs/{locale}/payload/{slug}.md
```

For example, the Admin page for `collections/media` uses:

```text
docs/uk/payload/collections/media.md
```

The help button supports `Cmd+/` on macOS and `Ctrl+/` on other platforms. Markdown rendering supports tables, lists, code blocks, links, and Mermaid fences. Raw HTML and unsafe link protocols are disabled.

## Release checks

```bash
pnpm test:all
pnpm pack:local
```
