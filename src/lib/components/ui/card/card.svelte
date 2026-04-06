<script lang="ts">
  let { class: className = '', children, ...restProps }: { class?: string; children?: any; [key: string]: any } = $props()
</script>
<div class="rounded-lg border bg-card text-card-foreground shadow-sm {className}" {...restProps}>
  {@render children?.()}
</div>
