import type {
  Address,
  CartItem,
  LanguageName,
  Notices,
  Order,
  PaymentMethod,
  PersistedState,
  Profile,
} from './types.ts'

export const STORAGE_KEY = 'gebeta.state.v1'
export const LEGACY_STORAGE_KEY = 'morsel.state.v1'

export const DEFAULT_PROFILE: Profile = {
  name: 'Natnael Tezazu',
  email: 'natnael.tezazu@example.com',
  phone: '+251 91 123 4548',
  avatar: '',
}

export const DEFAULT_NOTICES: Notices = {
  orders: true,
  courier: true,
  picks: true,
  offers: false,
}

const VALID_LANGUAGES: ReadonlySet<LanguageName> = new Set<LanguageName>([
  'English',
  'አማርኛ',
  'Afaan Oromoo',
  'ትግርኛ',
  'Français',
  'العربية',
])

const VALID_ORDER_STATUSES: ReadonlySet<Order['status']> = new Set<Order['status']>([
  'active',
  'delivered',
  'canceled',
])

const VALID_PAYMENT_KINDS: ReadonlySet<PaymentMethod['kind']> = new Set<PaymentMethod['kind']>([
  'wallet',
  'card',
  'cash',
])

const LEGACY_PROFILE_NAMES: ReadonlySet<string> = new Set(['Selam Tadesse', 'Selam Tesfaye'])

const LEGACY_PROFILE_EMAILS: ReadonlySet<string> = new Set([
  'selam.tadesse@example.com',
  'selam.tesfaye@example.com',
])

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function asString(value: unknown, maxLen = 500): string | undefined {
  return typeof value === 'string' ? value.slice(0, maxLen) : undefined
}

function asFiniteNonNegative(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const out: string[] = []
  for (const item of value) {
    if (typeof item === 'string' && item.trim().length > 0) {
      out.push(item)
    }
  }
  return out
}

function maskPanSequences(value: string): string {
  return value.replace(/(?:\d[\s-]*){12,19}/g, (match) => {
    const digits = match.replace(/\D/g, '')
    return digits.length >= 12 ? `•••• ${digits.slice(-4)}` : match
  })
}

const DEFAULT_MEDIA_URL_MAX_LEN = 250000

function isUnsafeSvgContent(raw: string, decoded: string): boolean {
  const decodeNumericEntities = (s: string) =>
    s
      .replace(/&#(\d+);?/g, (_, dec: string) => {
        const code = Number(dec)
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : ''
      })
      .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => {
        const code = parseInt(hex, 16)
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : ''
      })

  const samples = [raw, decoded, decodeNumericEntities(decoded)]
  for (const sample of samples) {
    if (/<script/i.test(sample)) return true
    if (/\bon\w+\s*=/i.test(sample)) return true
    const compact = sample.replace(/[\s\u0000-\u001f]+/g, '')
    if (/javascript:/i.test(sample) || /javascript:/i.test(compact)) return true
  }
  return false
}

/**
 * Validates media URLs for avatars, dish images, and brand logos.
 * Allows safe relative `/...` paths, `https://` URLs, raster base64 data URIs,
 * and optionally script-free `data:image/svg+xml` payloads (e.g. Vite-inlined brand logos).
 */
