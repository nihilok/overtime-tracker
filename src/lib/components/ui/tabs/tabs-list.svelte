<script lang="ts">
  let { class: className = '', children, ...restProps }: { class?: string; children?: any; [key: string]: any } = $props()
</script>
<div
  role="tablist"
  class="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground {className}"
  {...restProps}
>
  {@render children?.()}
</div>
