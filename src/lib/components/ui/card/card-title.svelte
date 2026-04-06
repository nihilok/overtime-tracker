<script lang="ts">
  let { class: className = '', children, ...restProps }: { class?: string; children?: any; [key: string]: any } = $props()
</script>
<h3 class="text-2xl font-semibold leading-none tracking-tight {className}" {...restProps}>
  {@render children?.()}
</h3>
