declare module 'payload-self-storage' {
  type PayloadSelfStorageOptions = {
    rootDir: string
    collections?: string[]
    publicUrlPrefix?: string
    publicOrigin?: string
    legacyLookup?: boolean
    collision?: 'reject' | 'overwrite'
    onRedirect?: (redirect: object) => Promise<void>
  }

  export function payloadSelfStorage<T = any>(
    options: PayloadSelfStorageOptions,
  ): (config: T | Promise<T>) => T | Promise<T>
}
