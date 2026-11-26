import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { calculateTotals, isCrossRestaurantCart, lineItem, PRICING } from '../src/domain/cart.ts'
import {
  computeAverageRating,
  computeClubMetrics,
  computeOrderEtaMinutes,
  formatOrderDate,
  reconcileActiveOrders,
  resolveOrderStage,
  STAGE_MS,
  stages,
} from '../src/domain/orders.ts'
import {
  DEFAULT_NOTICES,
  DEFAULT_PROFILE,
  LEGACY_STORAGE_KEY,
  loadPersistedState,
  sanitizeMediaUrl,
  sanitizePersistedState,
  savePersistedState,
  STORAGE_KEY,
  type StorageLike,
} from '../src/domain/storage.ts'
import type { CartItem, Dish, Order } from '../src/domain/types.ts'
import {
  detectCardBrand,
  getUpcomingScheduleSlots,
  isValidLuhn,
  validateCard,
  validateProfile,
  validatePromo,
} from '../src/domain/validation.ts'
import {
  createT,
  en,
  getLanguageMeta,
  getLocalizedFaqs,
  LANGUAGES,
  loadLocale,
  plural,
  TRANSLATION_KEYS,
  type LocaleDictionary,
} from '../src/i18n.ts'
import am from '../src/locales/am.ts'
import ar from '../src/locales/ar.ts'
import fr from '../src/locales/fr.ts'
import om from '../src/locales/om.ts'
import ti from '../src/locales/ti.ts'

const sampleDishA: Dish = {
  id: 'luna-gamberi',
  restaurantId: 'luna',
  name: 'Spaghetti ai Gamberi',
  desc: 'Red Sea prawns',
  price: 800,
  image: '/assets/gamberi.webp',
  cal: 780,
  option: { title: 'Pasta', choices: ['Spaghetti', 'Linguine'] },
  extras: [
    { name: 'Extra prawns', price: 200 },
    { name: 'Pangrattato', price: 60 },
  ],
}

const sampleDishB: Dish = {
  id: 'gursha-doro',
  restaurantId: 'gursha',
  name: 'Doro Wot',
  desc: 'Berbere chicken stew',
  price: 780,
  image: '/assets/doro.webp',
  cal: 820,
  option: { title: 'Spice level', choices: ['Medium', 'Hot'] },
  extras: [{ name: 'Extra egg', price: 50 }],
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  const item = lineItem(sampleDishA, 1, 'Spaghetti', [])
  return {
    id: 'GB-1001',
    restaurantId: 'luna',
    items: [item],
    total: 1005,
    placedAt: 100_000,
    status: 'active',
    date: 'November 26',
    ...overrides,
  }
}

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & {
  dump: () => Record<string, string>
} {
  const data = new Map<string, string>(Object.entries(initial))
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    dump: () => Object.fromEntries(data.entries()),
  }
}

