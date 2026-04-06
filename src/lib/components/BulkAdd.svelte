<script lang="ts">
  import { bulkSetEntries, today } from '$lib/db.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card/index.js'

  let { onSuccess }: { onSuccess?: (count: number) => void } = $props()

  const todayStr = today()
  let startDate = $state(todayStr)
  let endDate = $state(todayStr)
  let hours = $state(2)
  let note = $state('')
  let skipWeekends = $state(true)
  let loading = $state(false)
  let resultMsg = $state('')

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (!startDate || !endDate || hours <= 0) return
    if (endDate < startDate) {
      resultMsg = 'End date must be after start date.'
      return
    }
    loading = true
    resultMsg = ''
    try {
      const count = await bulkSetEntries(startDate, endDate, hours, note || undefined, skipWeekends)
      resultMsg = `✓ Updated ${count} day${count !== 1 ? 's' : ''}`
      onSuccess?.(count)
    } catch (err) {
      resultMsg = `Error: ${String(err)}`
    } finally {
      loading = false
    }
  }
</script>

<Card class="w-full">
  <CardHeader>
    <CardTitle>Bulk Add / Update</CardTitle>
  </CardHeader>
  <CardContent>
    <form onsubmit={handleSubmit} class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1">
          <Label for="bulk-start">Start date</Label>
          <Input id="bulk-start" type="date" bind:value={startDate} max={endDate} />
        </div>
        <div class="space-y-1">
          <Label for="bulk-end">End date</Label>
          <Input id="bulk-end" type="date" bind:value={endDate} min={startDate} />
        </div>
      </div>

      <div class="space-y-1">
        <Label for="bulk-hours">Hours per day</Label>
        <Input id="bulk-hours" type="number" bind:value={hours} min={0} max={24} step={0.5} />
      </div>

      <div class="space-y-1">
        <Label for="bulk-note">Note (optional)</Label>
        <Input id="bulk-note" type="text" bind:value={note} placeholder="e.g. Project X crunch" />
      </div>

      <div class="flex items-center gap-3">
        <Switch id="skip-weekends" bind:checked={skipWeekends} />
        <Label for="skip-weekends">Skip weekends</Label>
      </div>

      {#if resultMsg}
        <p class="text-sm {resultMsg.startsWith('✓') ? 'text-green-400' : 'text-destructive'}">{resultMsg}</p>
      {/if}

      <Button type="submit" class="w-full" disabled={loading}>
        {loading ? 'Saving…' : 'Apply'}
      </Button>
    </form>
  </CardContent>
</Card>
