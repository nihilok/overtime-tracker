<script lang="ts">
  import { getContext } from 'svelte'

  let { value, children, class: className = '', ...restProps }: { value: string; children?: any; class?: string; [key: string]: any } = $props()
  const ctx = getContext<{ active: string }>('tabs')
  const isActive = $derived(ctx.active === value)
</script>

{#if isActive}
  <div
    role="tabpanel"
    class="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 {className}"
    {...restProps}
  >
    {@render children?.()}
  </div>
{/if}
