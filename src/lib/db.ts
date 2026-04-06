import Dexie, { type Table } from 'dexie'

export interface OvertimeEntry {
  id?: number
  date: string // ISO date string YYYY-MM-DD
  hours: number
  note?: string
}

export class OvertimeDatabase extends Dexie {
  entries!: Table<OvertimeEntry>

  constructor() {
    super('overtime-tracker')
    this.version(1).stores({
      entries: '++id, date'
    })
  }
}

export const db = new OvertimeDatabase()

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function yesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
}

export async function getEntry(date: string): Promise<OvertimeEntry | undefined> {
  return db.entries.where('date').equals(date).first()
}

export async function setEntry(date: string, hours: number, note?: string): Promise<void> {
  const existing = await getEntry(date)
  if (existing) {
    await db.entries.update(existing.id!, { hours, note: note ?? existing.note })
  } else {
    await db.entries.add({ date, hours, note })
  }
}

export async function incrementEntry(date: string, delta: number): Promise<number> {
  const existing = await getEntry(date)
  const current = existing?.hours ?? 0
  const next = Math.max(0, current + delta)
  await setEntry(date, next, existing?.note)
  return next
}

export async function bulkSetEntries(
  startDate: string,
  endDate: string,
  hours: number,
  note?: string,
  skipWeekends = true
): Promise<number> {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const dow = cur.getDay()
    if (!skipWeekends || (dow !== 0 && dow !== 6)) {
      const dateStr = cur.toISOString().slice(0, 10)
      await setEntry(dateStr, hours, note)
      count++
    }
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export async function getEntriesInRange(startDate: string, endDate: string): Promise<OvertimeEntry[]> {
  return db.entries
    .where('date')
    .between(startDate, endDate, true, true)
    .sortBy('date')
}

export function lastFullMonthRange(): { start: string; end: string; label: string } {
  const now = new Date()
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfLastMonth = new Date(firstOfThisMonth.getTime() - 1)
  const firstOfLastMonth = new Date(lastOfLastMonth.getFullYear(), lastOfLastMonth.getMonth(), 1)
  return {
    start: firstOfLastMonth.toISOString().slice(0, 10),
    end: lastOfLastMonth.toISOString().slice(0, 10),
    label: firstOfLastMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }
}
