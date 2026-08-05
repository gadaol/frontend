import OnboardingPage from '@/components/features/onboarding/OnboardingPage'

interface Props {
  searchParams: Promise<{ redirect_to?: string }>
}

export default async function Page({ searchParams }: Props) {
  const { redirect_to } = await searchParams
  return <OnboardingPage redirectTo={redirect_to ?? null} />
}
