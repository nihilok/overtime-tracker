import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  db,
  today,
  yesterday,
  getEntry,
  setEntry,
  incrementEntry,
  bulkSetEntries,
  exportAllEntries,
  importAllEntries,
  lastFullMonthRange,
} from './db'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

// ---------------------------------------------------------------------------
// today / yesterday
// ---------------------------------------------------------------------------

describe('today', () => {
  it('returns a local YYYY-MM-DD string', () => {
    const result = today()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('matches the local calendar date, not UTC', () => {
    // Simulate a UTC offset scenario: freeze time at 2026-04-06T01:00:00 UTC
    // For UTC+10 users this is 11:00 local (same day), for UTC-0 it's 01:00 (same day).
    // The key regression: toISOString() would give the UTC date, but today() should
    // give the local date — both must agree with getFullYear/getMonth/getDate.
    const now = new Date()
    const expected = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-')
    expect(today()).toBe(expected)
  })
})

describe('yesterday', () => {
  it('returns a local YYYY-MM-DD string one day before today', () => {
    const t = today()
    const y = yesterday()
    expect(y).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const diff = new Date(t + 'T00:00:00').getTime() - new Date(y + 'T00:00:00').getTime()
    expect(diff).toBe(86400_000)
  })
})

// ---------------------------------------------------------------------------
// setEntry / getEntry
// ---------------------------------------------------------------------------

describe('setEntry / getEntry', () => {
  it('creates a new entry', async () => {
    await setEntry('2026-04-01', 2)
    const entry = await getEntry('2026-04-01')
    expect(entry).toBeDefined()
    expect(entry!.hours).toBe(2)
  })

  it('updates an existing entry without clobbering the note', async () => {
    await setEntry('2026-04-01', 2, 'Project X')
    await setEntry('2026-04-01', 3)
    const entry = await getEntry('2026-04-01')
    expect(entry!.hours).toBe(3)
    expect(entry!.note).toBe('Project X')
  })

  it('overwrites the note when one is explicitly provided', async () => {
    await setEntry('2026-04-01', 2, 'old note')
    await setEntry('2026-04-01', 2, 'new note')
    const entry = await getEntry('2026-04-01')
    expect(entry!.note).toBe('new note')
  })

  it('returns undefined for a date with no entry', async () => {
    expect(await getEntry('2026-01-01')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// incrementEntry
// ---------------------------------------------------------------------------

describe('incrementEntry', () => {
  it('creates an entry starting from 0', async () => {
    const result = await incrementEntry('2026-04-01', 1)
    expect(result).toBe(1)
    expect((await getEntry('2026-04-01'))!.hours).toBe(1)
  })

  it('increments an existing entry', async () => {
    await setEntry('2026-04-01', 2)
    const result = await incrementEntry('2026-04-01', 0.5)
    expect(result).toBe(2.5)
  })

  it('never goes below 0', async () => {
    const result = await incrementEntry('2026-04-01', -5)
    expect(result).toBe(0)
  })

  it('preserves the note across increments', async () => {
    await setEntry('2026-04-01', 2, 'my note')
    await incrementEntry('2026-04-01', 1)
    expect((await getEntry('2026-04-01'))!.note).toBe('my note')
  })
})

// ---------------------------------------------------------------------------
// bulkSetEntries
// ---------------------------------------------------------------------------

describe('bulkSetEntries', () => {
  it('handles a single-day range (inclusive)', async () => {
    const count = await bulkSetEntries('2026-04-06', '2026-04-06', 2, undefined, false)
    expect(count).toBe(1)
    expect((await getEntry('2026-04-06'))!.hours).toBe(2)
  })

  it('includes both start and end dates', async () => {
    const count = await bulkSetEntries('2026-04-01', '2026-04-03', 2, undefined, false)
    expect(count).toBe(3)
    for (const date of ['2026-04-01', '2026-04-02', '2026-04-03']) {
      expect((await getEntry(date))!.hours).toBe(2)
    }
  })

  it('skips weekends when skipWeekends=true', async () => {
    // 2026-04-06 is a Monday; week is Mon–Sun Apr 6–12
    const count = await bulkSetEntries('2026-04-06', '2026-04-12', 2, undefined, true)
    expect(count).toBe(5) // Mon–Fri
    expect(await getEntry('2026-04-11')).toBeUndefined() // Saturday
    expect(await getEntry('2026-04-12')).toBeUndefined() // Sunday
  })

  it('includes weekends when skipWeekends=false', async () => {
    const count = await bulkSetEntries('2026-04-06', '2026-04-12', 2, undefined, false)
    expect(count).toBe(7)
  })

  it('updates an existing entry', async () => {
    await setEntry('2026-04-06', 1)
    await bulkSetEntries('2026-04-06', '2026-04-06', 3, undefined, false)
    expect((await getEntry('2026-04-06'))!.hours).toBe(3)
  })

  it('stores under a key that getEntry can find using today()', async () => {
    // Regression: timezone bug caused bulkSetEntries to store under a different
    // key than today(), so updates would create duplicates instead
    const t = today()
    await bulkSetEntries(t, t, 2, undefined, false)
    const entry = await getEntry(t)
    expect(entry).toBeDefined()
    expect(entry!.hours).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// exportAllEntries / importAllEntries
// ---------------------------------------------------------------------------

describe('exportAllEntries / importAllEntries', () => {
  it('exports all entries ordered by date', async () => {
    await setEntry('2026-04-03', 1)
    await setEntry('2026-04-01', 2)
    await setEntry('2026-04-02', 3)
    const exported = await exportAllEntries()
    expect(exported.map(e => e.date)).toEqual(['2026-04-01', '2026-04-02', '2026-04-03'])
  })

  it('round-trips data through export and import', async () => {
    await setEntry('2026-04-01', 2, 'note A')
    await setEntry('2026-04-02', 3)
    const exported = await exportAllEntries()
    await db.entries.clear()
    await importAllEntries(exported)
    const entry = await getEntry('2026-04-01')
    expect(entry!.hours).toBe(2)
    expect(entry!.note).toBe('note A')
  })

  it('overwrites existing data on import', async () => {
    await setEntry('2026-04-01', 5)
    const backup = [{ date: '2026-03-01', hours: 1 }]
    await importAllEntries(backup)
    expect(await getEntry('2026-04-01')).toBeUndefined()
    expect((await getEntry('2026-03-01'))!.hours).toBe(1)
  })

  it('reassigns IDs on import (does not reuse backup IDs)', async () => {
    const backup = [{ id: 999, date: '2026-04-01', hours: 2 }]
    await importAllEntries(backup)
    const entry = await getEntry('2026-04-01')
    expect(entry!.id).not.toBe(999)
  })
})

// ---------------------------------------------------------------------------
// lastFullMonthRange
// ---------------------------------------------------------------------------

describe('lastFullMonthRange', () => {
  it('returns valid YYYY-MM-DD strings', () => {
    const { start, end } = lastFullMonthRange()
    expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('start is before end', () => {
    const { start, end } = lastFullMonthRange()
    expect(start < end).toBe(true)
  })

  it('start is the first day of last month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00'))
    const { start } = lastFullMonthRange()
    expect(start).toBe('2026-03-01')
    vi.useRealTimers()
  })

  it('end is the last day of last month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00'))
    const { end } = lastFullMonthRange()
    expect(end).toBe('2026-03-31')
    vi.useRealTimers()
  })

  it('handles year boundary (January → previous December)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T12:00:00'))
    const { start, end } = lastFullMonthRange()
    expect(start).toBe('2025-12-01')
    expect(end).toBe('2025-12-31')
    vi.useRealTimers()
  })
})
