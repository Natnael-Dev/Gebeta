import type { CartItem, Dish, Restaurant } from './types.ts'

/** Prices are in Ethiopian Birr (ETB). */
export const PRICING = {
  freeDeliveryOver: 1000,
  priorityFee: 60,
  serviceRate: 0.05,
  serviceCap: 150,
  vatRate: 0.15,
  promoRate: 0.2,
  promoCap: 300,
} as const

export type CartTotals = {
  cartCount: number
  subtotal: number
  deliveryFee: number
  serviceFee: number
  tax: number
  discount: number
  total: number
}

export const round2 = (n: number): number => Math.round(n * 100) / 100

/** Builds a normalized cart line item with deterministic key and computed unit price. */
export function lineItem(
  d: Dish,
  qty: number,
  choice: string,
  extras: string[],
  note = '',
): CartItem {
  const safeQty = Math.max(1, Math.floor(qty))
  const normalizedNote = note.trim()
  const unit =
    d.price + d.extras.filter((e) => extras.includes(e.name)).reduce((sum, e) => sum + e.price, 0)
  const keyExtras = [...extras].sort().join(',')

  return {
    key: `${d.id}|${choice}|${keyExtras}|${normalizedNote}`,
    dishId: d.id,
    restaurantId: d.restaurantId,
    name: d.name,
    image: d.image,
    ...(d.thumb ? { thumb: d.thumb } : {}),
    unit,
    qty: safeQty,
    choice,
    extras: [...extras],
    note: normalizedNote,
    summary:
      [choice, ...extras].filter(Boolean).join(' · ') +
      (normalizedNote ? ` · “${normalizedNote}”` : ''),
  }
}

/** Returns true when the bag already holds items from a different restaurant. */
export function isCrossRestaurantCart(cart: readonly CartItem[], restaurantId: string): boolean {
  return cart.length > 0 && cart.some((item) => item.restaurantId !== restaurantId)
}

/** Computes bag item count and ETB price breakdown for checkout and cart UI. */
export function calculateTotals(
  cart: readonly CartItem[],
  cartRestaurant: Pick<Restaurant, 'fee'> | null | undefined,
  deliveryOption = 0,
  promo = '',
): CartTotals {
  if (cart.length === 0) {
    return {
      cartCount: 0,
      subtotal: 0,
      deliveryFee: 0,
      serviceFee: 0,
      tax: 0,
      discount: 0,
      total: 0,
    }
  }

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const subtotal = round2(cart.reduce((sum, item) => sum + item.unit * item.qty, 0))
  const baseDeliveryFee = subtotal >= PRICING.freeDeliveryOver ? 0 : (cartRestaurant?.fee ?? 0)
  const prioritySurcharge = deliveryOption === 1 ? PRICING.priorityFee : 0
  const deliveryFee = round2(baseDeliveryFee + prioritySurcharge)
  const serviceFee = round2(Math.min(subtotal * PRICING.serviceRate, PRICING.serviceCap))
  const tax = round2(subtotal * PRICING.vatRate)
  const normalizedPromo = promo.trim().toUpperCase()
  const discount =
    normalizedPromo === 'BITE20'
      ? round2(Math.min(PRICING.promoCap, subtotal * PRICING.promoRate))
      : 0
  const total = Math.max(0, round2(subtotal + deliveryFee + serviceFee + tax - discount))

  return {
    cartCount,
    subtotal,
    deliveryFee,
    serviceFee,
    tax,
    discount,
    total,
  }
}