describe('cart domain (pricing, line items, cross-restaurant guard)', () => {
  it('computes unit price, extras, sorted deterministic key, and summary in lineItem', () => {
    const item = lineItem(
      sampleDishA,
      2,
      'Linguine',
      ['Pangrattato', 'Extra prawns'],
      '  no chili  ',
    )
    assert.equal(item.unit, 1060)
    assert.equal(item.qty, 2)
    assert.equal(item.note, 'no chili')
    assert.equal(item.key, 'luna-gamberi|Linguine|Extra prawns,Pangrattato|no chili')
    assert.equal(item.summary, 'Linguine · Pangrattato · Extra prawns · “no chili”')
    assert.equal(item.thumb, undefined)

    const withThumb = lineItem(
      { ...sampleDishA, thumb: '/assets/thumbs/gamberi.webp' },
      1,
      'Spaghetti',
      [],
    )
    assert.equal(withThumb.thumb, '/assets/thumbs/gamberi.webp')
  })

  it('returns zeroed totals for an empty cart', () => {
    assert.deepEqual(calculateTotals([], { fee: 45 }, 1, 'BITE20'), {
      cartCount: 0,
      subtotal: 0,
      deliveryFee: 0,
      serviceFee: 0,
      tax: 0,
      discount: 0,
      total: 0,
    })
  })

  it('calculates delivery fee, priority fee, service fee, VAT, and free delivery threshold', () => {
    const belowFree = [lineItem(sampleDishA, 1, 'Spaghetti', [])] // 800 ETB < 1000
    const resBelow = calculateTotals(belowFree, { fee: 45 }, 0, '')
    assert.equal(resBelow.cartCount, 1)
    assert.equal(resBelow.subtotal, 800)
    assert.equal(resBelow.deliveryFee, 45)
    assert.equal(resBelow.serviceFee, 40) // 5% of 800
    assert.equal(resBelow.tax, 120) // 15% of 800
    assert.equal(resBelow.discount, 0)
    assert.equal(resBelow.total, 1005)

    // Above freeDeliveryOver (1000), base delivery fee waived, priority fee still applies
    const aboveFree = [lineItem(sampleDishA, 2, 'Spaghetti', ['Extra prawns'])] // 2000 ETB
    const resPriority = calculateTotals(aboveFree, { fee: 45 }, 1, '')
    assert.equal(resPriority.subtotal, 2000)
    assert.equal(resPriority.deliveryFee, PRICING.priorityFee)
    assert.equal(resPriority.serviceFee, 100)
    assert.equal(resPriority.tax, 300)
    assert.equal(resPriority.total, 2460)
  })

  it('caps service fee at Br 150 and BITE20 promo discount at Br 300', () => {
    const highValue = [lineItem(sampleDishA, 4, 'Spaghetti', ['Extra prawns'])] // 4000 ETB
    const totals = calculateTotals(highValue, { fee: 45 }, 0, 'BITE20')
    assert.equal(totals.subtotal, 4000)
    assert.equal(totals.deliveryFee, 0)
    assert.equal(totals.serviceFee, PRICING.serviceCap) // 150
    assert.equal(totals.tax, 600)
    assert.equal(totals.discount, PRICING.promoCap) // 300 (capped from 800)
    assert.equal(totals.total, 4000 + 0 + 150 + 600 - 300)
  })

  it('ignores unknown promo codes in calculateTotals', () => {
    const items = [lineItem(sampleDishA, 1, 'Spaghetti', [])]
    const totals = calculateTotals(items, { fee: 45 }, 0, 'NOTREAL')
    assert.equal(totals.discount, 0)
  })

  it('detects cross-restaurant bags cleanly', () => {
    const empty: CartItem[] = []
    assert.equal(isCrossRestaurantCart(empty, 'luna'), false)

    const lunaCart = [lineItem(sampleDishA, 1, 'Spaghetti', [])]
    assert.equal(isCrossRestaurantCart(lunaCart, 'luna'), false)
    assert.equal(isCrossRestaurantCart(lunaCart, 'gursha'), true)
  })
})

describe('promo validation', () => {
  it('requires non-empty cart and validates BITE20 case-insensitively', () => {
    assert.equal(validatePromo('BITE20', []).valid, false)

    const cart = [lineItem(sampleDishB, 1, 'Hot', [])]
    const invalid = validatePromo('SAVE50', cart)
    assert.equal(invalid.valid, false)
    assert.equal(invalid.code, '')

    const valid = validatePromo('  bite20 ', cart)
    assert.deepEqual(valid, { valid: true, code: 'BITE20', error: '' })
  })
})

