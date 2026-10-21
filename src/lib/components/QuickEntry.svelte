<script lang="ts">
  import { onDestroy } from 'svelte'
  import { getEntry, setEntry, formatDate, getRelativeDateLabel } from '$lib/db.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Minus, Plus, Check } from 'lucide-svelte'

  let {
    date,
    label,
    onchange
  }: {
    date: string
    label?: string
    onchange?: () => void
  } = $props()

  let hours = $state(0)
  let note = $state('')
  let loading = $state(false)
  let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle')

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let statusResetTimer: ReturnType<typeof setTimeout> | null = null
  let activeDate = $state('')

  // Flush any pending unsaved note changes to DB
  async function flushPendingNote(targetDate = activeDate || date) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    try {
      await setEntry(targetDate, hours, note)
      saveStatus = 'saved'
      onchange?.()
      if (statusResetTimer) clearTimeout(statusResetTimer)
      statusResetTimer = setTimeout(() => {
        if (saveStatus === 'saved') saveStatus = 'idle'
      }, 1500)
    } catch (err) {
      console.error('Failed to save note:', err)
      saveStatus = 'idle'
    }
  }

  // Reload hours and note when date changes, flushing any pending note first
  $effect(() => {
    const newDate = date
    if (activeDate && newDate !== activeDate) {
      if (debounceTimer) {
        flushPendingNote(activeDate)
      }
    }
    activeDate = newDate
    saveStatus = 'idle'

    getEntry(newDate).then(entry => {
      hours = entry?.hours ?? 0
      note = entry?.note ?? ''
    })
  })

  onDestroy(() => {
    if (debounceTimer) {
      flushPendingNote(activeDate || date)
    }
    if (statusResetTimer) clearTimeout(statusResetTimer)
  })

  function handleNoteInput() {
    saveStatus = 'saving'
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      flushPendingNote(date)
    }, 500)
  }

  function handleNoteBlur() {
    if (saveStatus === 'saving' || debounceTimer) {
      flushPendingNote(date)
    }
  }

  async function adjust(delta: number) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    loading = true
    try {
      const existing = await getEntry(date)
      const current = existing?.hours ?? 0
      const next = Math.max(0, current + delta)
      await setEntry(date, next, note)
      hours = next
      saveStatus = 'saved'
      if (statusResetTimer) clearTimeout(statusResetTimer)
      statusResetTimer = setTimeout(() => {
        if (saveStatus === 'saved') saveStatus = 'idle'
      }, 1500)
      onchange?.()
    } finally {
      loading = false
    }
  }

  let displayLabel = $derived(label || getRelativeDateLabel(date))
</script>

<Card class="w-full shadow-xs">
  <CardHeader class="pb-3">
    <div class="flex items-center justify-between">
      <div>
        <CardTitle class="text-base font-semibold">{displayLabel}</CardTitle>
        <p class="text-xs text-muted-foreground mt-0.5">{formatDate(date)}</p>
      </div>
      <Badge variant={hours > 0 ? 'default' : 'secondary'} class="text-xs px-2.5 py-0.5 font-semibold">
        {hours}h
      </Badge>
    </div>
  </CardHeader>

  <CardContent class="space-y-4">
    <!-- Description / Note placed FIRST (above hours) with 500ms auto-save debounce -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <Label for="note-{date}" class="text-xs font-medium text-foreground">
          Description / Note
        </Label>
        <div class="h-4 flex items-center">
          {#if saveStatus === 'saving'}
            <span class="text-[11px] text-muted-foreground animate-pulse font-normal">
              Saving…
            </span>
          {:else if saveStatus === 'saved'}
            <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
              <Check class="h-3 w-3" /> Saved
            </span>
          {/if}
        </div>
      </div>
      <Input
        id="note-{date}"
        type="text"
        bind:value={note}
        oninput={handleNoteInput}
        onblur={handleNoteBlur}
        placeholder="e.g. Server maintenance, client deadline"
        class="text-sm"
      />
    </div>

    <!-- Stepper & Hours Display -->
    <div class="flex items-center justify-between gap-3 pt-1">
      <Button
        variant="outline"
        size="icon"
        onclick={() => adjust(-0.5)}
        disabled={loading || hours <= 0}
        aria-label="Subtract 0.5 hours"
        class="h-11 w-11 shrink-0"
      >
        <Minus class="h-5 w-5" />
      </Button>

      <div class="flex-1 text-center py-1">
        <span class="text-4xl font-extrabold tabular-nums tracking-tight">{hours}</span>
        <span class="text-muted-foreground ml-1 text-sm font-medium">hrs</span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onclick={() => adjust(0.5)}
        disabled={loading}
        aria-label="Add 0.5 hours"
        class="h-11 w-11 shrink-0"
      >
        <Plus class="h-5 w-5" />
      </Button>
    </div>

    <!-- Quick Increments -->
    <div class="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        class="flex-1 font-medium"
        onclick={() => adjust(1)}
        disabled={loading}
      >
        +1h
      </Button>
      <Button
        variant="secondary"
        size="sm"
        class="flex-1 font-medium"
        onclick={() => adjust(2)}
        disabled={loading}
      >
        +2h
      </Button>
      <Button
        variant="secondary"
        size="sm"
        class="flex-1 font-medium"
        onclick={() => adjust(-1)}
        disabled={loading || hours < 1}
      >
        -1h
      </Button>
    </div>
  </CardContent>
</Card>
