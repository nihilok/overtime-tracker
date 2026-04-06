<script lang="ts">
  let { class: className = '', children, ...restProps }: { class?: string; children?: any; [key: string]: any } = $props()
</script>
<div class="flex items-center p-6 pt-0 {className}" {...restProps}>
  {@render children?.()}
</div>
