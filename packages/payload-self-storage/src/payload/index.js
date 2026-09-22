export { folderId, resolveFolderPath, resolveTargetFolder } from './folder-resolver.js'
export {
	fileEntries,
	stripDuplicateSuffix,
	cleanAltFromFilename,
	computeFileMetadata,
	moveDocumentFiles,
} from './file-mover.js'
export {
	findRecursive,
	generateThumbnailOnDemand,
	respondWithFile,
	createUploadHandler,
	serveStorageFile,
	DEFAULT_MIME_TYPES,
	DEFAULT_CACHE_CONTROL,
	DEFAULT_THUMBNAIL_FORMATS,
} from './file-server.js'
export { payloadSelfStorage } from './plugin.js'
