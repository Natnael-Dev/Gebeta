export type TabId = 'home' | 'explore' | 'orders' | 'favorites' | 'profile'

export type Screen =
  | 'splash'
  | 'welcome'
  | 'onboarding'
  | 'signup'
  | 'login'
  | 'forgot'
  | 'otp'
  | 'reset-password'
  | 'location'
  | TabId
  | 'restaurant'
  | 'food'
  | 'cart'
  | 'addresses'
  | 'delivery'
  | 'payments'
  | 'checkout'
  | 'confirmation'
  | 'tracking'
  | 'completed'
  | 'history'
  | 'order-detail'
  | 'saved-addresses'
  | 'saved-payments'
  | 'notifications'
  | 'settings'
  | 'language'
  | 'address-search'
  | 'address-map'
  | 'address-edit'
  | 'help'
  | 'faq'
  | 'chat'
  | 'report'
  | 'review'

export type LanguageName = 'English' | 'አማርኛ' | 'Afaan Oromoo' | 'ትግርኛ' | 'Français' | 'العربية'

export type Filters = {
  sort: string
  price: number
  free: boolean
}

export type ChatIntent = 'door' | 'coming' | 'call' | 'refund' | 'late'

export type ChatMessage = {
  from: 'me' | 'agent'
  text?: string
  file?: string
  imageUrl?: string
  intent?: ChatIntent
}

export type Extra = {
  name: string
  price: number
}

export type Dish = {
  id: string
  restaurantId: string
  name: string
  local?: string
  desc: string
  price: number
  image: string
  thumb?: string
  cal: number
  tag?: string
  option: { title: string; choices: string[] }
  extras: Extra[]
}

export type Restaurant = {
  id: string
  name: string
  cuisine: string
  type: string
  minutes: [number, number]
  rating: number
  reviews: string
  fee: number
  price: 1 | 2 | 3
  image: string
  thumb?: string
  blurb: string
  initial: string
  menu: Dish[]
}

export type CartItem = {
  key: string
  dishId: string
  restaurantId: string
  name: string
  image: string
  thumb?: string
  unit: number
  qty: number
  choice: string
  extras: string[]
  note: string
  summary: string
}

export type Order = {
  id: string
  restaurantId: string
  items: CartItem[]
  total: number
  placedAt: number
  status: 'active' | 'delivered' | 'canceled'
  date: string
  reviewed?: boolean
  deliveryNote?: string
  scheduleTime?: string
  deliveredAt?: number
  discount?: number
  ratingGiven?: number
  addressLine?: string
  deliveryOption?: 0 | 1 | 2
}

export type Address = {
  id: string
  label: string
  line1: string
  line2: string
  apt: string
  instructions: string
}

export type Draft = Address & {
  returnTo: Screen
  isNew: boolean
}

export type PaymentMethod = {
  id: string
  label: string
  detail: string
  kind: 'wallet' | 'card' | 'cash'
  logo?: string
  removable?: boolean
}

export type Profile = {
  name: string
  email: string
  phone: string
  avatar: string
}

export type Notices = {
  orders: boolean
  courier: boolean
  picks: boolean
  offers: boolean
}

export type PersistedState = {
  hasOnboarded?: boolean
  cart?: CartItem[]
  favR?: string[]
  favD?: string[]
  promo?: string
  deliveryNote?: string
  addresses?: Address[]
  addressId?: string
  payments?: PaymentMethod[]
  paymentId?: string
  orders?: Order[]
  profile?: Profile
  notices?: Notices
  language?: LanguageName
}

export type DialogSpec = {
  title: string
  message: string
  confirm: string
  destructive?: boolean
  onConfirm: () => void
}
