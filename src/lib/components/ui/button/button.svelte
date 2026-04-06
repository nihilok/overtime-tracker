<script lang="ts">
  import type { Props } from './index.js'
  import { buttonVariants } from './index.js'

  let { variant = 'default', size = 'default', class: className = '', children, onclick, ...restProps }: Props & { children?: any } = $props()
</script>

<button
  class={buttonVariants({ variant, size, className })}
  {onclick}
  {...restProps}
>
  {@render children?.()}
</button>