export function sanitizeMediaUrl(
  value: unknown,
  opts?: { allowSvgData?: boolean; maxLen?: number },
): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''

  const maxLen = opts?.maxLen ?? DEFAULT_MEDIA_URL_MAX_LEN
  if (trimmed.length > maxLen) return ''

  if (/^data:image\/(?:png|jpeg|jpg|webp|gif|avif|bmp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed
  }

  if (opts?.allowSvgData) {
    const svgMatch = /^data:image\/svg\+xml((?:;[a-z0-9=+.-]+)*),(.*)$/i.exec(trimmed)
    if (svgMatch) {
      const meta = svgMatch[1] ?? ''
      const payload = svgMatch[2] ?? ''
      const isBase64 = /;base64(?:$|;)/i.test(meta)
      let decoded = payload
      try {
        if (isBase64) {
          if (!/^[A-Za-z0-9+/=\s]+$/.test(payload)) return ''
          decoded = atob(payload.replace(/\s+/g, ''))
        } else {
          try {
            decoded = decodeURIComponent(payload)
          } catch {
            decoded = payload
          }
        }
      } catch {
        return ''
      }
      if (isUnsafeSvgContent(trimmed, decoded)) return ''
      return trimmed
    }
  }

  if (/^https:\/\/\S+$/i.test(trimmed)) {
    return trimmed
  }
  if (trimmed.startsWith('/src/')) {
    return ''
  }
  if (/^\/(?!\/)\S*$/.test(trimmed)) {
    return trimmed
  }
  return ''
}

function sanitizeAvatar(value: unknown): string {
  return sanitizeMediaUrl(value)
}

function sanitizeCartItem(raw: unknown): CartItem | null {
  if (!isRecord(raw)) return null
  const key = asNonEmptyString(raw.key)
  const dishId = asNonEmptyString(raw.dishId)
  const restaurantId = asNonEmptyString(raw.restaurantId)
  const name = asNonEmptyString(raw.name)
  const hasImageString = typeof raw.image === 'string'
  const unit = asFiniteNonNegative(raw.unit)
  const qty = asFiniteNonNegative(raw.qty)

  if (
    !key ||
    !dishId ||
    !restaurantId ||
    !name ||
    !hasImageString ||
    unit === undefined ||
    qty === undefined ||
    qty < 1
  ) {
    return null
  }

  const image = sanitizeMediaUrl(raw.image)
  const thumb = sanitizeMediaUrl(raw.thumb)
  const choice = typeof raw.choice === 'string' ? raw.choice : ''
  const extras = Array.isArray(raw.extras)
    ? raw.extras.filter((e): e is string => typeof e === 'string')
    : []
  const note = typeof raw.note === 'string' ? raw.note.slice(0, 300) : ''
  const summary =
    typeof raw.summary === 'string'
      ? raw.summary
      : [choice, ...extras].filter(Boolean).join(' · ') + (note ? ` · “${note}”` : '')

  return {
    key,
    dishId,
    restaurantId,
    name,
    image,
    ...(thumb ? { thumb } : {}),
    unit,
    qty: Math.max(1, Math.floor(qty)),
    choice,
    extras,
    note,
    summary,
  }
}

function sanitizeAddress(raw: unknown): Address | null {
  if (!isRecord(raw)) return null
  const id = asNonEmptyString(raw.id)
  const line1 = asNonEmptyString(raw.line1)
  if (!id || !line1) return null

  return {
    id,
    label: asNonEmptyString(raw.label) ?? 'Home',
    line1: line1.slice(0, 200),
    line2: (asString(raw.line2, 200) ?? '').trim(),
    apt: (asString(raw.apt, 100) ?? '').trim(),
    instructions: (asString(raw.instructions, 300) ?? '').trim(),
  }
}

function sanitizePaymentMethod(raw: unknown): PaymentMethod | null {
  if (!isRecord(raw)) return null
  const id = asNonEmptyString(raw.id)
  const rawLabel = asNonEmptyString(raw.label)
  const rawKind = raw.kind
  if (
    !id ||
    !rawLabel ||
    typeof rawKind !== 'string' ||
    !VALID_PAYMENT_KINDS.has(rawKind as PaymentMethod['kind'])
  ) {
    return null
  }

  const label = maskPanSequences(rawLabel.slice(0, 80))
  const detail = maskPanSequences((asString(raw.detail, 120) ?? '').trim())
  const method: PaymentMethod = {
    id,
    label,
    detail,
    kind: rawKind as PaymentMethod['kind'],
  }

  const logo = sanitizeMediaUrl(raw.logo, { allowSvgData: true })
  if (logo) {
    method.logo = logo
  }
  if (typeof raw.removable === 'boolean') {
    method.removable = raw.removable
  }
  return method
}

