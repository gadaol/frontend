'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import StepIndicator from './StepIndicator'

type PaceKey = 'relaxed' | 'fast' | 'planned' | 'spontaneous'
type PlaceKey = 'restaurant' | 'nature' | 'cafe' | 'landmark' | 'shopping' | 'activity'
type CompanionKey = 'solo' | 'couple' | 'family' | 'friends'

const PACE_KEYS: PaceKey[] = ['relaxed', 'fast', 'planned', 'spontaneous']
const PLACE_KEYS: PlaceKey[] = ['restaurant', 'nature', 'cafe', 'landmark', 'shopping', 'activity']
const COMPANION_KEYS: CompanionKey[] = ['solo', 'couple', 'family', 'friends']

interface Props {
  nickname: string
  onBack: () => void
  onNext: () => void
}

export default function TravelStyleStep({ onBack, onNext }: Props) {
  const t = useTranslations('onboarding')
  const [pace, setPace] = useState<PaceKey[]>([])
  const [places, setPlaces] = useState<PlaceKey[]>([])
  const [companion, setCompanion] = useState<CompanionKey[]>([])
  const [saving, setSaving] = useState(false)

  const toggle = <T,>(list: T[], item: T, setter: (v: T[]) => void) => {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
  }

  const handleSkip = () => onNext()

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({
            travel_pace: pace,
            travel_places: places,
            travel_companion: companion,
          })
          .eq('id', user.id)
      }
    } finally {
      setSaving(false)
      onNext()
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex h-8 w-8 items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M13 16l-6-6 6-6"
                stroke="var(--color-ink3)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <StepIndicator current={2} total={3} />
        </div>
        <button onClick={handleSkip} className="text-ink3 text-[14px] font-medium">
          {t('skip')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="mb-8">
          <div className="text-primary mb-1.5 text-[13px] font-medium">{t('step2Label')}</div>
          <h1 className="text-ink mb-2 text-[24px] leading-snug font-bold">{t('step2Title')}</h1>
          <p className="text-ink3 text-[14px] leading-relaxed">
            {t('step2Subtitle')
              .split('\n')
              .map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
          </p>
        </div>

        <ChipSection
          label={t('paceLabel')}
          options={PACE_KEYS}
          selected={pace}
          getLabel={(k) => t(`pace.${k}` as never)}
          onToggle={(v) => toggle(pace, v, setPace)}
        />
        <ChipSection
          label={t('placeLabel')}
          options={PLACE_KEYS}
          selected={places}
          getLabel={(k) => t(`place.${k}` as never)}
          onToggle={(v) => toggle(places, v, setPlaces)}
        />
        <ChipSection
          label={t('companionLabel')}
          options={COMPANION_KEYS}
          selected={companion}
          getLabel={(k) => t(`companion.${k}` as never)}
          onToggle={(v) => toggle(companion, v, setCompanion)}
        />

        <div className="pt-4">
          <Button onClick={handleSubmit} disabled={saving} fullWidth>
            {t('next')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ChipSection<T extends string>({
  label,
  options,
  selected,
  getLabel,
  onToggle,
}: {
  label: string
  options: T[]
  selected: T[]
  getLabel: (k: T) => string
  onToggle: (v: T) => void
}) {
  return (
    <div className="mb-6">
      <div className="text-ink mb-2 text-[13px] font-medium">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((key) => {
          const active = selected.includes(key)
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className={`h-9 rounded-full border-[1.5px] px-[14px] text-[13px] font-medium transition-colors ${
                active
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-border text-ink2 bg-white'
              }`}
            >
              {getLabel(key)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
