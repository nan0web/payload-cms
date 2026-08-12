# testing-app v0.1.0 — integration backlog

## Storage package verification

- Fix `install-self-storage.sh` to install the tarball produced by the current `pnpm pack`, not a hard-coded stale `/tmp/payload-self-storage-v0.1.0.tgz` path.
- Verify the installed package version and source after installation.
- Rebuild/restart the app after package installation.
- Inspect resolved Media upload config at runtime.
- Verify Payload folder metadata for `folders: true` and pass the real shape to storage integration.
- Upload a PNG and verify original plus every image size are physically WebP files with matching URLs and MIME metadata.
- Verify nested physical paths and migrate/clean existing flat files separately.

## Proposed plugins

- Evaluate and integrate `payload-signin-theme-state` for Admin Login theme persistence and session UX.
- Evaluate and integrate `payload-browse-by-folder` for custom Browse by folder columns.
- Evaluate and integrate `payload-self-manual` for collection help and Mermaid documentation.

## Backup/restore first version

- Keep backup/restore execution outside Admin UI for now.
- Add application scripts or API examples that invoke the backend-neutral export/restore modules.
- Document that Payload/PostgreSQL database backup is separate from storage backup.
- Add a manual verification procedure: export, remove/relocate a test file, dry-run restore, restore, checksum verify.

## Existing Admin observations

- `Media` currently has `folders: true` and custom `imageSizes`.
- Payload Admin folder browsing does not expose the required custom columns through standard collection columns.
- Frontend theme localStorage does not automatically control Payload Admin Login theme.
