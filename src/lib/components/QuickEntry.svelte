<script lang="ts">
  import { getEntry, setEntry, formatDate } from '$lib/db.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Minus, Plus } from 'lucide-svelte'

  let {
    date,
    label,
    hours = $bindable(0),
    onchange
  }: {
    date: string
    label: string
    hours?: number
    onchange?: () => void
  } = $props()

  let loading = $state(false)
  let note = $state('')

  $effect(() => {
    getEntry(date).then(e => { note = e?.note ?? '' })
  })

  async function adjust(delta: number) {
    loading = true
    try {
      const existing = await getEntry(date)
      const current = existing?.hours ?? 0
      const next = Math.max(0, current + delta)
      await setEntry(date, next, note || undefined)
      hours = next
      onchange?.()
    } finally {
      loading = false
    }
  }

  async function saveNote() {
    await setEntry(date, hours, note || undefined)
  }
</script>

<Card class="w-full">
  <CardHeader class="pb-2">
    <div class="flex items-center justify-between">
      <CardTitle class="text-base font-medium text-muted-foreground">{label}</CardTitle>
      <Badge variant={hours > 0 ? 'default' : 'secondary'}>
        {hours}h
      </Badge>
    </div>
    <p class="text-xs text-muted-foreground">{formatDate(date)}</p>
  </CardHeader>
  <CardContent>
    <div class="flex items-center justify-between gap-3">
      <Button
        variant="outline"
        size="icon"
        onclick={() => adjust(-0.5)}
        disabled={loading || hours <= 0}
        aria-label="Subtract 0.5 hours"
      >
        <Minus class="h-4 w-4" />
      </Button>
      <div class="flex-1 text-center">
        <span class="text-4xl font-bold tabular-nums">{hours}</span>
        <span class="text-muted-foreground ml-1">hrs</span>
      </div>
      <Button
        variant="outline"
        size="icon"
        onclick={() => adjust(0.5)}
        disabled={loading}
        aria-label="Add 0.5 hours"
      >
        <Plus class="h-4 w-4" />
      </Button>
    </div>
    <div class="flex gap-2 mt-3">
      <Button variant="secondary" size="sm" class="flex-1" onclick={() => adjust(1)} disabled={loading}>+1h</Button>
      <Button variant="secondary" size="sm" class="flex-1" onclick={() => adjust(2)} disabled={loading}>+2h</Button>
      <Button variant="secondary" size="sm" class="flex-1" onclick={() => adjust(-1)} disabled={loading || hours < 1}>-1h</Button>
    </div>
    <div class="mt-3 space-y-1">
      <Label for="note-{date}" class="text-xs text-muted-foreground">Note (optional)</Label>
      <Input id="note-{date}" type="text" bind:value={note} placeholder="e.g. Project X crunch" onblur={saveNote} />
    </div>
  </CardContent>
</Card>
