<script lang="ts">
  let { open = $bindable(false), children }: { open?: boolean; children?: any } = $props()
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm"
      onclick={() => (open = false)}
      role="presentation"
      aria-hidden="true"
    />
    <div class="relative z-10 w-full max-w-lg">
      {@render children?.()}
    </div>
  </div>
{/if}
