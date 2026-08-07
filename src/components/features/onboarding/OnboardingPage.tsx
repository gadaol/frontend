'use client'

import { useState } from 'react'
import PhoneStep from './PhoneStep'
import NicknameStep from './NicknameStep'
import TravelStyleStep from './TravelStyleStep'

type Step = 1 | 2 | 3

interface Props {
  redirectTo: string | null
}

export default function OnboardingPage({ redirectTo }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [nickname, setNickname] = useState('')

  return (
    <div className="flex h-full flex-col">
      {step === 1 && <PhoneStep onNext={() => setStep(2)} />}
      {step === 2 && (
        <NicknameStep
          nickname={nickname}
          onChange={setNickname}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <TravelStyleStep nickname={nickname} onBack={() => setStep(2)} redirectTo={redirectTo} />
      )}
    </div>
  )
}
