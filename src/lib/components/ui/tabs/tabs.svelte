<script lang="ts">
  import { setContext } from 'svelte'

  let { value = $bindable(''), children, class: className = '' }: { value?: string; children?: any; class?: string } = $props()

  setContext('tabs', {
    get active() { return value },
    set active(v: string) { value = v }
  })
</script>
<div class={className}>
  {@render children?.()}
</div>
