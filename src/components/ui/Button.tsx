import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[opacity,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-primary hover:bg-primary-hover text-white',
        secondary: 'bg-bg text-ink border-border border',
        kakao: 'bg-kakao text-kakao-ink',
        google: 'bg-bg text-ink border-border border',
        email: 'bg-ink text-white',
        danger: 'bg-error text-white',
      },
      size: {
        sm: 'h-9 rounded-[8px] px-4 text-[13px]',
        default: 'h-[52px] rounded-xl px-6 text-[15px]',
        lg: 'h-[60px] rounded-[14px] px-8 text-[17px]',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export default function Button({
  className,
  variant,
  size,
  fullWidth,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  )
}
