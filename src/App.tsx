import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { findDish, findRestaurant } from './data'
import type { Screen } from './domain/types'
import { initNativeShell, syncSystemBars } from './native'
import { authScreens, tabScreens, useGebeta } from './store'
import { Dialog, Icon, TabBar, Toast, type TabId } from './ui'

const Home = lazy(() => import('./screens/HomeScreen').then((m) => ({ default: m.Home })))
const Explore = lazy(() =>
  import('./screens/DiscoveryScreens').then((m) => ({ default: m.Explore })),
)
const RestaurantScreen = lazy(() =>
  import('./screens/DiscoveryScreens').then((m) => ({ default: m.RestaurantScreen })),
)
const Food = lazy(() => import('./screens/DiscoveryScreens').then((m) => ({ default: m.Food })))

const Splash = lazy(() => import('./screens/AuthScreens').then((m) => ({ default: m.Splash })))
const Welcome = lazy(() => import('./screens/AuthScreens').then((m) => ({ default: m.Welcome })))
const Onboarding = lazy(() =>
  import('./screens/AuthScreens').then((m) => ({ default: m.Onboarding })),
)
const AuthForm = lazy(() => import('./screens/AuthScreens').then((m) => ({ default: m.AuthForm })))
const Location = lazy(() => import('./screens/AuthScreens').then((m) => ({ default: m.Location })))

const Cart = lazy(() => import('./screens/OrderingScreens').then((m) => ({ default: m.Cart })))
const AddressStep = lazy(() =>
  import('./screens/OrderingScreens').then((m) => ({ default: m.AddressStep })),
)
const DeliveryStep = lazy(() =>
  import('./screens/OrderingScreens').then((m) => ({ default: m.DeliveryStep })),
)
const PaymentStep = lazy(() =>
  import('./screens/OrderingScreens').then((m) => ({ default: m.PaymentStep })),
)
const Checkout = lazy(() =>
  import('./screens/OrderingScreens').then((m) => ({ default: m.Checkout })),
)
const Confirmation = lazy(() =>
  import('./screens/OrderingScreens').then((m) => ({ default: m.Confirmation })),
)

const Orders = lazy(() => import('./screens/TrackingScreens').then((m) => ({ default: m.Orders })))
const Tracking = lazy(() =>
  import('./screens/TrackingScreens').then((m) => ({ default: m.Tracking })),
)
const Completed = lazy(() =>
  import('./screens/TrackingScreens').then((m) => ({ default: m.Completed })),
)
const Review = lazy(() => import('./screens/TrackingScreens').then((m) => ({ default: m.Review })))

const Favorites = lazy(() =>
  import('./screens/AccountScreens').then((m) => ({ default: m.Favorites })),
)
const Profile = lazy(() => import('./screens/AccountScreens').then((m) => ({ default: m.Profile })))
const History = lazy(() => import('./screens/AccountScreens').then((m) => ({ default: m.History })))
const OrderDetail = lazy(() =>
  import('./screens/AccountScreens').then((m) => ({ default: m.OrderDetail })),
)
const SavedAddresses = lazy(() =>
  import('./screens/AccountScreens').then((m) => ({ default: m.SavedAddresses })),
)
const AddressSearch = lazy(() =>
  import('./screens/AccountScreens').then((m) => ({ default: m.AddressSearch })),
)
const AddressMap = lazy(() =>
  import('./screens/AccountScreens').then((m) => ({ default: m.AddressMap })),
)
const AddressEdit = lazy(() =>
  import('./screens/AccountScreens').then((m) => ({ default: m.AddressEdit })),
)
const Notifications = lazy(() =>
  import('./screens/AccountScreens').then((m) => ({ default: m.Notifications })),
)
const Settings = lazy(() =>
  import('./screens/AccountScreens').then((m) => ({ default: m.Settings })),
)
const Language = lazy(() =>
  import('./screens/AccountScreens').then((m) => ({ default: m.Language })),
)
const Help = lazy(() => import('./screens/AccountScreens').then((m) => ({ default: m.Help })))
const Faq = lazy(() => import('./screens/AccountScreens').then((m) => ({ default: m.Faq })))
const Chat = lazy(() => import('./screens/AccountScreens').then((m) => ({ default: m.Chat })))
const Report = lazy(() => import('./screens/AccountScreens').then((m) => ({ default: m.Report })))

const SheetHost = lazy(() => import('./screens/SheetHost').then((m) => ({ default: m.SheetHost })))

const AUTH_FLOW_SCREENS = new Set(['signup', 'login', 'forgot', 'otp', 'reset-password'])