describe('orders domain (stage progression, auto-reconciliation, club metrics)', () => {
  it('uses 12000ms stage intervals and resolves order stages accurately', () => {
    assert.equal(STAGE_MS, 12000)
    assert.equal(stages.length, 5)

    const active = makeOrder({ placedAt: 1000, status: 'active' })
    assert.equal(resolveOrderStage(active, 500), 0) // clock skew safe
    assert.equal(resolveOrderStage(active, 1000), 0)
    assert.equal(resolveOrderStage(active, 1000 + STAGE_MS), 1)
    assert.equal(resolveOrderStage(active, 1000 + 2 * STAGE_MS), 2)
    assert.equal(resolveOrderStage(active, 1000 + 3 * STAGE_MS), 3)
    assert.equal(resolveOrderStage(active, 1000 + 4 * STAGE_MS), 4)
    assert.equal(resolveOrderStage(active, 1000 + 10 * STAGE_MS), 4)

    assert.equal(resolveOrderStage(makeOrder({ status: 'delivered' }), 0), 4)
    assert.equal(resolveOrderStage(makeOrder({ status: 'canceled' }), 0), -1)
  })

  it('auto-transitions elapsed active orders to delivered with exact deliveredAt', () => {
    const activeEarly = makeOrder({ id: 'A1', placedAt: 10_000, status: 'active' })
    const activeDone = makeOrder({ id: 'A2', placedAt: 10_000, status: 'active' })
    const canceled = makeOrder({ id: 'C1', placedAt: 10_000, status: 'canceled' })

    const beforeDone = 10_000 + 3 * STAGE_MS + 5000
    const unchanged = reconcileActiveOrders([activeEarly, canceled], beforeDone)
    assert.equal(unchanged[0].status, 'active')
    assert.equal(unchanged[1].status, 'canceled')
    assert.equal(unchanged.length, 2)

    // Same reference when nothing transitions
    const sameRef = [activeEarly, canceled]
    assert.equal(reconcileActiveOrders(sameRef, beforeDone), sameRef)

    const atDone = 10_000 + 4 * STAGE_MS
    const reconciled = reconcileActiveOrders([activeDone, canceled], atDone)
    assert.equal(reconciled[0].status, 'delivered')
    assert.equal(reconciled[0].deliveredAt, 10_000 + 4 * STAGE_MS)
    assert.equal(reconciled[1].status, 'canceled')
  })

  it('computes real Gebeta Club metrics across Silver, Gold, and Platinum tiers', () => {
    assert.deepEqual(computeClubMetrics([]), {
      deliveredCount: 0,
      savedTotal: 0,
      tier: 'Silver',
      nextTier: 'Gold',
      targetOrders: 6,
      remainingOrders: 6,
      progressPct: 0,
    })

    const fourOrders: Order[] = [
      // Luna subtotal 1000 >= freeDeliveryOver -> saves fee (45) + discount (200) + base perk (50) = 295
      makeOrder({
        id: '1',
        restaurantId: 'luna',
        items: [lineItem(sampleDishA, 1, 'Spaghetti', ['Extra prawns'])],
        status: 'delivered',
        discount: 200,
      }),
      // Gursha fee 0, discount 0 -> base perk (50)
      makeOrder({
        id: '2',
        restaurantId: 'gursha',
        items: [lineItem(sampleDishB, 1, 'Hot', [])],
        status: 'delivered',
      }),
      makeOrder({ id: '3', restaurantId: 'gursha', status: 'delivered' }),
      makeOrder({ id: '4', restaurantId: 'gursha', status: 'delivered' }),
      // Active & canceled orders must not count
      makeOrder({ id: '5', status: 'active', discount: 100 }),
      makeOrder({ id: '6', status: 'canceled', discount: 100 }),
    ]

    const silver = computeClubMetrics(fourOrders, { luna: 45, gursha: 0 })
    assert.equal(silver.deliveredCount, 4)
    assert.equal(silver.tier, 'Silver')
    assert.equal(silver.nextTier, 'Gold')
    assert.equal(silver.targetOrders, 6)
    assert.equal(silver.remainingOrders, 2)
    assert.equal(silver.progressPct, 67)
    // Order 1 (45 + 200 + 50) + Order 2 (50) + Order 3 (50) + Order 4 (50) = 445
    assert.equal(silver.savedTotal, 445)

    const sixDelivered = Array.from({ length: 6 }, (_, i) =>
      makeOrder({ id: `g-${i}`, status: 'delivered' }),
    )
    const gold = computeClubMetrics(sixDelivered)
    assert.equal(gold.tier, 'Gold')
    assert.equal(gold.nextTier, 'Platinum')
    assert.equal(gold.targetOrders, 12)
    assert.equal(gold.remainingOrders, 6)
    assert.equal(gold.progressPct, 50)

    const fifteenDelivered = Array.from({ length: 15 }, (_, i) =>
      makeOrder({ id: `p-${i}`, status: 'delivered' }),
    )
    const platinum = computeClubMetrics(fifteenDelivered)
    assert.equal(platinum.tier, 'Platinum')
    assert.equal(platinum.nextTier, null)
    assert.equal(platinum.remainingOrders, 0)
    assert.equal(platinum.progressPct, 100)
  })

  it('computes average user rating and formats order dates', () => {
    assert.equal(computeAverageRating([]), null)
    assert.equal(
      computeAverageRating([
        makeOrder({ id: '1', reviewed: true, ratingGiven: 5 }),
        makeOrder({ id: '2', reviewed: true, ratingGiven: 4 }),
        makeOrder({ id: '3', reviewed: true }),
      ]),
      4.5,
    )
    const sampleTs = Date.UTC(2026, 5, 22, 12, 0)
    const formatted = formatOrderDate(sampleTs)
    assert.equal(formatted, 'June 22')
    const formattedFr = formatOrderDate(sampleTs, 'fr')
    assert.ok(formattedFr.includes('22'))
    assert.notEqual(formattedFr, 'June 22')
  })

  it('computes order ETA minutes using restaurant window and priority override', () => {
    const standardOrder = makeOrder({ deliveryOption: 0 })
    assert.equal(computeOrderEtaMinutes(standardOrder, [20, 30], 0), 25)
    assert.equal(computeOrderEtaMinutes(standardOrder, [20, 30], 2), 13)
    assert.equal(computeOrderEtaMinutes(standardOrder, [20, 30], 4), 1)

    const priorityOrder = makeOrder({ deliveryOption: 1 })
    assert.equal(computeOrderEtaMinutes(priorityOrder, [30, 45], 0), 18)
    assert.equal(computeOrderEtaMinutes(priorityOrder, [30, 45], 2), 9)
    assert.equal(computeOrderEtaMinutes(priorityOrder, [30, 45], 5), 1)
  })
})

