<script lang="ts">
  import { liveQuery } from 'dexie'
  import {
    today,
    shiftDate,
    getPastWeekDays,
    getRelativeDateLabel,
    formatDate,
    db
  } from '$lib/db.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-svelte'

  let {
    selectedDate = $bindable(today()),
    onchange
  }: {
    selectedDate?: string
    onchange?: (date: string) => void
  } = $props()

  const todayDate = today()

  // Track hours for the past week days reactively via Dexie liveQuery
  let weekHoursMap = $state<Record<string, number>>({})

  $effect(() => {
    const pastDays = getPastWeekDays(7)
    const startDate = pastDays[0]
    const subscription = liveQuery(async () => {
      const items = await db.entries.where('date').aboveOrEqual(startDate).toArray()
      const map: Record<string, number> = {}
      for (const item of items) {
        if (item.hours > 0) {
          map[item.date] = item.hours
        }
      }
      return map
    }).subscribe({
      next: map => { weekHoursMap = map },
      error: () => { weekHoursMap = {} }
    })
    return () => subscription.unsubscribe()
  })

  function selectDate(date: string) {
    if (date > todayDate) return
    selectedDate = date
    onchange?.(date)
  }

  function goPrevDay() {
    selectDate(shiftDate(selectedDate, -1))
  }

  function goNextDay() {
    if (selectedDate >= todayDate) return
    selectDate(shiftDate(selectedDate, 1))
  }

  function goToday() {
    selectDate(todayDate)
  }

  // Generate the 7 days of the past week (ending today)
  let weekPills = $derived.by(() => {
    const days = getPastWeekDays(7)
    return days.map(d => {
      const [y, m, dayNum] = d.split('-').map(Number)
      const dateObj = new Date(y, m - 1, dayNum)
      const isCurrentToday = d === todayDate
      const weekday = isCurrentToday
        ? 'Today'
        : dateObj.toLocaleDateString(undefined, { weekday: 'short' })
      return {
        date: d,
        weekday,
        dayNum: dateObj.getDate(),
        hours: weekHoursMap[d] ?? 0
      }
    })
  })

  let isToday = $derived(selectedDate === todayDate)
  let relativeLabel = $derived(getRelativeDateLabel(selectedDate))
  let formattedDate = $derived(formatDate(selectedDate))
</script>

<div class="space-y-2">
  <!-- Top Stepper: Previous / Current Day Label / Next -->
  <div class="flex items-center justify-between gap-2 bg-card p-2 rounded-lg border border-border shadow-xs">
    <Button
      variant="outline"
      size="sm"
      onclick={goPrevDay}
      aria-label="Previous day"
      class="h-8 px-2.5 gap-1 text-xs"
    >
      <ChevronLeft class="h-4 w-4" />
      <span>Previous</span>
    </Button>

    <div class="flex-1 text-center min-w-0 px-2">
      <div class="flex items-center justify-center gap-1.5 flex-wrap">
        <span class="font-semibold text-sm leading-tight">{relativeLabel}</span>
        {#if !isToday}
          <button
            type="button"
            onclick={goToday}
            class="inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline font-normal cursor-pointer"
            title="Snap to Today"
          >
            <RotateCcw class="h-3 w-3" />
            <span>Today</span>
          </button>
        {/if}
      </div>
      <p class="text-[11px] text-muted-foreground truncate">{formattedDate}</p>
    </div>

    <Button
      variant="outline"
      size="sm"
      onclick={goNextDay}
      disabled={isToday}
      aria-label="Next day"
      class="h-8 px-2.5 gap-1 text-xs"
    >
      <span>Next</span>
      <ChevronRight class="h-4 w-4" />
    </Button>
  </div>

  <!-- Past week day pills strip -->
  <div class="grid grid-cols-7 gap-1 p-1 bg-muted/40 rounded-lg border border-border">
    {#each weekPills as pill (pill.date)}
      {@const isSelected = pill.date === selectedDate}
      <button
        type="button"
        onclick={() => selectDate(pill.date)}
        class="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-md text-xs transition-colors cursor-pointer select-none
          {isSelected
            ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground'}"
      >
        <span class="text-[10px] uppercase tracking-wider font-medium leading-none">
          {pill.weekday}
        </span>
        <span class="text-xs font-bold tabular-nums mt-1 leading-none">
          {pill.dayNum}
        </span>
        {#if pill.hours > 0}
          <span
            class="text-[9px] px-1 py-0.5 rounded-full mt-1 leading-none font-semibold
              {isSelected
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-primary/10 text-primary'}"
          >
            {pill.hours}h
          </span>
        {:else}
          <span class="h-3 mt-1 block"></span>
        {/if}
      </button>
    {/each}
  </div>
</div>
