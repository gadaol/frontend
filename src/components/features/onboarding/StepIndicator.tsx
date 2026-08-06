interface Props {
  current: number
  total: number
}

export default function StepIndicator({ current, total }: Props) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1
        const done = idx < current
        const active = idx === current
        return (
          <div
            key={idx}
            className={`h-1 w-5 rounded-full ${
              active ? 'bg-primary' : done ? 'bg-primary/40' : 'bg-border'
            }`}
          />
        )
      })}
    </div>
  )
}
