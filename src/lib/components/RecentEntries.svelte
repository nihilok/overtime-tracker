<script lang="ts">
  import { liveQuery } from 'dexie'
  import { db, formatDate } from '$lib/db.js'
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'

  // Show entries from last 30 days
  let entries = $state<Awaited<ReturnType<typeof db.entries.toArray>> | undefined>(undefined)

  $effect(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const start = cutoff.toISOString().slice(0, 10)
    const subscription = liveQuery(() =>
      db.entries.where('date').aboveOrEqual(start).sortBy('date').then(r => r.reverse())
    ).subscribe(result => {
      entries = result
    })
    return () => subscription.unsubscribe()
  })
</script>

<Card class="w-full">
  <CardHeader>
    <CardTitle class="text-base">Recent Entries</CardTitle>
  </CardHeader>
  <CardContent class="p-0">
    {#if entries === undefined}
      <p class="text-muted-foreground text-sm px-6 py-4">Loading…</p>
    {:else if entries.length === 0}
      <p class="text-muted-foreground text-sm px-6 py-4">No entries yet. Start tracking above!</p>
    {:else}
      <ul class="divide-y divide-border">
        {#each entries as entry (entry.id)}
          <li class="flex items-center justify-between px-6 py-3">
            <div>
              <p class="text-sm font-medium">{formatDate(entry.date)}</p>
              {#if entry.note}
                <p class="text-xs text-muted-foreground">{entry.note}</p>
              {/if}
            </div>
            <Badge variant={entry.hours > 0 ? 'default' : 'secondary'}>
              {entry.hours}h
            </Badge>
          </li>
        {/each}
      </ul>
    {/if}
  </CardContent>
</Card>
