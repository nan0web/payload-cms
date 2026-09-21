# Media Collection (`media`) & Self Storage

The **Media** collection provides uploaded file storage, thumbnail generation, and disk integration via `@nan0web/payload-self-storage`.

## Features and Storage Rules (v0.2.0)

### 1. Storage in Physical Nested Folders
- **Via `sourcePath` field**: If specified during creation/upload (e.g. `img/products/cards/Visa-Instant.webp` or `docs/contracts/agreement.pdf`), the file is physically stored in `storage/img/products/cards/Visa-Instant.webp`.
- **Via Folder Hierarchy (`payload-folders`)**: If `sourcePath` is not set, the file is automatically placed in physical folders according to the virtual folder hierarchy (e.g. `storage/2026/news/hero.webp`).
- **Storage Root**: If neither is set, stored in `storage/<filename>.<ext>`.

### 2. Cascading Deduplication (Size + SHA-256 Hash)
Prevents duplicate suffixes (`-1`, `-2`):
1. Checks file existence on disk.
2. Compares `stat.size`.
3. Compares streaming SHA-256 hash if sizes match.
4. Removes temporary duplicate upload, links canonical path, and marks document with `isDuplicate: true` and `duplicateMessage`.

### 3. File Formats and Extensions
- Images convert to `.webp` when `convertImageSizesToWebp: true`.
- Other files (`.pdf`, `.svg`, `.zip`, `.mp4`) preserve original extensions and MIME types.

---

## Shortcuts
- **`Cmd + /`** (macOS) or **`Ctrl + /`** (Windows/Linux) — open this manual.
