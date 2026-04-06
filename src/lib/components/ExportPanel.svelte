<script lang="ts">
  import { getEntriesInRange, lastFullMonthRange, exportAllEntries } from '$lib/db.js'
  import { exportToExcel } from '$lib/export.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { Download } from 'lucide-svelte'

  const lastMonth = lastFullMonthRange()

  let customStart = $state('')
  let customEnd = $state('')
  let loading = $state(false)
  let status = $state('')

  async function exportRange(start: string, end: string, label: string) {
    loading = true
    status = ''
    try {
      const entries = await getEntriesInRange(start, end)
      if (entries.length === 0) {
        status = 'No entries found for this date range.'
        return
      }
      await exportToExcel(entries, label)
      status = `✓ Exported ${entries.length} entries`
    } catch (err) {
      status = `Error: ${String(err)}`
    } finally {
      loading = false
    }
  }

  async function exportLastMonth() {
    await exportRange(lastMonth.start, lastMonth.end, lastMonth.label)
  }

  async function exportJSON() {
    loading = true
    status = ''
    try {
      const entries = await exportAllEntries()
      const json = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries }, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `overtime-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      status = `✓ Exported ${entries.length} entries as JSON`
    } catch (err) {
      status = `Error: ${String(err)}`
    } finally {
      loading = false
    }
  }

  async function exportCustom(e: Event) {
    e.preventDefault()
    if (!customStart || !customEnd) return
    if (customEnd < customStart) {
      status = 'End date must be after start date.'
      return
    }
    const label = `${customStart} to ${customEnd}`
    await exportRange(customStart, customEnd, label)
  }
</script>

<Card class="w-full">
  <CardHeader>
    <CardTitle>Export Report</CardTitle>
  </CardHeader>
  <CardContent class="space-y-6">
    <!-- Last full month -->
    <div class="space-y-2">
      <p class="text-sm font-medium">Last full month</p>
      <p class="text-xs text-muted-foreground">{lastMonth.label} ({lastMonth.start} → {lastMonth.end})</p>
      <Button onclick={exportLastMonth} disabled={loading} class="w-full gap-2">
        <Download class="h-4 w-4" />
        Export {lastMonth.label}
      </Button>
    </div>

    <Separator />

    <!-- Custom range -->
    <form onsubmit={exportCustom} class="space-y-3">
      <p class="text-sm font-medium">Custom date range</p>
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1">
          <Label for="exp-start">From</Label>
          <Input id="exp-start" type="date" bind:value={customStart} />
        </div>
        <div class="space-y-1">
          <Label for="exp-end">To</Label>
          <Input id="exp-end" type="date" bind:value={customEnd} min={customStart} />
        </div>
      </div>
      <Button type="submit" variant="secondary" disabled={loading} class="w-full gap-2">
        <Download class="h-4 w-4" />
        Export Range
      </Button>
    </form>

    {#if status}
      <p class="text-sm {status.startsWith('✓') ? 'text-green-400' : 'text-destructive'}">{status}</p>
    {/if}

    <Separator />

    <!-- JSON backup -->
    <div class="space-y-2">
      <p class="text-sm font-medium">Full backup (JSON)</p>
      <p class="text-xs text-muted-foreground">Download all entries as a JSON file for safekeeping or migration.</p>
      <Button onclick={exportJSON} disabled={loading} variant="secondary" class="w-full gap-2">
        <Download class="h-4 w-4" />
        Export all as JSON
      </Button>
    </div>
  </CardContent>
</Card>
