import { PRICING, round2 } from './cart.ts'
import type { Order } from './types.ts'

export const STAGE_MS = 12000

export type OrderStage = {
  title: string
  detail: string
}

export const stages: OrderStage[] = [
  { title: 'Order confirmed', detail: 'The kitchen has accepted your order' },
  { title: 'Preparing your food', detail: 'Chefs are cooking it right now' },
  { title: 'On the way', detail: 'Dawit picked up your order' },
  { title: 'Around the corner', detail: 'Less than three minutes away' },
  { title: 'Delivered', detail: 'Left at your door' },
]

export type ClubTier = 'Silver' | 'Gold' | 'Platinum'

export type ClubMetrics = {
  deliveredCount: number
  savedTotal: number
  tier: ClubTier
  nextTier: 'Gold' | 'Platinum' | null
  targetOrders: number
  remainingOrders: number
  progressPct: number
}

const DEFAULT_RESTAURANT_FEES: Readonly<Record<string, number>> = {
  gursha: 0,
  nami: 0,
  luna: 45,
  forno: 0,
  field: 35,
  smoke: 60,
  petit: 0,
}

const BASE_MEMBER_PERK_ETB = 50

const orderDateFormatters = new Map<string, Intl.DateTimeFormat>()

function getOrderDateFormatter(locale: string): Intl.DateTimeFormat {
  const normalized = locale.trim() || 'en-US'
  let formatter = orderDateFormatters.get(normalized)
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat(normalized, {
        month: 'long',
        day: 'numeric',
      })
    } catch {
      formatter = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
      })
    }
    orderDateFormatters.set(normalized, formatter)
  }
  return formatter
}

/** Resolves the current 0..4 stage index (or -1 if canceled) for an order at `now`. */
export function resolveOrderStage(order: Order, now: number): number {
  if (order.status === 'delivered') return 4
  if (order.status === 'canceled') return -1
  const elapsed = Math.max(0, now - order.placedAt)
  return Math.min(4, Math.floor(elapsed / STAGE_MS))
}

/** Resolves elapsed stage-units (0..4+) for live tracking animations and ETA estimates. */
export function resolveOrderElapsed(order: Order, now: number): number {
  if (order.status === 'delivered') return 4
  if (order.status === 'canceled') return 0
  return Math.max(0, (now - order.placedAt) / STAGE_MS)
}

/** Computes remaining delivery ETA minutes from the restaurant window or Priority slot. */
export function computeOrderEtaMinutes(
  order: Order,
  restaurantMinutes: readonly [number, number],
  elapsed: number,
): number {
  const baseMinutes =
    order.deliveryOption === 1 ? 18 : Math.round((restaurantMinutes[0] + restaurantMinutes[1]) / 2)
  return Math.max(1, Math.ceil(baseMinutes * (1 - Math.max(0, elapsed) / 4)))
}

/**
 * Transitions active orders whose elapsed stage reached >= 4 to `delivered`
 * with `deliveredAt: order.placedAt + 4 * STAGE_MS`.
 * Returns the original array reference when no orders changed.
 */
export function reconcileActiveOrders(orders: Order[], now: number): Order[] {
  let changed = false
  const next = orders.map((order) => {
    if (order.status !== 'active') return order
    if (resolveOrderStage(order, now) < 4) return order
    changed = true
    return {
      ...order,
      status: 'delivered' as const,
      deliveredAt: order.placedAt + 4 * STAGE_MS,
    }
  })
  return changed ? next : orders
}

/** Computes Gebeta Club loyalty tier, progress, and real order savings from delivered orders. */
export function computeClubMetrics(
  orders: readonly Order[],
  restaurantFeeById?: Readonly<Record<string, number>>,
): ClubMetrics {
  const deliveredOrders = orders.filter((o) => o.status === 'delivered')
  const deliveredCount = deliveredOrders.length

  let savedTotal = 0
  for (const order of deliveredOrders) {
    const subtotal = order.items.reduce((sum, item) => sum + item.unit * item.qty, 0)
    const fee =
      restaurantFeeById?.[order.restaurantId] ?? DEFAULT_RESTAURANT_FEES[order.restaurantId] ?? 45
    const freeDeliverySaving = subtotal >= PRICING.freeDeliveryOver ? fee : 0
    const promoSaving = Math.max(0, order.discount ?? 0)
    const memberPerk = BASE_MEMBER_PERK_ETB
    savedTotal += freeDeliverySaving + promoSaving + memberPerk
  }

  let tier: ClubTier = 'Silver'
  let nextTier: 'Gold' | 'Platinum' | null = 'Gold'
  let targetOrders = 6

  if (deliveredCount >= 12) {
    tier = 'Platinum'
    nextTier = null
    targetOrders = 12
  } else if (deliveredCount >= 6) {
    tier = 'Gold'
    nextTier = 'Platinum'
    targetOrders = 12
  }

  const remainingOrders = Math.max(0, targetOrders - deliveredCount)
  const progressPct = Math.min(100, Math.round((deliveredCount / targetOrders) * 100))

  return {
    deliveredCount,
    savedTotal: round2(savedTotal),
    tier,
    nextTier,
    targetOrders,
    remainingOrders,
    progressPct,
  }
}

/** Computes the user's average rating across reviewed orders that recorded a rating. */
export function computeAverageRating(orders: readonly Order[]): number | null {
  const rated = orders.filter(
    (o): o is Order & { ratingGiven: number } =>
      typeof o.ratingGiven === 'number' &&
      Number.isFinite(o.ratingGiven) &&
      o.ratingGiven >= 1 &&
      o.ratingGiven <= 5,
  )
  if (rated.length === 0) return null
  const avg = rated.reduce((sum, o) => sum + o.ratingGiven, 0) / rated.length
  return Math.round(avg * 10) / 10
}

/** Formats a timestamp into a stable display date (e.g., "June 22"). */
export function formatOrderDate(ts: number, locale = 'en-US'): string {
  if (!Number.isFinite(ts)) return ''
  return getOrderDateFormatter(locale).format(new Date(ts))
}
