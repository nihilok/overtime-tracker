<script lang="ts">
  let { class: className = '', children, ...restProps }: { class?: string; children?: any; [key: string]: any } = $props()
</script>
<div class="flex justify-end gap-2 mt-6 {className}" {...restProps}>
  {@render children?.()}
</div>
