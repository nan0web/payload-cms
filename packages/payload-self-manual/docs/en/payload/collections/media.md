# Media Collection & Storage

Managing media files in Payload CMS.

## Key Features

- Upload images, videos, documents
- Automatic thumbnail generation
- Organization via tags and categories
- Cloud storage support (S3, Cloudinary, etc.)

## Media Workflow Diagram

```mermaid
graph TD
    A[File Upload] --> B{Validation}
    B -->|OK| C[Save to Server]
    B -->|Error| D[Error Message]
    C --> E[Generate Thumbnails]
    E --> F[Add to Collection]
    F --> G[Ready to Use]
```

## Example Embedded Image

![Payload CMS Logo](https://payloadcms.com/images/payload-logo-dark.svg)

## Useful Links

- [Official Payload CMS Media Documentation](https://payloadcms.com/docs/media/overview)
- [Cloud Storage Configuration](https://payloadcms.com/docs/storage/overview)

## Tips & Tricks

1. **Image Optimization**: Use WebP format for better quality and smaller size
2. **Tags**: Add tags to media for easy searching
3. **Alternative Text**: Always fill alt-text for accessibility

## API Examples

```javascript
// Upload media via API
const media = await payload.create({
  collection: 'media',
  data: {
    alt: 'My image',
    // other fields
  }
})
```
