import BottomNav from '@/components/common/BottomNav'
import AssistantButton from '@/components/features/ai/AssistantButton'
import AssistantPanel from '@/components/features/ai/AssistantPanel'

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-white">
      <main className="flex-1 overflow-y-auto pb-14">{children}</main>
      <BottomNav />
      <AssistantButton />
      <AssistantPanel />
    </div>
  )
}
