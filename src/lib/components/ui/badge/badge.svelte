<script lang="ts">
  import { badgeVariants, type BadgeVariant } from './index.js'
  let { variant = 'default', class: className = '', children, ...restProps }: { variant?: BadgeVariant; class?: string; children?: any; [key: string]: any } = $props()
</script>
<div class={badgeVariants({ variant, className })} {...restProps}>
  {@render children?.()}
</div>
