<script lang="ts">
  import { onMount } from 'svelte'
  import { today } from '$lib/db.js'
  import { requestPersistentStorage } from '$lib/storage.js'
  import DateNavigator from '$lib/components/DateNavigator.svelte'
  import QuickEntry from '$lib/components/QuickEntry.svelte'
  import BulkAdd from '$lib/components/BulkAdd.svelte'
  import RecentEntries from '$lib/components/RecentEntries.svelte'
  import ExportPanel from '$lib/components/ExportPanel.svelte'
  import Settings from '$lib/components/Settings.svelte'
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { Clock } from 'lucide-svelte'

  let selectedDate = $state(today())
  let activeTab = $state('track')

  onMount(async () => {
    // Silently request persistent storage on startup so the browser can grant
    // it automatically (e.g. when the PWA is installed).
    requestPersistentStorage().catch((err) => {
      console.error('Failed to request persistent storage:', err)
    })
  })
</script>

<div class="min-h-screen bg-background">
  <!-- Header -->
  <header class="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
    <div class="mx-auto flex h-14 max-w-lg items-center gap-2 px-4">
      <Clock class="h-5 w-5 text-primary" />
      <h1 class="text-lg font-semibold">Overtime Tracker</h1>
    </div>
  </header>

  <main class="mx-auto max-w-lg px-4 py-6 space-y-6">
    <Tabs bind:value={activeTab} class="w-full">
      <TabsList class="w-full">
        <TabsTrigger value="track" class="flex-1">Track</TabsTrigger>
        <TabsTrigger value="bulk" class="flex-1">Bulk</TabsTrigger>
        <TabsTrigger value="export" class="flex-1">Export</TabsTrigger>
        <TabsTrigger value="settings" class="flex-1">Settings</TabsTrigger>
      </TabsList>

      <!-- TRACK TAB -->
      <TabsContent value="track" class="space-y-4">
        <DateNavigator bind:selectedDate />
        <QuickEntry date={selectedDate} />
        <Separator />
        <RecentEntries />
      </TabsContent>

      <!-- BULK TAB -->
      <TabsContent value="bulk" class="space-y-4">
        <BulkAdd onSuccess={() => {}} />
      </TabsContent>

      <!-- EXPORT TAB -->
      <TabsContent value="export" class="space-y-4">
        <ExportPanel />
      </TabsContent>

      <!-- SETTINGS TAB -->
      <TabsContent value="settings" class="space-y-4">
        <Settings />
      </TabsContent>
    </Tabs>
  </main>
</div>
