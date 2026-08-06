import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[12px] font-semibold',
  {
    variants: {
      variant: {
        blue: 'bg-primary-light text-primary',
        green: 'bg-success-light text-success-ink',
        orange: 'bg-warning-light text-warning-ink',
        gray: 'bg-bg2 text-ink2',
        purple: 'bg-accent-light text-accent',
        red: 'bg-error-light text-error',
      },
    },
    defaultVariants: {
      variant: 'blue',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export default function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