function sanitizeOrder(raw: unknown): Order | null {
  if (!isRecord(raw)) return null
  const id = asNonEmptyString(raw.id)
  const restaurantId = asNonEmptyString(raw.restaurantId)
  const total = asFiniteNonNegative(raw.total)
  const placedAt = asFiniteNonNegative(raw.placedAt)
  const rawStatus = raw.status
  if (
    !id ||
    !restaurantId ||
    total === undefined ||
    placedAt === undefined ||
    typeof rawStatus !== 'string' ||
    !VALID_ORDER_STATUSES.has(rawStatus as Order['status']) ||
    !Array.isArray(raw.items)
  ) {
    return null
  }

  const items: CartItem[] = []
  for (const item of raw.items) {
    const valid = sanitizeCartItem(item)
    if (valid) items.push(valid)
  }
  if (items.length === 0) return null

  const order: Order = {
    id,
    restaurantId,
    items,
    total,
    placedAt,
    status: rawStatus as Order['status'],
    date: typeof raw.date === 'string' ? raw.date : '',
  }

  if (typeof raw.reviewed === 'boolean') order.reviewed = raw.reviewed
  if (typeof raw.deliveryNote === 'string' && raw.deliveryNote.trim()) {
    order.deliveryNote = raw.deliveryNote.slice(0, 300)
  }
  if (typeof raw.scheduleTime === 'string' && raw.scheduleTime.trim()) {
    order.scheduleTime = raw.scheduleTime.slice(0, 40)
  }
  const deliveredAt = asFiniteNonNegative(raw.deliveredAt)
  if (deliveredAt !== undefined) order.deliveredAt = deliveredAt
  const discount = asFiniteNonNegative(raw.discount)
  if (discount !== undefined) order.discount = discount
  if (
    typeof raw.ratingGiven === 'number' &&
    Number.isFinite(raw.ratingGiven) &&
    raw.ratingGiven >= 1 &&
    raw.ratingGiven <= 5
  ) {
    order.ratingGiven = raw.ratingGiven
  }
  const addressLine = asString(raw.addressLine, 200)?.trim()
  if (addressLine) {
    order.addressLine = addressLine
  }
  if (raw.deliveryOption === 0 || raw.deliveryOption === 1 || raw.deliveryOption === 2) {
    order.deliveryOption = raw.deliveryOption
  }

  return order
}

function sanitizeProfile(raw: unknown): Profile | undefined {
  if (!isRecord(raw)) return undefined
  const rawName = typeof raw.name === 'string' ? raw.name.trim() : ''
  const rawEmail = typeof raw.email === 'string' ? raw.email.trim() : ''
  const rawPhone = typeof raw.phone === 'string' ? raw.phone.trim() : ''

  const name =
    !rawName || LEGACY_PROFILE_NAMES.has(rawName) ? DEFAULT_PROFILE.name : rawName.slice(0, 120)

  const email =
    !rawEmail || LEGACY_PROFILE_EMAILS.has(rawEmail.toLowerCase())
      ? DEFAULT_PROFILE.email
      : rawEmail.slice(0, 160)

  const phone = rawPhone ? rawPhone.slice(0, 40) : DEFAULT_PROFILE.phone
  const avatar = sanitizeAvatar(raw.avatar)

  return { name, email, phone, avatar }
}

function sanitizeNotices(raw: unknown): Notices | undefined {
  if (!isRecord(raw)) return undefined
  return {
    orders: typeof raw.orders === 'boolean' ? raw.orders : DEFAULT_NOTICES.orders,
    courier: typeof raw.courier === 'boolean' ? raw.courier : DEFAULT_NOTICES.courier,
    picks: typeof raw.picks === 'boolean' ? raw.picks : DEFAULT_NOTICES.picks,
    offers: typeof raw.offers === 'boolean' ? raw.offers : DEFAULT_NOTICES.offers,
  }
}

