import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { allDishes, brands, findRestaurant, restaurants, seedOrders } from './data.ts'
import { calculateTotals, isCrossRestaurantCart } from './domain/cart.ts'
import {
  computeAverageRating,
  computeClubMetrics,
  formatOrderDate,
  reconcileActiveOrders,
  resolveOrderElapsed,
  resolveOrderStage,
  STAGE_MS,
  stages,
} from './domain/orders.ts'
import {
  DEFAULT_NOTICES,
  DEFAULT_PROFILE,
  loadPersistedState,
  sanitizeMediaUrl,
  savePersistedState,
} from './domain/storage.ts'
import type {
  Address,
  CartItem,
  ChatIntent,
  ChatMessage,
  DialogSpec,
  Draft,
  Filters,
  LanguageName,
  Notices,
  Order,
  PaymentMethod,
  PersistedState,
  Profile,
  Restaurant,
  Screen,
  TabId,
} from './domain/types.ts'
import { getUpcomingScheduleSlots } from './domain/validation.ts'
import { createT, en, getLanguageMeta, loadLocale, type LocaleDictionary } from './i18n.ts'
import { isNativePlatform, sendLocalNotification } from './native.ts'
import { haptic, reducedMotion } from './ui.tsx'

export type {
  Address,
  CartItem,
  ChatIntent,
  ChatMessage,
  DialogSpec,
  Draft,
  Filters,
  LanguageName,
  Notices,
  Order,
  PaymentMethod,
  PersistedState,
  Profile,
  Screen,
  TabId,
}
export { DEFAULT_NOTICES, DEFAULT_PROFILE, STAGE_MS, stages }

export const authScreens: Screen[] = [
  'splash',
  'welcome',
  'onboarding',
  'signup',
  'login',
  'forgot',
  'otp',
  'reset-password',
  'location',
]

export const tabScreens: Screen[] = ['home', 'explore', 'orders', 'favorites', 'profile']

const DEFAULT_ADDRESSES: Address[] = [
  {
    id: 'home',
    label: 'Home',
    line1: 'Bole Atlas, Building 14',
    line2: 'Bole, Addis Ababa',
    apt: 'Apt 4B',
    instructions: 'Leave at the door',
  },
  {
    id: 'work',
    label: 'Work',
    line1: 'Kazanchis Business District',
    line2: 'Kirkos, Addis Ababa',
    apt: 'Floor 6',
    instructions: 'Front desk',
  },
]

const DEFAULT_PAYMENTS: PaymentMethod[] = [
  {
    id: 'cbe',
    label: 'CBE Birr',
    detail: 'Wallet · +251 91 •• •• 48',
    kind: 'wallet',
    logo: brands.cbe,
    removable: false,
  },
  {
    id: 'telebirr',
    label: 'Telebirr',
    detail: '+251 91 ·••• 48',
    kind: 'wallet',
    logo: brands.telebirr,
    removable: false,
  },
  {
    id: 'visa',
    label: 'Visa •••• 4821',
    detail: 'Expires 09/28',
    kind: 'card',
    logo: brands.visa,
    removable: false,
  },
  {
    id: 'cash',
    label: 'Cash on delivery',
    detail: 'Pay the courier in Birr',
    kind: 'cash',
    removable: false,
  },
]

const RESTAURANT_FEE_BY_ID: Readonly<Record<string, number>> = Object.fromEntries(
  restaurants.map((r) => [r.id, r.fee]),
)

const DISH_MEDIA_BY_ID: ReadonlyMap<string, { image: string; thumb?: string }> = new Map(
  allDishes.map((d) => [d.id, { image: d.image, thumb: d.thumb }]),
)

function hydrateCartItem(item: CartItem): CartItem {
  const media = DISH_MEDIA_BY_ID.get(item.dishId)
  if (media) {
    return {
      ...item,
      image: media.image,
      ...(media.thumb ? { thumb: media.thumb } : {}),
    }
  }
  const safeImage = sanitizeMediaUrl(item.image)
  const safeThumb = sanitizeMediaUrl(item.thumb)
  return {
    ...item,
    image: safeImage,
    ...(safeThumb ? { thumb: safeThumb } : {}),
  }
}

function hydrateOrder(order: Order): Order {
  return {
    ...order,
    items: order.items.map(hydrateCartItem),
  }
}