describe('validation domain (card, Luhn, profile, schedule slots)', () => {
  it('rejects all-zero PAN, short/long PANs, and invalid Luhn checksums', () => {
    assert.equal(isValidLuhn('0000 0000 0000 0000'), false)
    assert.equal(isValidLuhn('000000000000000'), false)
    assert.equal(isValidLuhn('4242 4242 4242 42'), false) // 14 digits
    assert.equal(isValidLuhn('42424242424242424242'), false) // 20 digits
    assert.equal(isValidLuhn('4242 4242 4242 4241'), false) // bad Luhn
    assert.equal(isValidLuhn('4242 4242 4242 4242'), true)
    assert.equal(isValidLuhn('3782 8224 6310 005'), true) // Amex 15 digits
  })

  it('detects card brands and validates card fields against reference date', () => {
    assert.equal(detectCardBrand('4242 4242'), 'Visa')
    assert.equal(detectCardBrand('5555 5555'), 'Mastercard')
    assert.equal(detectCardBrand('2221 0000'), 'Mastercard')
    assert.equal(detectCardBrand('3782 8224'), 'Amex')
    assert.equal(detectCardBrand('6011 0000'), 'Card')

    const refNow = new Date(2026, 10, 26, 12, 0, 0) // Nov 2026

    const zeroCard = validateCard(
      { name: 'Natnael Tezazu', number: '0000 0000 0000 0000', exp: '12/28', cvc: '123' },
      refNow,
    )
    assert.equal(zeroCard.valid, false)
    assert.ok(zeroCard.errors.number)

    const expiredCard = validateCard(
      { name: 'Natnael Tezazu', number: '4242 4242 4242 4242', exp: '10/26', cvc: '123' },
      refNow,
    )
    assert.equal(expiredCard.valid, false)
    assert.ok(expiredCard.errors.exp)

    const sameMonthCard = validateCard(
      { name: 'Natnael Tezazu', number: '4242 4242 4242 4242', exp: '11/26', cvc: '123' },
      refNow,
    )
    assert.equal(sameMonthCard.valid, true)
    assert.equal(sameMonthCard.brand, 'Visa')
    assert.equal(sameMonthCard.last4, '4242')
  })

  it('validates profile fields properly', () => {
    const bad = validateProfile({ name: 'A', email: 'bad-email', phone: '123' })
    assert.equal(bad.valid, false)
    assert.ok(bad.errors.name)
    assert.ok(bad.errors.email)
    assert.ok(bad.errors.phone)

    const good = validateProfile(DEFAULT_PROFILE)
    assert.equal(good.valid, true)
  })

  it('supports localized validation errors when optional translator is provided', () => {
    const tAm = createT(am)
    const cardRes = validateCard(
      { name: '', number: '0000', exp: 'bad', cvc: '1' },
      new Date(2026, 10, 26),
      tAm,
    )
    assert.equal(cardRes.valid, false)
    assert.equal(cardRes.errors.number, tAm('validation.cardNumber'))
    assert.notEqual(cardRes.errors.number, en['validation.cardNumber'])
    assert.equal(cardRes.errors.exp, tAm('validation.cardExp'))
    assert.equal(cardRes.errors.cvc, tAm('validation.cardCvc'))
    assert.equal(cardRes.errors.name, tAm('validation.cardName'))

    const profileRes = validateProfile({ name: 'A', email: 'x', phone: '1' }, tAm)
    assert.equal(profileRes.errors.name, tAm('validation.profileName'))
    assert.equal(profileRes.errors.email, tAm('validation.profileEmail'))
    assert.equal(profileRes.errors.phone, tAm('validation.profilePhone'))

    const promoRes = validatePromo('NOPE', [lineItem(sampleDishA, 1, 'Spaghetti', [])], tAm)
    assert.equal(promoRes.valid, false)
    assert.equal(promoRes.error, tAm('validation.promoInvalid'))
  })

  it('generates upcoming 30-min schedule slots >= 45 min in the future', () => {
    // 2:00 PM + 45m = 2:45 PM -> first slot 3:00 PM
    const at2pm = new Date(2026, 10, 26, 14, 0, 0, 0)
    assert.deepEqual(getUpcomingScheduleSlots(at2pm, 4), [
      '3:00 PM',
      '3:30 PM',
      '4:00 PM',
      '4:30 PM',
    ])

    // 2:15 PM + 45m = 3:00 PM exact -> first slot 3:00 PM
    const at215pm = new Date(2026, 10, 26, 14, 15, 0, 0)
    assert.equal(getUpcomingScheduleSlots(at215pm, 1)[0], '3:00 PM')

    // 2:16 PM + 45m = 3:01 PM -> rounds up to 3:30 PM (never in the past)
    const at216pm = new Date(2026, 10, 26, 14, 16, 0, 0)
    assert.equal(getUpcomingScheduleSlots(at216pm, 1)[0], '3:30 PM')

    // Late night rollover across midnight: 11:30 PM + 45m = 12:15 AM -> 12:30 AM
    const atLate = new Date(2026, 10, 26, 23, 30, 0, 0)
    assert.deepEqual(getUpcomingScheduleSlots(atLate, 3), ['12:30 AM', '1:00 AM', '1:30 AM'])
  })
})

