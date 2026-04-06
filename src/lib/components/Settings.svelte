<script lang="ts">
  import { onMount } from 'svelte'
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '$lib/components/ui/dialog/index.js'
  import { Shield, ShieldAlert, HardDrive, Upload } from 'lucide-svelte'
  import {
    isPersistenceSupported,
    getStoragePersisted,
    requestPersistentStorage,
  } from '$lib/storage.js'
  import { importAllEntries, exportAllEntries, type OvertimeEntry } from '$lib/db.js'

  /** `null` = not yet loaded, `false` = best-effort, `true` = persistent */
  let persisted = $state<boolean | null>(null)
  let supported = $state(false)
  let requesting = $state(false)
  let statusMessage = $state('')

  // JSON import state
  let fileInput = $state<HTMLInputElement | null>(null)
  let importDialogOpen = $state(false)
  let pendingEntries = $state<OvertimeEntry[]>([])
  let currentEntryCount = $state(0)
  let importStatus = $state('')
  let importing = $state(false)

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

  function handleFileChange(e: Event) {
    importStatus = ''
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !Array.isArray(parsed.entries)
        ) {
          importStatus = 'Invalid file: missing "entries" array.'
          return
        }
        const entries: OvertimeEntry[] = parsed.entries
        const valid = entries.every(
          (entry) =>
            typeof entry === 'object' &&
            entry !== null &&
            typeof entry.date === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
            typeof entry.hours === 'number'
        )
        if (!valid) {
          importStatus = 'Invalid file: one or more entries have an unexpected format.'
          return
        }
        pendingEntries = entries
        exportAllEntries().then((existing) => {
          currentEntryCount = existing.length
        })
        importDialogOpen = true
      } catch {
        importStatus = 'Could not parse file. Please select a valid JSON backup.'
      } finally {
        // Reset file input so the same file can be re-selected if needed
        if (fileInput) fileInput.value = ''
      }
    }
    reader.readAsText(file)
  }

  async function confirmImport() {
    importing = true
    importStatus = ''
    try {
      await importAllEntries(pendingEntries)
      importStatus = `✓ Imported ${pendingEntries.length} entries successfully.`
    } catch (err) {
      importStatus = `Error: ${String(err)}`
    } finally {
      importing = false
      importDialogOpen = false
      pendingEntries = []
    }
  }

  function cancelImport() {
    importDialogOpen = false
    pendingEntries = []
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

    <Separator />

    <!-- JSON import -->
    <div class="space-y-2">
      <p class="text-sm font-medium">Restore from backup</p>
      <p class="text-xs text-muted-foreground">
        Upload a previously exported JSON backup to restore your data.
        <strong>This will overwrite all existing entries.</strong>
      </p>
      <Button
        variant="secondary"
        class="w-full gap-2"
        onclick={() => fileInput?.click()}
        disabled={importing}
      >
        <Upload class="h-4 w-4" />
        Import JSON backup
      </Button>
      <input
        bind:this={fileInput}
        type="file"
        accept="application/json,.json"
        class="hidden"
        onchange={handleFileChange}
      />
    </div>

    {#if importStatus}
      <p class="text-sm {importStatus.startsWith('✓') ? 'text-green-400' : 'text-destructive'}">{importStatus}</p>
    {/if}
  </CardContent>
</Card>

<!-- Confirmation dialog -->
<Dialog bind:open={importDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Overwrite existing data?</DialogTitle>
    </DialogHeader>
    <p class="px-6 text-sm text-muted-foreground">
      This will permanently replace your current <strong>{currentEntryCount}</strong> {currentEntryCount === 1 ? 'entry' : 'entries'} with
      the <strong>{pendingEntries.length}</strong> {pendingEntries.length === 1 ? 'entry' : 'entries'} from the backup file.
      This action cannot be undone.
    </p>
    <DialogFooter class="px-6 pb-6">
      <Button variant="outline" onclick={cancelImport} disabled={importing}>Cancel</Button>
      <Button variant="destructive" onclick={confirmImport} disabled={importing}>
        {importing ? 'Importing…' : 'Overwrite & Import'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

