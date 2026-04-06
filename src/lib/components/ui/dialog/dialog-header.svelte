<script lang="ts">
  let { class: className = '', children, ...restProps }: { class?: string; children?: any; [key: string]: any } = $props()
</script>
<div class="flex flex-col space-y-1.5 mb-4 {className}" {...restProps}>
  {@render children?.()}
</div>