function CompactBar({
  screen,
  detail,
  title,
  addressLine1,
  backLabel,
  modalOpen,
  onBack,
  onAddress,
  showSetterRef,
}: {
  screen: Screen
  detail: boolean
  title: string | null
  addressLine1: string
  backLabel: string
  modalOpen: boolean
  onBack: () => void
  onAddress: () => void
  showSetterRef: MutableRefObject<((show: boolean) => void) | null>
}) {
  const [compactShown, setCompactShown] = useState(false)
  showSetterRef.current = setCompactShown

  if (!compactShown || (!title && screen !== 'home')) return null

  return (
    <div
      className={`compact-bar glass-light show ${detail ? 'desktop-detail-hidden' : ''}`}
      inert={modalOpen}
      aria-hidden={modalOpen || undefined}
    >
      {detail && (
        <button
          type="button"
          className="glass-circle small"
          onClick={onBack}
          aria-label={backLabel}
        >
          <Icon name="back" size={18} />
        </button>
      )}
      {screen === 'home' ? (
        <button type="button" className="compact-home press" onClick={onAddress}>
          <Icon name="pin" size={13} />
          {addressLine1}
        </button>
      ) : (
        <strong>{title}</strong>
      )}
      {detail && <span className="cb-spacer" />}
    </div>
  )
}