describe('storage domain (sanitization, migration, PAN/CVC scrubbing)', () => {
  it('migrates legacy Morsel profile names and email to Natnael Tezazu', () => {
    const migratedA = sanitizePersistedState({
      profile: {
        name: 'Selam Tadesse',
        email: 'selam.tadesse@example.com',
        phone: '+251 91 123 4548',
        avatar: '',
      },
    })
    assert.equal(migratedA.profile?.name, 'Natnael Tezazu')
    assert.equal(migratedA.profile?.email, 'natnael.tezazu@example.com')

    const migratedB = sanitizePersistedState({
      profile: {
        name: 'Selam Tesfaye',
        email: 'selam.tesfaye@example.com',
        phone: '+251 91 123 4548',
        avatar: 'javascript:alert(1)',
      },
    })
    assert.equal(migratedB.profile?.name, 'Natnael Tezazu')
    assert.equal(migratedB.profile?.email, 'natnael.tezazu@example.com')
    assert.equal(migratedB.profile?.avatar, '')

    // Custom user profile is preserved untouched
    const custom = sanitizePersistedState({
      profile: {
        name: 'Abebe Bikila',
        email: 'abebe@addis.et',
        phone: '+251 91 555 0000',
        avatar: '',
      },
    })
    assert.equal(custom.profile?.name, 'Abebe Bikila')
    assert.equal(custom.profile?.email, 'abebe@addis.et')
  })

  it('strips sensitive card CVC/PAN fields and masks accidental PAN strings', () => {
    const sanitized = sanitizePersistedState({
      payments: [
        {
          id: 'c1',
          label: 'Visa 4242 4242 4242 4821',
          detail: 'Expires 09/28',
          kind: 'card',
          cvc: '999',
          number: '4242424242424821',
          pan: '4242424242424821',
          removable: true,
        },
      ],
    })
    const pm = sanitized.payments?.[0] as Record<string, unknown>
    assert.ok(pm)
    assert.equal('cvc' in pm, false)
    assert.equal('number' in pm, false)
    assert.equal('pan' in pm, false)
    assert.equal(pm.label, 'Visa •••• 4821')
    assert.equal(pm.removable, true)
  })

  it('rejects corrupt persisted payloads safely without throwing', () => {
    assert.deepEqual(sanitizePersistedState(null), {})
    assert.deepEqual(sanitizePersistedState('corrupt'), {})
    const cleaned = sanitizePersistedState({
      hasOnboarded: 'yes',
      promo: 'INVALID',
      language: 'Klingon',
      cart: [{ bad: true }],
      orders: [{ id: 'bad', items: [] }],
      notices: { orders: false },
    })
    assert.equal(cleaned.hasOnboarded, undefined)
    assert.equal(cleaned.promo, '')
    assert.equal(cleaned.language, undefined)
    assert.deepEqual(cleaned.cart, [])
    assert.equal(cleaned.orders, undefined)
    assert.deepEqual(cleaned.notices, {
      ...DEFAULT_NOTICES,
      orders: false,
    })
  })

  it('falls back once from gebeta.state.v1 to legacy morsel.state.v1 and writes migrated state', () => {
    const store = createMemoryStorage({
      [LEGACY_STORAGE_KEY]: JSON.stringify({
        hasOnboarded: true,
        profile: {
          name: 'Selam Tadesse',
          email: 'selam.tadesse@example.com',
          phone: '+251 91 123 4548',
          avatar: '',
        },
        language: 'አማርኛ',
      }),
    })

    const loaded = loadPersistedState(store)
    assert.equal(loaded.hasOnboarded, true)
    assert.equal(loaded.profile?.name, 'Natnael Tezazu')
    assert.equal(loaded.language, 'አማርኛ')

    const persistedNow = store.dump()[STORAGE_KEY]
    assert.ok(persistedNow)
    assert.equal(JSON.parse(persistedNow).profile.name, 'Natnael Tezazu')

    savePersistedState({ promo: 'BITE20' }, store)
    assert.equal(JSON.parse(store.dump()[STORAGE_KEY]).promo, 'BITE20')
  })

  it('sanitizes media URLs across avatars, cart items, order items, and payment logos', () => {
    // Rejects unsafe schemes, http://, protocol-relative, stale /src/ dev URLs, SVG scripts/handlers, and oversized payloads
    assert.equal(sanitizeMediaUrl('/src/assets/brands/cbe.png'), '')
    assert.equal(sanitizeMediaUrl('/src/assets/eth-doro-wat.jpg'), '')
    assert.equal(sanitizeMediaUrl('javascript:alert(1)'), '')
    assert.equal(sanitizeMediaUrl('http://example.com/photo.png'), '')
    assert.equal(sanitizeMediaUrl('//evil.example/photo.png'), '')
    assert.equal(sanitizeMediaUrl('data:text/html,<script>alert(1)</script>'), '')
    assert.equal(
      sanitizeMediaUrl('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
      '',
    )
    assert.equal(
      sanitizeMediaUrl(
        'data:image/svg+xml,<svg onload="alert(1)"><script>alert(1)</script></svg>',
        { allowSvgData: true },
      ),
      '',
    )
    assert.equal(
      sanitizeMediaUrl(
        `data:image/svg+xml;base64,${Buffer.from('<svg onclick="alert(1)"></svg>').toString('base64')}`,
        { allowSvgData: true },
      ),
      '',
    )
    assert.equal(
      sanitizeMediaUrl(
        'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Ca%20href=%22JAVASCRIPT:alert(1)%22%3E%3C/a%3E%3C/svg%3E',
        { allowSvgData: true },
      ),
      '',
    )
    assert.equal(sanitizeMediaUrl(`data:image/png;base64,${'A'.repeat(250_005)}`), '')

    // Preserves valid relative, https, raster data URIs, and clean brand SVG data URIs
    assert.equal(sanitizeMediaUrl('/assets/eth-doro-wat.webp'), '/assets/eth-doro-wat.webp')
    assert.equal(
      sanitizeMediaUrl('https://cdn.gebeta.et/img/logo.webp'),
      'https://cdn.gebeta.et/img/logo.webp',
    )
    assert.equal(
      sanitizeMediaUrl('data:image/webp;base64,UklGRh4AAABXRUJQVlA4'),
      'data:image/webp;base64,UklGRh4AAABXRUJQVlA4',
    )
    const cleanSvgLogo =
      'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Ccircle%20r=%2210%22/%3E%3C/svg%3E'
    assert.equal(sanitizeMediaUrl(cleanSvgLogo, { allowSvgData: true }), cleanSvgLogo)

    // Integrates with sanitizePersistedState without dropping payment method on unsafe logo
    const item = lineItem(sampleDishA, 1, 'Spaghetti', [])
    const state = sanitizePersistedState({
      cart: [
        { ...item, image: 'javascript:alert(1)', thumb: 'javascript:alert(2)' },
        { ...item, key: 'k2', thumb: '/assets/thumbs/gamberi.webp' },
      ],
      orders: [
        {
          id: 'GB-9001',
          restaurantId: 'luna',
          items: [{ ...item, image: 'http://insecure.local/a.png' }],
          total: 1000,
          placedAt: 1000,
          status: 'active',
          date: 'November 26',
          addressLine: '  Bole Atlas, Building 14  ',
          deliveryOption: 1,
        },
        {
          id: 'GB-9002',
          restaurantId: 'luna',
          items: [item],
          total: 1000,
          placedAt: 2000,
          status: 'delivered',
          date: 'November 26',
          addressLine: '   ',
          deliveryOption: 9,
        },
      ],
      payments: [
        {
          id: 'visa',
          label: 'Visa •••• 4821',
          detail: 'Expires 09/28',
          kind: 'card',
          logo: 'data:image/svg+xml,<svg><script>evil()</script></svg>',
        },
        {
          id: 'cbe',
          label: 'CBE Birr',
          detail: 'Wallet',
          kind: 'wallet',
          logo: cleanSvgLogo,
        },
      ],
    })

    assert.equal(state.cart?.[0].image, '')
    assert.equal(state.cart?.[0].thumb, undefined)
    assert.equal(state.cart?.[1].thumb, '/assets/thumbs/gamberi.webp')
    assert.equal(state.orders?.[0].items[0].image, '')
    assert.equal(state.orders?.[0].addressLine, 'Bole Atlas, Building 14')
    assert.equal(state.orders?.[0].deliveryOption, 1)
    assert.equal(state.orders?.[1].addressLine, undefined)
    assert.equal(state.orders?.[1].deliveryOption, undefined)
    assert.equal(state.payments?.length, 2)
    assert.equal(state.payments?.[0].logo, undefined)
    assert.equal(state.payments?.[1].logo, cleanSvgLogo)
  })
})

describe('i18n dictionary & RTL metadata', () => {
  it('exposes all 6 languages with Arabic marked rtl and others ltr', () => {
    assert.equal(LANGUAGES.length, 6)
    const arMeta = getLanguageMeta('العربية')
    assert.equal(arMeta.dir, 'rtl')
    assert.equal(arMeta.code, 'ar')
    assert.equal(arMeta.english, 'Arabic')

    for (const meta of LANGUAGES) {
      if (meta.name !== 'العربية') {
        assert.equal(meta.dir, 'ltr')
      }
      assert.equal(getLanguageMeta(meta.name).code, meta.code)
    }
  })

  it('maintains strict key parity, lazy chunk loading, and clean copy across all 6 languages', async () => {
    const LOCALE_DICTS: Record<(typeof LANGUAGES)[number]['name'], LocaleDictionary> = {
      English: en,
      አማርኛ: am,
      'Afaan Oromoo': om,
      ትግርኛ: ti,
      Français: fr,
      العربية: ar,
    }
    const enKeys = [...TRANSLATION_KEYS].sort()
    assert.ok(enKeys.length > 220)

    for (const lang of LANGUAGES) {
      const dict = LOCALE_DICTS[lang.name]
      const langKeys = Object.keys(dict).sort()
      assert.deepEqual(langKeys, enKeys, `Key mismatch in ${lang.name}`)
      const t = createT(dict)
      for (const key of TRANSLATION_KEYS) {
        const value = t(key)
        assert.ok(value.trim().length > 0, `Empty translation for ${lang.name}:${key}`)
      }
      assert.equal(getLocalizedFaqs(t).length, 5)
    }

    assert.equal(await loadLocale('English'), en)
    assert.equal(await loadLocale('العربية'), ar)
    assert.equal(await loadLocale('አማርኛ'), am)
    // Cached load returns cleanly and populates createT(langName) lookup
    assert.equal(await loadLocale('العربية'), ar)

    const tEn = createT('English')
    assert.equal(plural(tEn, 1, 'order.item', 'order.items'), '1 item')
    assert.equal(plural(tEn, 3, 'order.item', 'order.items'), '3 items')
    assert.equal(tEn('club.silver'), 'Silver')
    assert.equal(tEn('club.gold'), 'Gold')
    assert.equal(tEn('club.platinum'), 'Platinum')
    assert.equal(tEn('tracking.scheduledFor', { time: '8:00 PM' }), 'Scheduled · 8:00 PM')
    assert.equal(tEn('addresses.nudgeLabel'), 'Move delivery pin')

    // Wave 1 copy & semantic assertions
    assert.ok(tEn('checkout.prototypeFine').includes('15%'))
    assert.equal(tEn('checkout.prototypeFine').toLowerCase().includes('vat included'), false)
    for (const demoKey of [
      'auth.otpHint',
      'tracking.protoHint',
      'chat.simulated',
      'card.note',
      'card.prototypeNote',
      'tracking.callMessage',
      'tracking.callToast',
    ] as const) {
      assert.equal(
        tEn(demoKey).toLowerCase().includes('prototype'),
        false,
        `Found "prototype" wording in ${demoKey}`,
      )
    }

    assert.equal(tEn('favorites.save', { name: 'Kategna' }), 'Save Kategna')
    assert.equal(tEn('favorites.remove', { name: 'Kategna' }), 'Remove Kategna from saved')
    assert.equal(tEn('review.starOne', { count: 1 }), '1 star')
    assert.equal(tEn('review.starMany', { count: 5 }), '5 stars')
    assert.equal(tEn('history.emptyFiltered', { filter: 'Active' }), 'No Active orders yet')
    assert.equal(tEn('auth.digitLabel', { n: 2 }), 'Digit 2')
    assert.equal(tEn('checkout.stepOf', { current: 2, total: 3 }), 'Step 2 of 3')
    assert.equal(tEn('promo.upTo', { amount: 'Br 300' }), 'Up to Br 300')
    assert.ok(tEn('checkout.doneEditing').length > 0)
    assert.equal(tEn('payment.telebirrLabel'), 'Telebirr')
    assert.ok(tEn('ui.mainNav').length > 0)

    const tAm = createT('አማርኛ')
    assert.equal(tAm('app.name'), 'ገበታ')
    assert.equal(tAm('nav.home'), 'መነሻ')

    const tAr = createT('العربية')
    assert.equal(tAr('nav.orders'), 'الطلبات')
    assert.ok(tAr('auth.otpSub', { email: 'natnael@gebeta.et' }).includes('natnael@gebeta.et'))

    const tOm = createT(om)
    assert.equal(tOm('nav.bag'), 'Boorsaa')

    const tTi = createT(ti)
    assert.equal(tTi('app.name'), 'ገበታ')

    const tFr = createT(fr)
    assert.equal(tFr('checkout.placeOrder'), 'Passer la commande')
  })
})
