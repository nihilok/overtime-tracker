<script lang="ts">
  let { class: className = '', children, ...restProps }: { class?: string; children?: any; [key: string]: any } = $props()
</script>
<h2 class="text-lg font-semibold {className}" {...restProps}>
  {@render children?.()}
</h2>
