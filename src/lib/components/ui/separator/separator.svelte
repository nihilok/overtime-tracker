<script lang="ts">
  let { class: className = '', orientation = 'horizontal', ...restProps }: { class?: string; orientation?: 'horizontal' | 'vertical'; [key: string]: any } = $props()
</script>
<div
  role="separator"
  class="{orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]'} shrink-0 bg-border {className}"
  {...restProps}
></div>