function AppContent() {
  const a = useGebeta()
  const [exploreQuery, setExploreQuery] = useState('')
  const shellRef = useRef<HTMLElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const compactSetterRef = useRef<((show: boolean) => void) | null>(null)
  const scrolledRef = useRef(false)
  const scrollYRef = useRef(0)
  const scrollMapRef = useRef<Map<string, number>>(new Map())
  const prevScreenRef = useRef<Screen>(a.screen)
  const prevHistoryRef = useRef<Screen[]>(a.history)

  useLayoutEffect(() => {
    const prevScreen = prevScreenRef.current
    const prevHistory = prevHistoryRef.current
    const nextHistory = a.history

    if (prevScreen !== a.screen) {
      if (nextHistory.length > prevHistory.length) {
        scrollMapRef.current.set(prevScreen, scrollYRef.current)
      } else if (nextHistory.length === 0 && prevHistory.length === 0) {
        scrollMapRef.current.delete(a.screen)
      }
    }

    const isBack =
      prevScreen !== a.screen &&
      nextHistory.length < prevHistory.length &&
      prevHistory[nextHistory.length] === a.screen
    const restoreY = isBack ? (scrollMapRef.current.get(a.screen) ?? 0) : 0

    if (scroller.current) {
      scroller.current.scrollTo(0, restoreY)
      if (restoreY > 0) {
        requestAnimationFrame(() => {
          if (scroller.current && scroller.current.scrollTop !== restoreY) {
            scroller.current.scrollTo(0, restoreY)
          }
        })
      }
    }

    scrollYRef.current = restoreY
    const threshold = a.screen === 'home' ? 96 : 44
    const nextScrolled = restoreY > threshold
    scrolledRef.current = nextScrolled
    shellRef.current?.classList.toggle('scrolled', nextScrolled)
    compactSetterRef.current?.(nextScrolled)

    prevScreenRef.current = a.screen
    prevHistoryRef.current = nextHistory
  }, [a.screen, a.history])

  useEffect(() => initNativeShell({ onBack: a.handleHardwareBack }), [a.handleHardwareBack])

  useEffect(() => {
    const darkTop =
      a.screen === 'splash' ||
      a.screen === 'welcome' ||
      a.screen === 'profile' ||
      a.screen === 'restaurant' ||
      a.screen === 'food'
    const darkBottom = a.screen === 'splash' || a.screen === 'welcome'
    syncSystemBars(darkTop, darkBottom)
  }, [a.screen])

  const onFocusCapture = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.target
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      window.setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 260)
    }
  }

  const s = a.screen

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const y = e.currentTarget.scrollTop
    scrollYRef.current = y
    const threshold = s === 'home' ? 96 : 44
    const next = y > threshold
    if (next !== scrolledRef.current) {
      scrolledRef.current = next
      shellRef.current?.classList.toggle('scrolled', next)
      compactSetterRef.current?.(next)
    }
  }

  const isTab = tabScreens.includes(s)
  const detail = s === 'restaurant' || s === 'food'
  const modalOpen = Boolean(a.sheet || a.dialog)

  const tabLabels = useMemo(
    () => ({
      home: a.t('nav.home'),
      explore: a.t('nav.explore'),
      orders: a.t('nav.orders'),
      favorites: a.t('nav.saved'),
      profile: a.t('nav.profile'),
    }),
    [a.t],
  )

  const screens: Record<string, () => ReactNode> = {
    splash: () => <Splash a={a} />,
    welcome: () => <Welcome a={a} />,
    onboarding: () => <Onboarding a={a} />,
    location: () => <Location a={a} />,
    home: () => <Home a={a} />,
    explore: () => <Explore a={a} q={exploreQuery} setQ={setExploreQuery} />,
    restaurant: () => <RestaurantScreen a={a} />,
    food: () => <Food key={a.dishId + (a.editingKey ?? '')} a={a} />,
    cart: () => <Cart a={a} />,
    addresses: () => <AddressStep a={a} />,
    delivery: () => <DeliveryStep a={a} />,
    payments: () => <PaymentStep a={a} />,
    checkout: () => <Checkout a={a} />,
    confirmation: () => <Confirmation a={a} />,
    orders: () => <Orders a={a} />,
    tracking: () => <Tracking a={a} />,
    completed: () => <Completed a={a} />,
    review: () => <Review a={a} />,
    favorites: () => <Favorites a={a} />,
    profile: () => <Profile a={a} />,
    history: () => <History a={a} />,
    'order-detail': () => <OrderDetail a={a} />,
    'saved-addresses': () => <SavedAddresses a={a} />,
    'saved-payments': () => <PaymentStep a={a} manage />,
    notifications: () => <Notifications a={a} />,
    settings: () => <Settings a={a} />,
    language: () => <Language a={a} />,
    'address-search': () => <AddressSearch a={a} />,
    'address-map': () => <AddressMap a={a} />,
    'address-edit': () => <AddressEdit a={a} />,
    help: () => <Help a={a} />,
    faq: () => <Faq a={a} />,
    chat: () => <Chat a={a} />,
    report: () => <Report a={a} />,
  }

  const isAuthFlow = authScreens.includes(s) && AUTH_FLOW_SCREENS.has(s)
  const render = isAuthFlow
    ? () => <AuthForm key="auth-flow" a={a} />
    : (screens[s] ?? screens.home)
  const pageKey = isAuthFlow ? 'auth-flow' : s

  const compactTitles: Partial<Record<string, string>> = {
    explore: a.t('nav.explore'),
    orders: a.t('nav.orders'),
    favorites: a.t('nav.saved'),
    profile: a.t('nav.profile'),
  }
  const compact =
    isTab && s !== 'home'
      ? (compactTitles[s] ?? null)
      : detail
        ? s === 'restaurant'
          ? findRestaurant(a.restaurantId).name
          : findDish(a.dishId).name
        : null

  return (
    <main ref={shellRef} className="shell" onFocusCapture={onFocusCapture}>
      <div className="ambient" aria-hidden />
      <div
        className="scroller"
        ref={scroller}
        onScroll={onScroll}
        inert={modalOpen}
        aria-hidden={modalOpen || undefined}
      >
        <div key={pageKey} className="page">
          <Suspense fallback={<div className="screen" />}>{render()}</Suspense>
        </div>
      </div>

      <CompactBar
        screen={s}
        detail={detail}
        title={compact}
        addressLine1={a.address.line1}
        backLabel={a.t('common.back')}
        modalOpen={modalOpen}
        onBack={a.back}
        onAddress={() => a.go('saved-addresses')}
        showSetterRef={compactSetterRef}
      />

      {isTab && (
        <div inert={modalOpen} aria-hidden={modalOpen || undefined}>
          <TabBar
            active={s as TabId}
            onSelect={a.tab}
            cartCount={a.cartCount}
            onCart={() => a.go('cart')}
            activeOrder={!!a.activeOrder && a.stageOf(a.activeOrder) < 4}
            labels={tabLabels}
            navLabel={a.t('ui.mainNav')}
            bagLabel={`${a.t('nav.bag')}, ${a.t(a.cartCount === 1 ? 'order.item' : 'order.items', {
              count: a.cartCount,
            })}`}
          />
        </div>
      )}

      {a.sheet && (
        <Suspense fallback={null}>
          <SheetHost key={a.sheet} a={a} exploreQuery={exploreQuery} />
        </Suspense>
      )}
      {a.dialog && (
        <Dialog
          spec={a.dialog}
          onClose={() => a.setDialog(null)}
          cancelLabel={a.t('common.cancel')}
        />
      )}
      {a.toastState && (
        <Toast key={a.toastState.id} message={a.toastState.message} tone={a.toastState.tone} />
      )}
    </main>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}
