interface Props {
  size?: number
  /** dark: 어두운(히어로) 배경 위, light: 밝은 배경 위 */
  variant?: 'dark' | 'light'
  className?: string
}

export default function Logo({ size = 48, variant = 'dark', className }: Props) {
  return (
    <div
      className={`flex items-center justify-center rounded-[13px] ${
        variant === 'dark' ? 'border border-white/20 bg-white/12' : 'bg-primary'
      } ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 28 28" fill="none">
        <path d="M3 24L23 4L18 24L12 17Z" fill="white" />
        <path d="M17 25L20 30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}
