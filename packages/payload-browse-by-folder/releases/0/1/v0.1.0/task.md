# payload-browse-by-folder v0.1.0

## Мета

Окремий Payload CMS 3.x Admin plugin для керування колонками та поведінкою Browse by folder, оскільки стандартні `defaultColumns` не покривають цю view.

## Scope

- Provide a configurable Browse by folder Admin view for selected upload collections.
- Configure visible columns per collection, including filename, preview, MIME type, size, dimensions, folder, and timestamps.
- Support column order, labels, visibility, and sensible responsive behavior.
- Preserve Payload folder navigation, document links, access control, pagination, and search/filter behavior.
- Add configurable actions for opening the document and copying/opening the file URL.
- Expose extension points for collection-specific columns.
- Add Admin integration tests for navigation and column configuration.

## Не входить

- Changing physical storage layout.
- Replacing Payload upload processing.
- Bypassing collection ACL.
- Backup/restore engine implementation.

## Definition of Done

- Browse by folder has independently configurable columns.
- Configuration applies only to selected collections.
- Existing Payload Media behavior remains available.
- The plugin is usable without changes to Payload core.
