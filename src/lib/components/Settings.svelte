<script lang="ts">
  import { onMount } from 'svelte'
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { Shield, ShieldAlert, HardDrive } from 'lucide-svelte'
  import {
    isPersistenceSupported,
    getStoragePersisted,
    requestPersistentStorage,
  } from '$lib/storage.js'

  /** `null` = not yet loaded, `false` = best-effort, `true` = persistent */
  let persisted = $state<boolean | null>(null)
  let supported = $state(false)
  let requesting = $state(false)
  let statusMessage = $state('')

  onMount(async () => {
    supported = isPersistenceSupported()
    if (supported) {
      persisted = await getStoragePersisted()
    }
  })

  async function handleRequestPersistence() {
    requesting = true
    statusMessage = ''
    try {
      const result = await requestPersistentStorage()
      persisted = result
      if (result === true) {
        statusMessage = 'Storage is now persistent.'
      } else if (result === false) {
        statusMessage = 'The browser did not grant persistent storage. Data may be cleared by the browser under low-disk conditions.'
      }
    } catch (err) {
      statusMessage = `Error: ${String(err)}`
    } finally {
      requesting = false
    }
  }
</script>

<Card class="w-full">
  <CardHeader>
    <CardTitle>Storage</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <HardDrive class="h-4 w-4 text-muted-foreground" />
        <span class="text-sm font-medium">Local Storage Status</span>
      </div>

      {#if !supported}
        <Badge variant="outline">Not supported</Badge>
      {:else if persisted === null}
        <Badge variant="secondary">Checking…</Badge>
      {:else if persisted}
        <Badge variant="default" class="gap-1">
          <Shield class="h-3 w-3" />
          Persistent
        </Badge>
      {:else}
        <Badge variant="destructive" class="gap-1">
          <ShieldAlert class="h-3 w-3" />
          Best-Effort
        </Badge>
      {/if}
    </div>

    <p class="text-xs text-muted-foreground">
      All data is stored locally in your browser using IndexedDB. Persistent storage
      prevents the browser from automatically clearing your data under low-disk
      conditions or after periods of inactivity (e.g. Safari's 7-day deletion rule).
    </p>

    {#if supported && persisted === false}
      <Separator />
      <Button
        onclick={handleRequestPersistence}
        disabled={requesting}
        variant="secondary"
        class="w-full gap-2"
      >
        <Shield class="h-4 w-4" />
        {requesting ? 'Requesting…' : 'Enable Persistent Storage'}
      </Button>
    {/if}

    {#if statusMessage}
      <p class="text-sm flex items-center gap-1 {persisted ? 'text-green-400' : 'text-destructive'}">
        {#if persisted}
          <Shield class="h-3 w-3 shrink-0" />
          <span>Success: {statusMessage}</span>
        {:else}
          <ShieldAlert class="h-3 w-3 shrink-0" />
          <span>Warning: {statusMessage}</span>
        {/if}
      </p>
    {/if}
  </CardContent>
</Card>
