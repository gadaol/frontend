'use client'

import { useState, useEffect, useRef } from 'react'
import { getCategoryInfoByLabel } from '@/utils/placeCategory'
import type { TripExpense } from '../page'

type ItineraryItemDB = {
  id: string
  item_type: string
  memo: string | null
  visit_time: string | null
  places?: {
    name: string
    address: string | null
    place_categories: { name: string } | null
  } | null
}

const EXPENSE_CATEGORIES = ['식비', '카페', '숙박', '교통', '입장료', '쇼핑', '기타'] as const
type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

type PendingExpense = { tempId: string; amount: number; category: string; note: string | null }

interface Props {
  item: ItineraryItemDB
  expenses: TripExpense[]
  onClose: () => void
  onMemoSave: (itemId: string, memo: string) => void
  onAddExpense: (amount: number, category: string, note: string) => Promise<string | null>
  onRemoveExpense: (expenseId: string) => void
}

export default function ItemDetailSheet({
  item,
  expenses,
  onClose,
  onMemoSave,
  onAddExpense,
  onRemoveExpense,
}: Props) {
  const [memo, setMemo] = useState(item.memo ?? '')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('기타')
  const [expenseNote, setExpenseNote] = useState('')
  const [addingExpense, setAddingExpense] = useState(false)
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([])
  const memoSavedRef = useRef(item.memo ?? '')
  const sheetRef = useRef<HTMLDivElement>(null)

  const isPlace = item.item_type === 'place'
  const catLabel = item.places?.place_categories?.name ?? '기타'
  const category = getCategoryInfoByLabel(catLabel)
  const Icon = category.icon

  const allExpenses = [
    ...expenses,
    ...pendingExpenses.map((p) => ({
      id: p.tempId,
      amount: p.amount,
      category: p.category,
      note: p.note,
      item_id: item.id,
      day_id: null,
    })),
  ]
  const totalAmount = allExpenses.reduce((sum, e) => sum + e.amount, 0)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMemo(item.memo ?? '')
    memoSavedRef.current = item.memo ?? ''
  }, [item.id, item.memo])

  function handleMemoBlur() {
    if (memo !== memoSavedRef.current) {
      memoSavedRef.current = memo
      onMemoSave(item.id, memo)
    }
  }

  async function handleAddExpense() {
    const amount = parseInt(expenseAmount.replace(/[^0-9]/g, ''), 10)
    if (!amount || amount <= 0) return

    const tempId = `pending-${Date.now()}`
    const pending: PendingExpense = {
      tempId,
      amount,
      category: expenseCategory,
      note: expenseNote || null,
    }

    // 옵티미스틱 업데이트: 즉시 UI에 반영
    setPendingExpenses((prev) => [...prev, pending])
    setExpenseAmount('')
    setExpenseNote('')
    setExpenseCategory('기타')
    setShowExpenseForm(false)
    setAddingExpense(true)

    const id = await onAddExpense(amount, expenseCategory, expenseNote)

    // 서버 응답 후 pending 제거 (성공이면 parent expenses에 이미 반영됨)
    setPendingExpenses((prev) => prev.filter((p) => p.tempId !== tempId))
    if (!id) {
      // 실패 시 롤백
      setPendingExpenses((prev) => prev.filter((p) => p.tempId !== tempId))
    }
    setAddingExpense(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => {
          handleMemoBlur()
          onClose()
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-white"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
      >
        {/* Handle */}
        <div className="sticky top-0 flex justify-center bg-white pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* 헤더 */}
        {isPlace ? (
          <div className="flex items-center gap-3 px-4 pt-3 pb-4">
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${category.bg}`}
            >
              <Icon size={24} className={category.color} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-ink truncate text-[16px] font-bold">
                {item.places?.name ?? '장소'}
              </p>
              <p className="text-[11px] font-semibold" style={{ color: category.hex }}>
                {category.hashLabel}
              </p>
            </div>
            <button onClick={onClose} className="text-ink3 p-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M4 4l10 10M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 pt-3 pb-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect
                  x="3"
                  y="3"
                  width="16"
                  height="16"
                  rx="3"
                  stroke="#F59E0B"
                  strokeWidth="1.6"
                />
                <path
                  d="M7 8h8M7 11h6M7 14h4"
                  stroke="#F59E0B"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-ink flex-1 text-[16px] font-bold">메모</p>
            <button onClick={onClose} className="text-ink3 p-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M4 4l10 10M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}

        {/* 구분선 */}
        <div className="border-border border-t" />

        {/* 메모 섹션 */}
        <div className="px-4 pt-4">
          <p className="text-ink3 mb-2 text-[12px] font-semibold tracking-wide uppercase">메모</p>
          <textarea
            className="border-border text-ink focus:border-primary w-full resize-none rounded-xl border bg-gray-50 px-3 py-2.5 text-[14px] transition-colors outline-none"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={handleMemoBlur}
            rows={3}
            placeholder={isPlace ? '이 장소에 대한 메모를 남겨보세요' : '메모를 입력하세요'}
          />
        </div>

        {/* 경비 섹션 */}
        <div className="mt-4 px-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-ink3 text-[12px] font-semibold tracking-wide uppercase">경비</p>
              {totalAmount > 0 && (
                <span className="text-ink2 text-[12px] font-bold">
                  {totalAmount.toLocaleString()}원
                </span>
              )}
            </div>
            <button
              onClick={() => setShowExpenseForm((v) => !v)}
              className={`text-[13px] font-semibold transition-colors ${showExpenseForm ? 'text-ink3' : 'text-primary'}`}
            >
              {showExpenseForm ? '− 숨기기' : '+ 추가'}
            </button>
          </div>

          {/* 경비 목록 */}
          {allExpenses.length > 0 && (
            <div className="border-border mb-3 overflow-hidden rounded-xl border">
              {allExpenses.map((expense, i) => {
                const isPending = expense.id.startsWith('pending-')
                return (
                  <div
                    key={expense.id}
                    className={`flex items-center gap-3 px-3 py-2.5 ${
                      i > 0 ? 'border-border border-t' : ''
                    } ${isPending ? 'opacity-60' : ''} bg-white`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-ink2 text-[12px] font-semibold">
                        {expense.category}
                      </span>
                      {expense.note && (
                        <span className="text-ink3 ml-1.5 text-[11px]">{expense.note}</span>
                      )}
                    </div>
                    <span className="text-ink flex-shrink-0 text-[13px] font-bold">
                      {expense.amount.toLocaleString()}원
                    </span>
                    {!isPending && (
                      <button
                        onClick={() => onRemoveExpense(expense.id)}
                        className="text-ink3 flex-shrink-0 p-1 hover:text-red-500"
                        aria-label="경비 삭제"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M3 3l8 8M11 3L3 11"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* 경비 추가 폼 */}
          {showExpenseForm && (
            <div className="border-border mb-4 rounded-xl border bg-gray-50 p-3">
              {/* 카테고리 */}
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setExpenseCategory(cat)}
                    className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors ${
                      expenseCategory === cat
                        ? 'bg-primary text-white'
                        : 'border-border text-ink2 border bg-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* 금액 입력 */}
              <div className="border-border mb-2 flex items-center gap-1 rounded-xl border bg-white px-3 py-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="금액"
                  className="text-ink min-w-0 flex-1 bg-transparent text-[14px] outline-none"
                  autoFocus
                />
                <span className="text-ink3 flex-shrink-0 text-[13px]">원</span>
              </div>

              {/* 메모 입력 */}
              <div className="border-border mb-3 flex items-center gap-1 rounded-xl border bg-white px-3 py-2">
                <input
                  type="text"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  placeholder="메모 (선택)"
                  className="text-ink min-w-0 flex-1 bg-transparent text-[14px] outline-none"
                />
              </div>

              <button
                onClick={handleAddExpense}
                disabled={addingExpense || !expenseAmount}
                className="bg-primary w-full rounded-xl py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
              >
                경비 추가
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
