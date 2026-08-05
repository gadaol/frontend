'use client'

import { useState } from 'react'
import NicknameStep from './NicknameStep'
import TravelStyleStep from './TravelStyleStep'
import PhoneStep from './PhoneStep'

type Step = 1 | 2 | 3

interface Props {
  redirectTo: string | null
}

export default function OnboardingPage({ redirectTo }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [nickname, setNickname] = useState('')

  return (
    <div className="flex h-full flex-col">
      {step === 1 && (
        <NicknameStep
          nickname={nickname}
          onChange={setNickname}
          onNext={() => setStep(2)}
          redirectTo={redirectTo}
        />
      )}
      {step === 2 && (
        <TravelStyleStep nickname={nickname} onBack={() => setStep(1)} onNext={() => setStep(3)} />
      )}
      {step === 3 && (
        <PhoneStep nickname={nickname} onBack={() => setStep(2)} redirectTo={redirectTo} />
      )}
    </div>
  )
}
