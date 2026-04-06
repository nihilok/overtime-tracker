<script lang="ts">
  let { class: className = '', children, ...restProps }: { class?: string; children?: any; [key: string]: any } = $props()
</script>
<div
  class="bg-card border border-border rounded-lg shadow-lg p-6 mx-4 {className}"
  {...restProps}
>
  {@render children?.()}
</div>
