# payload-self-storage

Self-hosted filesystem storage adapter and backup foundation for Payload CMS.

## Documentation

- [English documentation](docs/en/README.md)
- [Українська документація](docs/uk/README.md)
- [v0.1.0 release task](releases/0/1/v0.1.0/task.md)
- [v0.1.0 acceptance specification](releases/0/1/v0.1.0/task.spec.js)

## Install

```bash
pnpm add @nan0web/payload-self-storage
```

## Links

- [GitHub](https://github.com/nan0web/payload-self-storage)
- [npm](https://www.npmjs.com/package/@nan0web/payload-self-storage)

## Payload CMS integration

The package is a config transform for Payload CMS 3.x. It does not need to be added to the `plugins` array:

```js
import { buildConfig } from 'payload'
import { payloadSelfStorage } from '@nan0web/payload-self-storage'

const withStorage = payloadSelfStorage({
  rootDir: './storage',
  publicUrlPrefix: '/media',
  publicOrigin: 'http://localhost:3000',
  collections: ['media'],
})

const config = buildConfig({
  // existing Payload configuration
})

export default withStorage(config)
```

See the language-specific documentation for complete setup and manual verification:

- [English Payload setup](docs/en/README.md#payload-cms-3x-configuration)
- [Український Payload setup](docs/uk/README.md#підключення-до-payload-cms-3x)

For local Payload verification, install the current package tarball rather than using `pnpm link`. Keep only the current tarball in the ignored `.artifacts/` directory:

```bash
cd /Users/i/src/apps/payload-self-storage
pnpm pack:local

cd /Users/i/src/apps/testing-app
pnpm add /Users/i/src/apps/payload-self-storage/.artifacts/nan0web-payload-self-storage-0.1.0.tgz
pnpm add sharp
```

When the package version changes, run `pnpm pack:local` again and install the newly generated filename. Remove old local tarballs from `.artifacts/`; they are not runtime dependencies.

## Development checks

```bash
pnpm test:releases
pnpm test
pnpm knip
pnpm audit
pnpm test:all
```

## License

ISC
