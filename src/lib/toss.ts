const TOSS_BASE = 'https://api.tosspayments.com'

function auth() {
  const secret = process.env.TOSS_SECRET_KEY!
  return 'Basic ' + Buffer.from(secret + ':').toString('base64')
}

export interface BillingKeyResponse {
  billingKey: string
  card: { company: string; number: string }
  customerKey: string
}

export interface PaymentResponse {
  paymentKey: string
  orderId: string
  status: string
  approvedAt: string
  totalAmount: number
}

export async function issueBillingKey(
  authKey: string,
  customerKey: string,
): Promise<BillingKeyResponse> {
  const res = await fetch(`${TOSS_BASE}/v1/billing/authorizations/issue`, {
    method: 'POST',
    headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ authKey, customerKey }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message ?? '빌링키 발급 실패')
  }
  return res.json()
}

export async function chargeBilling(
  billingKey: string,
  opts: { customerKey: string; amount: number; orderId: string; orderName: string },
): Promise<PaymentResponse> {
  const res = await fetch(`${TOSS_BASE}/v1/billing/${encodeURIComponent(billingKey)}`, {
    method: 'POST',
    headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message ?? '결제 실패')
  }
  return res.json()
}

export const PLAN_PRICE: Record<string, Record<string, number>> = {
  pro: { monthly: 3900, yearly: 29900 },
  plus: { monthly: 6900, yearly: 59900 },
}

export function planOrderName(plan: string, period: string): string {
  const planLabel = plan === 'pro' ? 'Pro' : 'Plus'
  const periodLabel = period === 'yearly' ? '연간' : '월간'
  return `가다로그 ${planLabel} ${periodLabel} 구독`
}
