import { tv, type VariantProps } from 'tailwind-variants'
export { default as Badge } from './badge.svelte'

export const badgeVariants = tv({
  base: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  variants: {
    variant: {
      default: 'border-transparent bg-primary text-primary-foreground',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      destructive: 'border-transparent bg-destructive text-destructive-foreground',
      outline: 'text-foreground',
    }
  },
  defaultVariants: { variant: 'default' }
})

export type BadgeVariant = VariantProps<typeof badgeVariants>['variant']
