import BottomNav from '@/components/common/BottomNav'

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* pb는 BottomNav 실제 높이(69px) + safe-area 합산 */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(69px + env(safe-area-inset-bottom))' }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