function resolvePaymentLogo(pm: PaymentMethod): string | undefined {
  if (pm.id === 'cbe' || /\bcbe\b/i.test(pm.label)) return brands.cbe
  if (pm.id === 'telebirr' || /\btelebirr\b/i.test(pm.label)) return brands.telebirr
  if (pm.kind === 'card') {
    if (pm.id === 'visa' || /^visa\b/i.test(pm.label)) return brands.visa
    if (/^mastercard\b/i.test(pm.label)) return brands.mastercard
  }
  const safe = sanitizeMediaUrl(pm.logo, { allowSvgData: true })
  return safe || undefined
}

function hydratePaymentMethod(pm: PaymentMethod): PaymentMethod {
  const logo = resolvePaymentLogo(pm)
  if (logo) return { ...pm, logo }
  const { logo: _omitted, ...rest } = pm
  return rest
}

const normalizeAddressKey = (addr: Pick<Address, 'line1' | 'line2' | 'apt'>): string =>
  `${addr.line1.trim().toLowerCase()}|${addr.line2.trim().toLowerCase()}|${addr.apt.trim().toLowerCase()}`

export function filterRestaurants(query: string, cuisine: string, f: Filters): Restaurant[] {
  const q = query.trim().toLowerCase()
  const list = restaurants.filter(
    (r) =>
      (cuisine === 'All' || r.cuisine === cuisine) &&
      (!f.price || r.price === f.price) &&
      (!f.free || r.fee === 0) &&
      (!q ||
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.menu.some(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.desc.toLowerCase().includes(q) ||
            (d.local ? d.local.toLowerCase().includes(q) : false),
        )),
  )
  const sorters: Record<string, (a: Restaurant, b: Restaurant) => number> = {
    'Fastest delivery': (a, b) => a.minutes[0] - b.minutes[0],
    'Top rated': (a, b) => b.rating - a.rating,
    'Lowest fee': (a, b) => a.fee - b.fee,
  }
  return sorters[f.sort] ? [...list].sort(sorters[f.sort]) : list
}

const greetings: Record<string, ChatMessage[]> = {
  general: [{ from: 'agent', text: 'Selam! I’m Liya from Gebeta. What can I help you with?' }],
  courier: [{ from: 'agent', text: 'Selam! Dawit here — I’m on my way with your order.' }],
}

/**
 * Isolated 1-second timer hook scoped solely to components tracking an active order
 * (e.g., `LiveOrder` and `Tracking`), preventing root-wide re-renders every second.
 */
export function useOrderNow(order?: Pick<Order, 'status' | 'placedAt'> | null): number {
  const isActive = order?.status === 'active'
  const [tickNow, setTickNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isActive) return
    setTickNow(Date.now())
    const timer = window.setInterval(() => setTickNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [isActive, order?.placedAt])

  return tickNow
}

