# payload-self-storage v0.1.0 — backlog

## Folder-aware physical storage

- Determine the actual Payload 3.87 folder metadata produced by `folders: true`.
- Build canonical storage keys from the document folder and filename, not from an assumed `folder` field.
- Ensure original files and generated image sizes use the same folder prefix.
- Make create, update, delete, legacy lookup, and promotion work for nested paths.
- Add integration tests using a Payload-compatible document shape and verify the physical filesystem.
- Keep path traversal and collision protections enabled.

## WebP image processing

- Preserve the collection's existing `imageSizes` configuration.
- Configure Sharp/Payload so the original PNG and every generated image size are written as WebP.
- Ensure filename, URL, MIME type, and size metadata remain consistent with the generated files.
- Add tests that inspect output extensions and MIME behavior.
- Document that the application must provide `sharp` and that the installed package must be current.

## UI & Routing Backlog (v0.1.0 Issues)

- [x] Fix unstyled list table in `@nan0web/payload-browse-by-folder`: integrate Payload standard Admin CSS classes or list view styles so list layout is styled properly.
- [x] Fix thumbnail preview rendering: ensure preview URLs in `payload-self-storage` and `browse-by-folder` generate `/Hello/<filename>.webp` instead of `/api/media/file/<filename>.webp` for htaccess compatibility.
- [x] Hydration fix in `@nan0web/payload-signin-theme-state`: eliminate inline script head hydration warnings by using client layout effect.

## Залишок робіт (не завершено у v0.1.0)

### Критичні баги (500 errors)

- [ ] **500 при сервісі файлів**: `getFileHandler` бере тільки basename → шукає `storage/yaro-rasta.webp` замість `storage/Hello/yaro-rasta.webp`. Потрібен фікс `serveUploadFile()` + повний ревант `moveDocumentFiles()`.
- [ ] **Унікальність filename**: `filename.unique = true` блокує однакові імена в різних папках. Потрібен `filenameCompoundIndex: true` у Media колекції.
- [ ] **SSG URL префікс**: `/media/Hello/image.webp` має бути `/Hello/image.webp` для RSC/SSG рендерингу.

### Архітектурні рішення

- Користувач вирішив перенести подальшу розробку в окрему директорію. Цей плагін є базовим фундаментом; подальші зміни будуть в новому пакеті.
- S3/MinIO адаптер не реалізовано — обрано локальне зберігання з ієрархічною структурою.

## Constraints

- Do not create a v0.2.0 plan before v0.1.0 is released.
- Do not add Admin UI, session UX, folder-browser UI, or manual documentation UI to this package.
- Backup/restore remains backend-neutral; Admin integration belongs to the application or a separate plugin.
- Подальша розробка буде перенесена в окрему директорію користувачем.
