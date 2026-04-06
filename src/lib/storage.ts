/** Returns whether the Storage Manager API persistence is supported by the browser. */
export function isPersistenceSupported(): boolean {
  return typeof navigator !== 'undefined' &&
    !!navigator.storage &&
    typeof navigator.storage.persist === 'function' &&
    typeof navigator.storage.persisted === 'function'
}

/**
 * Checks the current persistence status without requesting a change.
 * Returns `null` when the API is not supported.
 */
export async function getStoragePersisted(): Promise<boolean | null> {
  if (!isPersistenceSupported()) return null
  return navigator.storage.persisted()
}

/**
 * Requests durable (persistent) storage from the browser.
 * Returns the resulting persistence state, or `null` if the API is not supported.
 */
export async function requestPersistentStorage(): Promise<boolean | null> {
  if (!isPersistenceSupported()) return null
  return navigator.storage.persist()
}
