<script lang="ts">
  import { getContext } from 'svelte'

  let { value, children, class: className = '', ...restProps }: { value: string; children?: any; class?: string; [key: string]: any } = $props()
  const ctx = getContext<{ active: string }>('tabs')
  const isActive = $derived(ctx.active === value)
</script>
<button
  role="tab"
  aria-selected={isActive}
  class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 {isActive ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground'} {className}"
  onclick={() => { ctx.active = value }}
  {...restProps}
>
  {@render children?.()}
</button>
