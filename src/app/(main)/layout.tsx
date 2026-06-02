import { BottomNav } from '@/components/features/layout/BottomNav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col">
      <main className="flex flex-1 flex-col">{children}</main>
      <BottomNav />
    </div>
  )
}
