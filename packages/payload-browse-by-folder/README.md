# @nan0web/payload-browse-by-folder

Configurable Browse by Folder navigation and column customization plugin for Payload CMS Admin.

## Install

```bash
pnpm add @nan0web/payload-browse-by-folder
```

## Payload CMS integration

Add `payloadBrowseByFolder` to your `plugins` array in `payload.config.ts`:

```typescript
import { buildConfig } from 'payload'
import { payloadBrowseByFolder } from '@nan0web/payload-browse-by-folder'

export default buildConfig({
  plugins: [
    payloadBrowseByFolder({
      collections: ['media'],
    }),
  ],
})
```

## Features

- Custom Browse by Folder navigation tree view in Payload CMS Admin.
- Displays nested folder paths in media collection views.
- Preserves folder query parameters during navigation.

## License

ISC
