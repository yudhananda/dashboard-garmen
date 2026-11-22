/**
 * @file storage.js
 * @description IndexedDB persistence for weekly snapshots.
 *              Each upload is stored keyed by reportDate (ISO). This enables
 *              week-over-week trend lines and "rising defect" detection.
 */

import { openDB } from 'idb'
import { DB_NAME, DB_VERSION, STORE_SNAPSHOTS } from '../constants.js'

/** Open (or create) the IndexedDB database. */
async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        const store = db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'reportDate' })
        store.createIndex('byDate', 'reportDate')
      }
    },
  })
}

/** Save (upsert) a snapshot. */
export async function saveSnapshot(snapshot) {
  const db = await getDb()
  await db.put(STORE_SNAPSHOTS, snapshot)
}

/** Get a single snapshot by reportDate. */
export async function getSnapshot(reportDate) {
  const db = await getDb()
  return db.get(STORE_SNAPSHOTS, reportDate)
}

/** List all snapshots sorted by reportDate ascending. */
export async function listSnapshots() {
  const db = await getDb()
  const all = await db.getAll(STORE_SNAPSHOTS)
  return all.sort((a, b) => String(a.reportDate).localeCompare(String(b.reportDate)))
}

/** Delete a snapshot by reportDate. */
export async function deleteSnapshot(reportDate) {
  const db = await getDb()
  await db.delete(STORE_SNAPSHOTS, reportDate)
}

/** Clear all snapshots (used by "reset data"). */
export async function clearAll() {
  const db = await getDb()
  await db.clear(STORE_SNAPSHOTS)
}
