import { cn } from '@/utils/cn'

export interface TabItem<T extends string> {
  key: T
  label: string
  count?: number
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (key: T) => void
  variant?: 'underline' | 'pill'
  /** underline 전용: 탭을 컨테이너 너비에 맞춰 균등 분배 (예: 여행 리스트 상단 탭) */
  fullWidth?: boolean
  className?: string
}

export default function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = 'underline',
  fullWidth = false,
  className,
}: TabsProps<T>) {
  if (variant === 'pill') {
    return (
      <div
        className={cn('flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden', className)}
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((item) => {
          const active = item.key === value
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={cn(
                'flex-shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors',
                active ? 'bg-primary text-white' : 'border-border bg-bg text-ink2 border',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('border-border flex border-b', fullWidth ? '' : 'gap-4 px-4', className)}>
      {items.map((item) => {
        const active = item.key === value
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              'relative py-3.5 text-[14px] font-semibold transition-colors',
              fullWidth ? 'flex-1' : '',
              active ? 'text-primary' : 'text-ink3',
            )}
          >
            {item.label}
            {typeof item.count === 'number' && item.count > 0 && (
              <span className={cn('ml-1 text-[11px]', active ? 'text-primary' : 'text-ink3')}>
                {item.count}
              </span>
            )}
            {active && (
              <span className="bg-primary absolute right-0 bottom-0 left-0 h-[2px] rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}