/**
 * Validates and normalizes persisted localStorage payloads with zero `any`,
 * migrates legacy Morsel profile defaults, and strips sensitive card data.
 */
export function sanitizePersistedState(raw: unknown): PersistedState {
  if (!isRecord(raw)) return {}
  const out: PersistedState = {}

  if (typeof raw.hasOnboarded === 'boolean') {
    out.hasOnboarded = raw.hasOnboarded
  }

  if (Array.isArray(raw.cart)) {
    const cart: CartItem[] = []
    for (const item of raw.cart) {
      const valid = sanitizeCartItem(item)
      if (valid) cart.push(valid)
    }
    out.cart = cart
  }

  const favR = asStringArray(raw.favR)
  if (favR !== undefined) out.favR = favR

  const favD = asStringArray(raw.favD)
  if (favD !== undefined) out.favD = favD

  if (typeof raw.promo === 'string') {
    out.promo = raw.promo.trim().toUpperCase() === 'BITE20' ? 'BITE20' : ''
  }

  if (typeof raw.deliveryNote === 'string') {
    out.deliveryNote = raw.deliveryNote.slice(0, 300)
  }

  if (Array.isArray(raw.addresses)) {
    const addresses: Address[] = []
    for (const addr of raw.addresses) {
      const valid = sanitizeAddress(addr)
      if (valid) addresses.push(valid)
    }
    if (addresses.length > 0) out.addresses = addresses
  }

  const addressId = asNonEmptyString(raw.addressId)
  if (addressId) out.addressId = addressId

  if (Array.isArray(raw.payments)) {
    const payments: PaymentMethod[] = []
    for (const pm of raw.payments) {
      const valid = sanitizePaymentMethod(pm)
      if (valid) payments.push(valid)
    }
    if (payments.length > 0) out.payments = payments
  }

  const paymentId = asNonEmptyString(raw.paymentId)
  if (paymentId) out.paymentId = paymentId

  if (Array.isArray(raw.orders)) {
    const orders: Order[] = []
    for (const order of raw.orders) {
      const valid = sanitizeOrder(order)
      if (valid) orders.push(valid)
    }
    if (orders.length > 0) out.orders = orders
  }

  const profile = sanitizeProfile(raw.profile)
  if (profile) out.profile = profile

  const notices = sanitizeNotices(raw.notices)
  if (notices) out.notices = notices

  if (typeof raw.language === 'string' && VALID_LANGUAGES.has(raw.language as LanguageName)) {
    out.language = raw.language as LanguageName
  }

  return out
}

function defaultStorage(): StorageLike | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined
  } catch {
    return undefined
  }
}

/**
 * Loads state from `gebeta.state.v1`, falling back once to `morsel.state.v1`
 * when the new key does not yet exist.
 */
export function loadPersistedState(storage?: StorageLike): PersistedState {
  const store = storage ?? defaultStorage()
  if (!store) return {}

  try {
    const currentRaw = store.getItem(STORAGE_KEY)
    if (currentRaw !== null) {
      return sanitizePersistedState(JSON.parse(currentRaw))
    }

    const legacyRaw = store.getItem(LEGACY_STORAGE_KEY)
    if (legacyRaw === null) return {}

    const migrated = sanitizePersistedState(JSON.parse(legacyRaw))
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(migrated))
    } catch {
      // Ignore storage quota or private-mode write failures during migration
    }
    return migrated
  } catch {
    return {}
  }
}

/** Sanitizes and persists state to `gebeta.state.v1`. */
export function savePersistedState(state: PersistedState, storage?: StorageLike): void {
  const store = storage ?? defaultStorage()
  if (!store) return
  try {
    const sanitized = sanitizePersistedState(state)
    store.setItem(STORAGE_KEY, JSON.stringify(sanitized))
  } catch {
    // Ignore storage quota or private-mode failures
  }
}
