import type { CartItem, Profile } from './types.ts'

export type CardBrand = 'Visa' | 'Mastercard' | 'Amex' | 'Card'

export type CardInput = {
  name: string
  number: string
  exp: string
  cvc: string
}

export type CardValidationErrors = Partial<Record<keyof CardInput, string>>

export type CardValidationResult = {
  valid: boolean
  errors: CardValidationErrors
  brand: CardBrand
  last4: string
}

export type ProfileValidationErrors = Partial<Record<'name' | 'email' | 'phone', string>>

export type ProfileValidationResult = {
  valid: boolean
  errors: ProfileValidationErrors
}

export type PromoValidationResult = {
  valid: boolean
  code: string
  error: string
}

export type ValidationErrorKey =
  | 'validation.cardNumber'
  | 'validation.cardExp'
  | 'validation.cardCvc'
  | 'validation.cardName'
  | 'validation.profileName'
  | 'validation.profileEmail'
  | 'validation.profilePhone'
  | 'validation.promoEmpty'
  | 'validation.promoInvalid'

export type ValidationTranslator = (key: ValidationErrorKey) => string

const DEFAULT_VALIDATION_MESSAGES: Record<ValidationErrorKey, string> = {
  'validation.cardNumber': 'Enter a valid card number.',
  'validation.cardExp': 'Use MM/YY in the future.',
  'validation.cardCvc': '3–4 digits.',
  'validation.cardName': 'Name on card.',
  'validation.profileName': 'Enter your name.',
  'validation.profileEmail': 'Enter a valid email.',
  'validation.profilePhone': 'Enter a valid phone number.',
  'validation.promoEmpty': 'Add something to your bag first.',
  'validation.promoInvalid': 'That code isn’t valid. Try BITE20.',
}

const msg = (t: ValidationTranslator | undefined, key: ValidationErrorKey): string =>
  t ? t(key) : DEFAULT_VALIDATION_MESSAGES[key]

const STEP_MS = 30 * 60 * 1000
const MIN_LEAD_MS = 45 * 60 * 1000
const DEFAULT_SLOT_COUNT = 6

/** Identifies the card network from PAN prefix digits. */
export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/\D/g, '')
  if (!digits) return 'Card'
  if (digits.startsWith('4')) return 'Visa'
  if (digits.startsWith('34') || digits.startsWith('37') || digits.startsWith('3')) {
    return 'Amex'
  }
  const first4 = Number(digits.slice(0, 4))
  if (digits.startsWith('5') || (digits.length >= 4 && first4 >= 2221 && first4 <= 2720)) {
    return 'Mastercard'
  }
  return 'Card'
}

/** Validates PAN length (15..19), rejects all-zero strings, and checks Luhn checksum. */
export function isValidLuhn(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/[\s-]/g, '')
  if (!/^\d{15,19}$/.test(cleaned) || /^0+$/.test(cleaned)) {
    return false
  }

  let sum = 0
  let shouldDouble = false
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = Number(cleaned[i])
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

/** Validates card number, MM/YY expiry against `now`, CVC, and cardholder name. */
export function validateCard(
  input: CardInput,
  nowOrT?: Date | ValidationTranslator,
  maybeT?: ValidationTranslator,
): CardValidationResult {
  const now = nowOrT instanceof Date ? nowOrT : new Date()
  const t = typeof nowOrT === 'function' ? nowOrT : maybeT
  const errors: CardValidationErrors = {}
  const cleanedNumber = input.number.replace(/[\s-]/g, '')

  if (!isValidLuhn(cleanedNumber)) {
    errors.number = msg(t, 'validation.cardNumber')
  }

  const expMatch = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(input.exp.trim())
  if (!expMatch) {
    errors.exp = msg(t, 'validation.cardExp')
  } else {
    const expMonth = Number(expMatch[1])
    const expYear = 2000 + Number(expMatch[2])
    const curYear = now.getFullYear()
    const curMonth = now.getMonth() + 1
    if (expYear < curYear || (expYear === curYear && expMonth < curMonth)) {
      errors.exp = msg(t, 'validation.cardExp')
    }
  }

  if (!/^\d{3,4}$/.test(input.cvc.trim())) {
    errors.cvc = msg(t, 'validation.cardCvc')
  }

  if (input.name.trim().length < 2) {
    errors.name = msg(t, 'validation.cardName')
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    brand: detectCardBrand(cleanedNumber),
    last4: cleanedNumber.slice(-4),
  }
}

/** Validates profile contact fields before persisting changes. */
export function validateProfile(
  profile: Pick<Profile, 'name' | 'email' | 'phone'>,
  t?: ValidationTranslator,
): ProfileValidationResult {
  const errors: ProfileValidationErrors = {}
  if (profile.name.trim().length < 2) {
    errors.name = msg(t, 'validation.profileName')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
    errors.email = msg(t, 'validation.profileEmail')
  }
  if (profile.phone.replace(/\D/g, '').length < 10) {
    errors.phone = msg(t, 'validation.profilePhone')
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/** Validates promo code (`BITE20`) and requires a non-empty cart. */
export function validatePromo(
  code: string,
  cart: readonly CartItem[],
  t?: ValidationTranslator,
): PromoValidationResult {
  if (cart.length === 0) {
    return {
      valid: false,
      code: '',
      error: msg(t, 'validation.promoEmpty'),
    }
  }
  const normalized = code.trim().toUpperCase()
  if (normalized !== 'BITE20') {
    return {
      valid: false,
      code: '',
      error: msg(t, 'validation.promoInvalid'),
    }
  }
  return {
    valid: true,
    code: 'BITE20',
    error: '',
  }
}

function formatSlotTime(d: Date): string {
  const hours24 = d.getHours()
  const minutes = d.getMinutes()
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`
}

/**
 * Generates upcoming 30-minute scheduled delivery windows that are at least
 * 45 minutes in the future from `now`.
 */
export function getUpcomingScheduleSlots(
  now: Date = new Date(),
  count = DEFAULT_SLOT_COUNT,
): string[] {
  if (count <= 0) return []
  const minTimeMs = now.getTime() + MIN_LEAD_MS
  const cursor = new Date(minTimeMs)
  cursor.setSeconds(0, 0)
  if (minTimeMs > cursor.getTime()) {
    cursor.setMinutes(cursor.getMinutes() + 1)
  }
  const remainder = cursor.getMinutes() % 30
  if (remainder !== 0) {
    cursor.setMinutes(cursor.getMinutes() + (30 - remainder))
  }

  const slots: string[] = []
  for (let i = 0; i < count; i++) {
    slots.push(formatSlotTime(new Date(cursor.getTime() + i * STEP_MS)))
  }
  return slots
}