export function useGebeta() {
  const saved = useRef<PersistedState | null>(null)
  if (saved.current === null) saved.current = loadPersistedState()
  const init = saved.current

  const initialAddresses = init.addresses?.length ? init.addresses : DEFAULT_ADDRESSES
  const initialAddressId =
    init.addressId && initialAddresses.some((a) => a.id === init.addressId)
      ? init.addressId
      : initialAddresses[0].id
  const initialPayments = (init.payments?.length ? init.payments : DEFAULT_PAYMENTS).map(
    hydratePaymentMethod,
  )
  const initialPaymentId =
    init.paymentId && initialPayments.some((p) => p.id === init.paymentId)
      ? init.paymentId
      : initialPayments[0].id
  const initialCart = (init.cart ?? []).map(hydrateCartItem)
  const initialOrders = reconcileActiveOrders(
    (init.orders?.length ? init.orders : seedOrders).map(hydrateOrder),
    Date.now(),
  )

  const [hasOnboarded, setHasOnboarded] = useState<boolean>(!!init.hasOnboarded)
  const [screen, setScreen] = useState<Screen>(() =>
    init.hasOnboarded ? 'home' : isNativePlatform() ? 'welcome' : 'splash',
  )
  const [history, setHistory] = useState<Screen[]>([])
  const [sheet, setSheet] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogSpec | null>(null)
  const [toastState, setToastState] = useState<{
    message: string
    tone: 'success' | 'error' | 'info'
    id: number
  } | null>(null)
  const [cart, setCart] = useState<CartItem[]>(initialCart)
  const [favR, setFavR] = useState<string[]>(init.favR ?? ['luna', 'field'])
  const [favD, setFavD] = useState<string[]>(init.favD ?? ['nami-ramen', 'forno-margherita'])
  const [promo, setPromo] = useState(init.promo ?? '')
  const [deliveryNote, setDeliveryNote] = useState(init.deliveryNote ?? 'Leave at the door')
  const [restaurantId, setRestaurantId] = useState('nami')
  const [dishId, setDishId] = useState(allDishes[0].id)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [exploreCuisine, setExploreCuisine] = useState('All')
  const [exploreFocus, setExploreFocus] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    sort: 'Recommended',
    price: 0,
    free: false,
  })
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [addressId, setAddressId] = useState(initialAddressId)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [payments, setPayments] = useState<PaymentMethod[]>(initialPayments)
  const [paymentId, setPaymentId] = useState(initialPaymentId)
  const [deliveryOption, setDeliveryOption] = useState(0)
  const [scheduleTime, setScheduleTime] = useState<string>(
    () => getUpcomingScheduleSlots()[0] ?? '8:00 PM',
  )
  const [minuteTick, setMinuteTick] = useState(() => Math.floor(Date.now() / 60_000))
  const [checkoutEditing, setCheckoutEditing] = useState(false)
  const [replayReturn, setReplayReturn] = useState<Screen | null>(null)
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [trackingId, setTrackingIdState] = useState<string | null>(null)
  const [detailId, setDetailIdState] = useState(initialOrders[0].id)
  const [profile, setProfile] = useState<Profile>(init.profile ?? DEFAULT_PROFILE)
  const [notices, setNotices] = useState<Notices>(init.notices ?? DEFAULT_NOTICES)
  const [language, setLanguageState] = useState<LanguageName>(init.language ?? 'English')
  const [dict, setDict] = useState<LocaleDictionary>(en)
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'forgot'>('signup')
  const [authEmail, setAuthEmail] = useState('')
  const [chatTopic, setChatTopic] = useState('general')
  const [messages, setMessages] = useState<ChatMessage[]>(greetings.general)
  const [typing, setTyping] = useState(false)
  const [faqOpen, setFaqOpen] = useState(0)
  const [reviewRating, setReviewRating] = useState(0)

  const toastTimer = useRef<number>(0)
  const typingTimer = useRef<number>(0)
  const saveTimerRef = useRef<number>(0)
  const latestPersistedRef = useRef<PersistedState | null>(null)
  const lastBackExitTap = useRef<number>(0)
  const prevOrdersRef = useRef<Order[]>(initialOrders)
  const notifiedDeliveredRef = useRef<Set<string>>(new Set())

  const languageMeta = useMemo(() => getLanguageMeta(language), [language])
  const localeCode = languageMeta.code
  const t = useMemo(() => createT(dict), [dict])

  useEffect(() => {
    let cancelled = false
    if (language === 'English') {
      setDict(en)
      return
    }
    void loadLocale(language).then((loaded) => {
      if (!cancelled) setDict(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [language])

  const setLanguage = useCallback(async (nextLang: LanguageName): Promise<void> => {
    const loaded = await loadLocale(nextLang)
    setDict(loaded)
    setLanguageState(nextLang)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dir = languageMeta.dir
    document.documentElement.lang = languageMeta.code
  }, [languageMeta])

  const persistedPayload = useMemo<PersistedState>(
    () => ({
      hasOnboarded,
      cart,
      favR,
      favD,
      promo,
      deliveryNote,
      addresses,
      addressId,
      payments,
      paymentId,
      orders,
      profile,
      notices,
      language,
    }),
    [
      hasOnboarded,
      cart,
      favR,
      favD,
      promo,
      deliveryNote,
      addresses,
      addressId,
      payments,
      paymentId,
      orders,
      profile,
      notices,
      language,
    ],
  )
  latestPersistedRef.current = persistedPayload

  useEffect(() => {
    window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = 0
      if (latestPersistedRef.current) {
        savePersistedState(latestPersistedRef.current)
      }
    }, 250)
    return () => window.clearTimeout(saveTimerRef.current)
  }, [persistedPayload])

  useEffect(() => {
    const flushPendingSave = () => {
      if (saveTimerRef.current && latestPersistedRef.current) {
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = 0
        savePersistedState(latestPersistedRef.current)
      }
    }
    window.addEventListener('pagehide', flushPendingSave)
    return () => {
      window.removeEventListener('pagehide', flushPendingSave)
      flushPendingSave()
    }
  }, [])

  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current)
      window.clearTimeout(typingTimer.current)
    },
    [],
  )

  // Refresh scheduled time slots once per minute instead of every second.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentMinute = Math.floor(Date.now() / 60_000)
      setMinuteTick((prev) => (prev === currentMinute ? prev : currentMinute))
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const activeOrder = orders.find((o) => o.status === 'active') ?? null

  // Single exact timeout for the earliest active order reaching stage 4 (delivered).
  useEffect(() => {
    const activeOrders = orders.filter((o) => o.status === 'active')
    if (activeOrders.length === 0) return

    const dueAt = Math.min(...activeOrders.map((o) => o.placedAt + 4 * STAGE_MS))
    const delay = Math.max(0, dueAt - Date.now())

    const timer = window.setTimeout(() => {
      setOrders((prev) => reconcileActiveOrders(prev, Date.now()))
    }, delay)
    return () => window.clearTimeout(timer)
  }, [orders])

  useEffect(() => {
    const prevById = new Map(prevOrdersRef.current.map((o) => [o.id, o]))
    for (const order of orders) {
      const prev = prevById.get(order.id)
      if (
        prev?.status === 'active' &&
        order.status === 'delivered' &&
        !notifiedDeliveredRef.current.has(order.id)
      ) {
        notifiedDeliveredRef.current.add(order.id)
        if (notices.orders) {
          const restaurant = findRestaurant(order.restaurantId)
          void sendLocalNotification(
            'Gebeta',
            t('chat.deliveredBody', { restaurant: restaurant.name }),
          )
        }
      }
    }
    prevOrdersRef.current = orders
  }, [orders, notices.orders, t])

  // Navigation — uses native view transitions where supported for shared-element motion.
  const transition = (fn: () => void) => {
    type VT = {
      ready: Promise<void>
      finished: Promise<void>
      updateCallbackDone: Promise<void>
      skipTransition: () => void
    }
    const d = document as Document & { startViewTransition?: (cb: () => void) => VT }
    if (!d.startViewTransition || reducedMotion() || document.hidden) {
      fn()
      return
    }
    let applied = false
    const apply = () => {
      if (applied) return
      applied = true
      flushSync(fn)
    }
    const vt = d.startViewTransition(apply)
    // Transitions can be skipped (e.g. duplicate names, hidden tab); the DOM update still applies.
    vt.ready.catch(() => {})
    vt.finished.catch(() => {})
    vt.updateCallbackDone.catch(() => {})
    // Never let a stalled transition (no rendering frames) block navigation.
    window.setTimeout(() => {
      if (!applied) {
        vt.skipTransition()
        apply()
      }
    }, 250)
  }

  const markOnboardedFor = (s: Screen) => {
    if (s === 'home') setHasOnboarded(true)
  }
  const go = (next: Screen) => {
    haptic()
    setSheet(null)
    markOnboardedFor(next)
    transition(() => {
      setHistory((h) => [...h.slice(-24), screen])
      setScreen(next)
    })
  }
  const goFromCheckout = (next: Screen) => {
    setCheckoutEditing(true)
    go(next)
  }
  const finishCheckoutEdit = () => {
    setCheckoutEditing(false)
    setSheet(null)
    transition(() => {
      setHistory((h) => {
        const idx = h.lastIndexOf('checkout')
        return idx >= 0 ? h.slice(0, idx) : h
      })
      setScreen('checkout')
    })
  }
  const openIntroReplay = (returnTo: Screen = 'settings') => {
    setReplayReturn(returnTo)
    go('onboarding')
  }
  const finishIntroReplay = () => {
    const target = replayReturn
    setReplayReturn(null)
    if (target) {
      transition(() => {
        setHistory((h) => {
          const idx = h.lastIndexOf(target)
          return idx >= 0 ? h.slice(0, idx) : h
        })
        setScreen(target)
      })
      return
    }
    go('signup')
  }
  const replace = (next: Screen) => {
    markOnboardedFor(next)
    transition(() => setScreen(next))
  }
  const back = () => {
    haptic()
    setCheckoutEditing(false)
    transition(() => {
      const prev = history[history.length - 1] ?? 'home'
      setHistory((h) => h.slice(0, -1))
      setScreen(prev)
    })
  }
  const switchTab = (tabTarget: TabId) => {
    if (tabTarget === screen) return
    haptic(6)
    setCheckoutEditing(false)
    setReplayReturn(null)
    markOnboardedFor(tabTarget)
    transition(() => {
      setHistory([])
      setScreen(tabTarget)
    })
  }
  const tab = (tabTarget: TabId) => {
    if (tabTarget === 'explore') setExploreFocus(false)
    switchTab(tabTarget)
  }
  const resetTo = (s: Screen) => {
    setCheckoutEditing(false)
    setReplayReturn(null)
    markOnboardedFor(s)
    transition(() => {
      setHistory([])
      setScreen(s)
    })
  }

  const toast = (message: string, tone: 'success' | 'error' | 'info' = 'success') => {
    window.clearTimeout(toastTimer.current)
    setToastState({ message, tone, id: Date.now() })
    toastTimer.current = window.setTimeout(() => setToastState(null), 2400)
  }
  const confirm = (spec: DialogSpec) => setDialog(spec)

  const navRef = useRef({
    dialog,
    sheet,
    history,
    screen,
    back,
    tab,
    resetTo,
    toast,
    t,
  })
  navRef.current = { dialog, sheet, history, screen, back, tab, resetTo, toast, t }

  const handleHardwareBack = useCallback((): boolean => {
    const cur = navRef.current
    if (cur.dialog) {
      setDialog(null)
      return true
    }
    if (cur.sheet) {
      setSheet(null)
      return true
    }
    if (cur.history.length > 0) {
      cur.back()
      return true
    }
    if (tabScreens.includes(cur.screen) && cur.screen !== 'home') {
      cur.tab('home')
      return true
    }
    if (cur.screen !== 'home' && cur.screen !== 'welcome' && cur.screen !== 'splash') {
      cur.resetTo('home')
      return true
    }

    const tapTime = Date.now()
    if (tapTime - lastBackExitTap.current < 2000) return false
    lastBackExitTap.current = tapTime
    cur.toast(cur.t('toast.pressBackExit'), 'info')
    return true
  }, [])

  // Cart & pricing
  const cartRestaurant = cart[0] ? findRestaurant(cart[0].restaurantId) : null
  const { cartCount, subtotal, deliveryFee, serviceFee, tax, discount, total } = useMemo(
    () => calculateTotals(cart, cartRestaurant, deliveryOption, promo),
    [cart, cartRestaurant, deliveryOption, promo],
  )

  const addToCart = (item: CartItem) =>
    setCart((c) =>
      c.some((i) => i.key === item.key)
        ? c.map((i) => (i.key === item.key ? { ...i, qty: i.qty + item.qty } : i))
        : [...c, item],
    )

  const tryAddToCart = (item: CartItem, onAdded?: () => void) => {
    if (isCrossRestaurantCart(cart, item.restaurantId)) {
      const currentName = findRestaurant(cart[0].restaurantId).name
      const nextName = findRestaurant(item.restaurantId).name
      confirm({
        title: t('dialog.newBagTitle'),
        message: t('dialog.newBagMessage', {
          current: currentName,
          next: nextName,
        }),
        confirm: t('dialog.newBagConfirm'),
        destructive: true,
        onConfirm: () => {
          setCart([item])
          setPromo('')
          haptic(14)
          onAdded?.()
        },
      })
      return
    }
    addToCart(item)
    onAdded?.()
  }

  const replaceCartItem = (key: string, item: CartItem) =>
    setCart((c) => {
      const withoutOld = c.filter((i) => i.key !== key)
      const existing = withoutOld.find((i) => i.key === item.key)
      if (existing) {
        return withoutOld.map((i) => (i.key === item.key ? { ...i, qty: i.qty + item.qty } : i))
      }
      return [...withoutOld, item]
    })

  const setQty = (key: string, qty: number) => {
    if (qty <= 0) {
      setCart((c) => c.filter((i) => i.key !== key))
      toast(t('toast.removedFromBag'), 'info')
    } else {
      setCart((c) => c.map((i) => (i.key === key ? { ...i, qty } : i)))
    }
  }

  const flyToCart = (from: HTMLElement | null, src: string, done?: () => void) => {
    const target = document.getElementById('cart-target') ?? document.getElementById('cart-fab')
    toast(t('toast.addedToBag'))
    if (!from || !target || reducedMotion()) {
      done?.()
      return
    }
    const a = from.getBoundingClientRect()
    const b = target.getBoundingClientRect()
    const ghost = document.createElement('img')
    ghost.src = src
    ghost.className = 'fly-ghost'
    Object.assign(ghost.style, {
      left: `${a.left}px`,
      top: `${a.top}px`,
      width: `${a.width}px`,
      height: `${a.height}px`,
    })
    document.body.appendChild(ghost)
    const dx = b.left + b.width / 2 - (a.left + a.width / 2)
    const dy = b.top + b.height / 2 - (a.top + a.height / 2)
    const anim = ghost.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1, borderRadius: '24px' },
        {
          transform: `translate(${dx * 0.6}px,${dy * 0.35 - 60}px) scale(.45)`,
          opacity: 1,
          borderRadius: '40%',
          offset: 0.55,
        },
        {
          transform: `translate(${dx}px,${dy}px) scale(${Math.max(0.06, 36 / a.width)})`,
          opacity: 0.2,
          borderRadius: '50%',
        },
      ],
      { duration: 720, easing: 'cubic-bezier(.45,.05,.35,1)' },
    )
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      ghost.remove()
      target.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }],
        { duration: 380, easing: 'cubic-bezier(.3,1.6,.5,1)' },
      )
      haptic(16)
      done?.()
    }
    anim.onfinish = finish
    window.setTimeout(finish, 900) // fallback when animations are paused (e.g. background tab)
  }

  const toggleFav = (kind: 'r' | 'd', id: string) => {
    const [list, set] = kind === 'r' ? [favR, setFavR] : [favD, setFavD]
    const on = list.includes(id)
    set(on ? list.filter((x) => x !== id) : [...list, id])
    haptic(on ? 6 : 14)
    toast(on ? t('toast.removedFavorite') : t('toast.savedFavorite'), on ? 'info' : 'success')
  }

  const openRestaurant = (id: string, el?: HTMLElement | null) => {
    const image = el?.querySelector('img')
    if (image) image.style.viewTransitionName = 'hero'
    setRestaurantId(id)
    go('restaurant')
  }
  const openDish = (id: string, el?: HTMLElement | null, editKey: string | null = null) => {
    const image = el?.querySelector('img')
    if (image) image.style.viewTransitionName = 'dish'
    setDishId(id)
    setEditingKey(editKey)
    go('food')
  }
  const openExplore = (opts: { cuisine?: string; focus?: boolean } = {}) => {
    setExploreCuisine(opts.cuisine ?? 'All')
    setExploreFocus(!!opts.focus)
    switchTab('explore')
  }

  // Schedule slots & Club metrics
  const scheduleSlots = useMemo(() => {
    void minuteTick
    return getUpcomingScheduleSlots(new Date())
  }, [minuteTick])
  const clubMetrics = useMemo(() => computeClubMetrics(orders, RESTAURANT_FEE_BY_ID), [orders])
  const averageRating = useMemo(() => computeAverageRating(orders), [orders])

  // Orders
  const setTrackingId = (id: string | null) => {
    setTrackingIdState(id)
    setReviewRating(0)
  }
  const setDetailId = (id: string) => {
    setDetailIdState(id)
    setReviewRating(0)
  }
  const stageOf = (o: Order, at: number = Date.now()) => resolveOrderStage(o, at)
  const elapsedOf = (o: Order, at: number = Date.now()) => resolveOrderElapsed(o, at)

  const placeOrder = () => {
    if (!cart.length) return
    const placedAt = Date.now()
    const existingIds = new Set(orders.map((o) => o.id))
    let id = ''
    do {
      id = `GB-${Math.floor(1000 + Math.random() * 9000)}`
    } while (existingIds.has(id))

    const narrowedOption: 0 | 1 | 2 = deliveryOption === 1 ? 1 : deliveryOption === 2 ? 2 : 0
    const effectiveSchedule =
      narrowedOption === 2
        ? scheduleSlots.includes(scheduleTime)
          ? scheduleTime
          : (scheduleSlots[0] ?? scheduleTime)
        : undefined

    const newOrder: Order = {
      id,
      restaurantId: cart[0].restaurantId,
      items: cart.map((i) => ({ ...i })),
      total,
      placedAt,
      status: 'active',
      date: formatOrderDate(placedAt, localeCode),
      addressLine: address.line1,
      deliveryOption: narrowedOption,
      ...(deliveryNote.trim() ? { deliveryNote: deliveryNote.trim() } : {}),
      ...(effectiveSchedule ? { scheduleTime: effectiveSchedule } : {}),
      ...(discount > 0 ? { discount } : {}),
    }

    setOrders((os) => [newOrder, ...os])
    setTrackingId(id)
    setDetailId(id)
    setCart([])
    setPromo('')
    setDeliveryOption(0)
    setCheckoutEditing(false)
    haptic(30)
    resetTo('confirmation')
  }

  const cancelOrder = (id: string) => {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: 'canceled' } : o)))
    toast(t('toast.orderCanceled'), 'info')
    resetTo('orders')
  }

  const completeOrder = (id: string) =>
    setOrders((os) =>
      os.map((o) =>
        o.id === id && o.status === 'active'
          ? { ...o, status: 'delivered', deliveredAt: o.deliveredAt ?? Date.now() }
          : o,
      ),
    )

  const markReviewed = (id: string, rating?: number) => {
    const resolvedRating =
      typeof rating === 'number' && rating >= 1 && rating <= 5
        ? rating
        : reviewRating >= 1 && reviewRating <= 5
          ? reviewRating
          : undefined
    setOrders((os) =>
      os.map((o) =>
        o.id === id
          ? {
              ...o,
              reviewed: true,
              ...(resolvedRating !== undefined ? { ratingGiven: resolvedRating } : {}),
            }
          : o,
      ),
    )
  }

  const reorder = (o: Order) => {
    const nextItems = o.items.map((i) => ({ ...i }))
    const totalCount = o.items.reduce((sum, i) => sum + i.qty, 0)
    const mergeOrSet = (replaceBag: boolean) => {
      setCart((prev) => {
        if (replaceBag || prev.length === 0) return nextItems
        const merged = prev.map((item) => ({ ...item }))
        for (const incoming of nextItems) {
          const existing = merged.find((item) => item.key === incoming.key)
          if (existing) {
            existing.qty += incoming.qty
          } else {
            merged.push(incoming)
          }
        }
        return merged
      })
      toast(t('toast.reordered', { count: totalCount }))
      go('cart')
    }
    if (isCrossRestaurantCart(cart, o.restaurantId)) {
      const currentName = findRestaurant(cart[0].restaurantId).name
      const nextName = findRestaurant(o.restaurantId).name
      confirm({
        title: t('dialog.newBagTitle'),
        message: t('dialog.newBagMessage', {
          current: currentName,
          next: nextName,
        }),
        confirm: t('dialog.newBagConfirm'),
        destructive: true,
        onConfirm: () => mergeOrSet(true),
      })
      return
    }
    mergeOrSet(false)
  }

  // Payments
  const addPaymentMethod = (method: PaymentMethod) => {
    const hydrated = hydratePaymentMethod(method)
    setPayments((prev) => [...prev.filter((p) => p.id !== hydrated.id), hydrated])
    setPaymentId(hydrated.id)
  }

  const deletePayment = (id: string) => {
    const target = payments.find((p) => p.id === id)
    if (!target || !target.removable) return
    const nextPayments = payments.filter((p) => p.id !== id)
    setPayments(nextPayments)
    if (paymentId === id) {
      setPaymentId(nextPayments[0]?.id ?? DEFAULT_PAYMENTS[0].id)
    }
    toast(t('toast.cardRemoved'), 'info')
  }

  // Addresses
  const address = addresses.find((x) => x.id === addressId) ?? addresses[0]

  const setDefaultAddress = (id: string) => {
    const target = addresses.find((x) => x.id === id)
    if (!target) return
    setAddressId(id)
    haptic(6)
    toast(t('toast.defaultAddress', { label: target.label }))
  }

  const startAddress = (returnTo: Screen, existing?: Address) => {
    setDraft(
      existing
        ? { ...existing, returnTo, isNew: false }
        : {
            id: `a${Date.now()}`,
            label: 'Home',
            line1: '',
            line2: 'Addis Ababa',
            apt: '',
            instructions: '',
            returnTo,
            isNew: true,
          },
    )
    go(existing ? 'address-edit' : 'address-search')
  }

  const saveAddress = () => {
    if (!draft) return
    const { returnTo, isNew, ...rawAddr } = draft
    const addr: Address = {
      ...rawAddr,
      label: rawAddr.label.trim() || 'Home',
      line1: rawAddr.line1.trim(),
      line2: rawAddr.line2.trim(),
      apt: rawAddr.apt.trim(),
      instructions: rawAddr.instructions.trim(),
    }
    const key = normalizeAddressKey(addr)
    const duplicate = addresses.find((x) => x.id !== addr.id && normalizeAddressKey(x) === key)

    let nextId = addr.id
    if (duplicate) {
      nextId = duplicate.id
      const merged: Address = { ...addr, id: duplicate.id }
      setAddresses((list) =>
        list.filter((x) => x.id !== addr.id).map((x) => (x.id === duplicate.id ? merged : x)),
      )
    } else if (isNew) {
      setAddresses((list) => [...list, addr])
    } else {
      setAddresses((list) => list.map((x) => (x.id === addr.id ? addr : x)))
    }

    setAddressId(nextId)
    toast(duplicate || !isNew ? t('toast.addressUpdated') : t('toast.addressAdded'))
    transition(() => {
      setHistory((h) => {
        const i = h.lastIndexOf(returnTo)
        return i >= 0 ? h.slice(0, i) : h
      })
      setScreen(returnTo)
    })
  }

  const deleteAddress = (id: string) => {
    if (addresses.length <= 1) return
    const nextAddresses = addresses.filter((x) => x.id !== id)
    setAddresses(nextAddresses)
    if (addressId === id) {
      setAddressId(nextAddresses[0]?.id ?? DEFAULT_ADDRESSES[0].id)
    }
    toast(t('toast.addressDeleted'), 'info')
    back()
  }

  // Support chat (replies are simulated in this prototype)
  const openChat = (topic: string, firstMessage?: string) => {
    window.clearTimeout(typingTimer.current)
    setTyping(false)
    setChatTopic(topic)
    const greetingText = topic === 'courier' ? t('chat.greetingCourier') : t('chat.greetingGeneral')
    const seed: ChatMessage[] = [{ from: 'agent', text: greetingText }]
    if (firstMessage) {
      seed.push({ from: 'me', text: firstMessage }, { from: 'agent', text: t('chat.introReply') })
    }
    setMessages(seed)
    go('chat')
  }

  const sendMessage = (m: ChatMessage) => {
    setMessages((ms) => [...ms, m])
    setTyping(true)
    haptic(6)
    const text = (m.text ?? '').toLowerCase()
    const quickDoor = t('chat.quick1').toLowerCase()

    let reply: string
    if (m.file || m.imageUrl) {
      reply = t('chat.reply1')
    } else if (m.intent === 'door') {
      reply = t('chat.reply2')
    } else if (m.intent === 'coming' || m.intent === 'call') {
      reply = t('chat.reply3')
    } else if (m.intent === 'refund') {
      reply = t('chat.reply4')
    } else if (m.intent === 'late') {
      reply = t('chat.reply5')
    } else if (chatTopic === 'courier') {
      reply =
        text.includes('door') || text.includes('leave') || text === quickDoor
          ? t('chat.reply2')
          : t('chat.reply3')
    } else if (text.includes('refund')) {
      reply = t('chat.reply4')
    } else if (text.includes('late') || text.includes('where')) {
      reply = t('chat.reply5')
    } else {
      reply = t('chat.reply6')
    }

    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => {
      setTyping(false)
      setMessages((ms) => [...ms, { from: 'agent', text: reply }])
    }, 1300)
  }

  const signOut = () => {
    setHasOnboarded(false)
    setCart([])
    setPromo('')
    setAuthEmail('')
    setDeliveryOption(0)
    setCheckoutEditing(false)
    setReplayReturn(null)
    resetTo('welcome')
    toast(t('toast.signedOut'), 'info')
  }

  return {
    screen,
    history,
    sheet,
    setSheet,
    dialog,
    setDialog,
    toastState,
    cart,
    favR,
    favD,
    promo,
    setPromo,
    deliveryNote,
    setDeliveryNote,
    restaurantId,
    dishId,
    editingKey,
    exploreCuisine,
    setExploreCuisine,
    exploreFocus,
    filters,
    setFilters,
    addresses,
    address,
    addressId,
    setAddressId,
    setDefaultAddress,
    draft,
    setDraft,
    payments,
    setPayments,
    paymentId,
    setPaymentId,
    addPaymentMethod,
    deletePayment,
    deliveryOption,
    setDeliveryOption,
    scheduleTime,
    setScheduleTime,
    scheduleSlots,
    checkoutEditing,
    setCheckoutEditing,
    goFromCheckout,
    finishCheckoutEdit,
    replayReturn,
    setReplayReturn,
    openIntroReplay,
    finishIntroReplay,
    orders,
    activeOrder,
    clubMetrics,
    averageRating,
    trackingId,
    setTrackingId,
    detailId,
    setDetailId,
    profile,
    setProfile,
    notices,
    setNotices,
    language,
    setLanguage,
    languageMeta,
    localeCode,
    dict,
    t,
    otpPurpose,
    setOtpPurpose,
    authEmail,
    setAuthEmail,
    chatTopic,
    messages,
    typing,
    faqOpen,
    setFaqOpen,
    reviewRating,
    setReviewRating,
    go,
    replace,
    back,
    tab,
    resetTo,
    handleHardwareBack,
    toast,
    confirm,
    cartCount,
    cartRestaurant,
    subtotal,
    deliveryFee,
    serviceFee,
    tax,
    discount,
    total,
    addToCart,
    tryAddToCart,
    replaceCartItem,
    setQty,
    clearCart: () => setCart([]),
    flyToCart,
    toggleFav,
    openRestaurant,
    openDish,
    openExplore,
    stageOf,
    elapsedOf,
    placeOrder,
    cancelOrder,
    completeOrder,
    markReviewed,
    reorder,
    startAddress,
    saveAddress,
    deleteAddress,
    openChat,
    sendMessage,
    signOut,
  }
}

export type Ctx = ReturnType<typeof useGebeta>
