<script lang="ts">
  let { class: className = '', children, for: htmlFor, ...restProps }: { class?: string; children?: any; for?: string; [key: string]: any } = $props()
</script>
<label
  for={htmlFor}
  class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 {className}"
  {...restProps}
>
  {@render children?.()}
</label>
