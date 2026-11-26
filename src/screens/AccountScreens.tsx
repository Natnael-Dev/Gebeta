import { useEffect, useRef, useState } from 'react'
import { allDishes, campaignEthiopian, findRestaurant, places, restaurants, thumbOf } from '../data'
import { calculateTotals } from '../domain/cart'
import { LANGUAGES, createT, getLocalizedFaqs } from '../i18n'
import { isAndroidDevice, sendLocalNotification } from '../native'
import type { ChatIntent, Ctx } from '../store'
import {
  Button,
  FavButton,
  Field,
  Header,
  Icon,
  Img,
  Rolling,
  Row,
  TextArea,
  haptic,
  money,
  type IconName,
} from '../ui'
import { compressImageDataUrl } from '../utils/image'
import {
  Avatar,
  Empty,
  LiveOrder,
  OrderRow,
  RestaurantCard,
  addressLabel,
  useGeolocation,
} from './Shared'

export function Favorites({ a }: { a: Ctx }) {
  const [seg, setSeg] = useState<'r' | 'd'>('r')
  const rs = restaurants.filter((r) => a.favR.includes(r.id))
  const ds = allDishes.filter((d) => a.favD.includes(d.id))
  const dirSign = a.languageMeta.dir === 'rtl' ? -1 : 1

  return (
    <div className="screen tab-screen">
      <h1 className="large-title">{a.t('favorites.title')}</h1>
      <div className="segmented glass-light">
        <span
          className="seg-thumb"
          style={{ transform: `translateX(${seg === 'r' ? 0 : 100 * dirSign}%)` }}
        />
        <button type="button" className={seg === 'r' ? 'on' : ''} onClick={() => setSeg('r')}>
          {a.t('favorites.kitchens')} · {rs.length}
        </button>
        <button type="button" className={seg === 'd' ? 'on' : ''} onClick={() => setSeg('d')}>
          {a.t('favorites.dishes')} · {ds.length}
        </button>
      </div>
      {seg === 'r' ? (
        rs.length ? (
          <div className="r-list stagger">
            {rs.map((r) => (
              <RestaurantCard key={r.id} a={a} r={r} />
            ))}
          </div>
        ) : (
          <Empty
            icon="heart"
            title={a.t('favorites.noKitchensTitle')}
            text={a.t('favorites.noKitchensText')}
            action={a.t('cart.exploreKitchens')}
            onAction={() => a.openExplore()}
          />
        )
      ) : ds.length ? (
        <div className="dish-grid stagger">
          {ds.map((d) => (
            <div key={d.id} className="dish-tile-wrap">
              <button
                type="button"
                className="dish-tile press"
                onClick={(e) => a.openDish(d.id, e.currentTarget)}
              >
                <div className="dt-media">
                  <Img src={d.thumb ?? d.image} alt={d.name} />
                </div>
                <b>{d.name}</b>
                <span>
                  {findRestaurant(d.restaurantId).name} · {money(d.price)}
                </span>
              </button>
              <FavButton
                glass
                on
                saveLabel={a.t('favorites.save', { name: d.name })}
                removeLabel={a.t('favorites.remove', { name: d.name })}
                onToggle={() => a.toggleFav('d', d.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <Empty
          icon="heart"
          title={a.t('favorites.noDishesTitle')}
          text={a.t('favorites.noDishesText')}
          action={a.t('favorites.exploreDishes')}
          onAction={() => a.openExplore()}
        />
      )}
    </div>
  )
}

function clubTierLabel(a: Ctx, tier: 'Silver' | 'Gold' | 'Platinum'): string {
  if (tier === 'Platinum') return a.t('club.platinum')
  if (tier === 'Gold') return a.t('club.gold')
  return a.t('club.silver')
}

export function ClubCard({ a }: { a: Ctx }) {
  const ref = useRef<HTMLDivElement>(null)
  const { savedTotal, tier, deliveredCount, targetOrders, nextTier, progressPct } = a.clubMetrics

  const move = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    const b = el.getBoundingClientRect()
    const x = (e.clientX - b.left) / b.width - 0.5
    const y = (e.clientY - b.top) / b.height - 0.5
    el.style.setProperty('--rx', `${-y * 12}deg`)
    el.style.setProperty('--ry', `${x * 14}deg`)
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`)
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`)
  }

  const leave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <div className="club-wrap">
      <div ref={ref} className="club" onPointerMove={move} onPointerLeave={leave}>
        <div className="club-shine" />
        <div className="club-top">
          <span className="mono">{a.t('profile.clubName')}</span>
          <span className="club-tier">{clubTierLabel(a, tier)}</span>
        </div>
        <h3>
          <Rolling value={money(savedTotal)} /> {a.t('profile.clubSaved')}
        </h3>
        <p>{a.t('profile.clubSubtitle')}</p>
        <div
          className="club-progress"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={a.t('profile.clubName')}
        >
          <i style={{ width: `${progressPct}%` }} />
        </div>
        <div className="club-foot">
          <span>
            {nextTier
              ? a.t('profile.clubProgress', {
                  count: deliveredCount,
                  target: targetOrders,
                  next: clubTierLabel(a, nextTier),
                })
              : a.t('profile.clubMaxTier')}
          </span>
          <span className="mono">No. 0482</span>
        </div>
      </div>
    </div>
  )
}

export function Profile({ a }: { a: Ctx }) {
  const delivered = a.clubMetrics.deliveredCount
  const onCount = Object.values(a.notices).filter(Boolean).length
  const savedTotal = a.favR.length + a.favD.length
  const tiles: [IconName, string, string, () => void][] = [
    [
      'receipt',
      a.t('nav.orders'),
      a.t('profile.ordersTotal', { count: a.orders.length }),
      () => a.go('history'),
    ],
    [
      'heart',
      a.t('nav.saved'),
      a.t(savedTotal === 1 ? 'profile.savedOne' : 'profile.savedCount', { count: savedTotal }),
      () => a.tab('favorites'),
    ],
    [
      'pin',
      a.t('profile.addresses'),
      a.t(a.addresses.length === 1 ? 'profile.addressOne' : 'profile.addressesCount', {
        count: a.addresses.length,
      }),
      () => a.go('saved-addresses'),
    ],
    [
      'card',
      a.t('profile.wallet'),
      a.t(a.payments.length === 1 ? 'profile.walletOne' : 'profile.walletCount', {
        count: a.payments.length,
      }),
      () => a.go('saved-payments'),
    ],
  ]

  return (
    <div className="screen tab-screen profile min-[860px]:!pt-[calc(var(--safe-top)+18px)]">
      <div className="profile-grid">
        <div className="contents min-[860px]:flex min-[860px]:flex-col min-[860px]:gap-4">
          <section className="profile-hero min-[860px]:!mx-0 min-[860px]:!rounded-[32px]">
            <img className="ph-bg" src={campaignEthiopian} alt="" decoding="async" />
            <div className="ph-veil" />
            <div className="ph-top">
              <span className="mono light">{a.t('profile.memberSince')}</span>
              <button
                type="button"
                className="glass-circle"
                onClick={() => a.go('settings')}
                aria-label={a.t('profile.settings')}
              >
                <Icon name="gear" size={19} />
              </button>
            </div>
            <div className="ph-id">
              <Avatar a={a} size="lg" />
              <div>
                <h1>{a.profile.name}</h1>
                <p>{a.profile.email}</p>
              </div>
            </div>
            <button
              type="button"
              className="ph-edit glass-light press"
              onClick={() => a.setSheet('edit-profile')}
            >
              <Icon name="edit" size={15} />
              {a.t('profile.editProfile')}
            </button>
          </section>
          <div className="order-2 min-[860px]:order-none">
            <ClubCard a={a} />
          </div>
        </div>

        <div className="contents min-[860px]:block">
          <div className="stats card order-1 min-[860px]:order-none min-[860px]:!mt-0 min-[860px]:!mx-0">
            {[
              [delivered, a.t('profile.delivered')],
              [savedTotal, a.t('profile.saved')],
              [a.averageRating ? a.averageRating.toFixed(1) : '—', a.t('profile.yourRating')],
            ].map(([v, l]) => (
              <div key={String(l)}>
                <b>{v}</b>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <div className="order-3 min-[860px]:order-none">
            <div className="tiles stagger">
              {tiles.map(([icon, label, detail, fn]) => (
                <button type="button" key={label} className="tile glass-light press" onClick={fn}>
                  <span>
                    <Icon name={icon} size={19} />
                  </span>
                  <b>{label}</b>
                  <small>{detail}</small>
                </button>
              ))}
            </div>
            <p className="group-label">{a.t('profile.preferences')}</p>
            <div className="card list">
              <Row
                icon="bell"
                tone="butter"
                title={a.t('profile.notifications')}
                value={a.t('profile.noticesOn', { count: onCount })}
                onClick={() => a.go('notifications')}
              />
              <Row
                icon="globe"
                tone="cobalt"
                title={a.t('profile.language')}
                value={a.language}
                onClick={() => a.go('language')}
              />
              <Row
                icon="gear"
                tone="ink"
                title={a.t('profile.settings')}
                onClick={() => a.go('settings')}
              />
            </div>
            <p className="group-label">{a.t('profile.support')}</p>
            <div className="card list">
              <Row
                icon="help"
                tone="cobalt"
                title={a.t('profile.helpCenter')}
                onClick={() => a.go('help')}
              />
              <Row
                icon="message"
                tone="butter"
                title={a.t('profile.chatWithUs')}
                detail={a.t('profile.chatRepliesIn')}
                onClick={() => a.openChat('general')}
              />
              <Row
                icon="receipt"
                tone="tomato"
                title={a.t('profile.reportIssue')}
                onClick={() => a.go('report')}
              />
            </div>
            <div className="card list">
              <Row
                icon="logout"
                tone="tomato"
                danger
                title={a.t('profile.signOut')}
                onClick={() =>
                  a.confirm({
                    title: a.t('profile.signOutTitle'),
                    message: a.t('profile.signOutMessage'),
                    confirm: a.t('profile.signOut'),
                    destructive: true,
                    onConfirm: a.signOut,
                  })
                }
              />
            </div>
            <p className="version mono">
              {isAndroidDevice() ? a.t('app.versionAndroid') : a.t('app.versionWeb')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function History({ a }: { a: Ctx }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered' | 'canceled'>('all')
  const list = a.orders.filter((o) => filter === 'all' || o.status === filter)
  const tabs: ['all' | 'active' | 'delivered' | 'canceled', string][] = [
    ['all', a.t('orders.all')],
    ['active', a.t('orders.active')],
    ['delivered', a.t('orders.delivered')],
    ['canceled', a.t('orders.canceled')],
  ]
  const filterLabel = tabs.find(([key]) => key === filter)?.[1] ?? filter

  return (
    <div className="screen sub">
      <Header title={a.t('orders.history')} backLabel={a.t('common.back')} onBack={a.back} />
      <h1 className="large-title">{a.t('orders.historyTitle')}</h1>
      <div className="chips">
        {tabs.map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={`chip ${filter === key ? 'on' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="card list stagger">
          {list.map((o) => (
            <OrderRow key={o.id} a={a} o={o} />
          ))}
        </div>
      ) : (
        <Empty
          icon="receipt"
          title={
            filter === 'all'
              ? a.t('orders.idleTitle')
              : a.t('history.emptyFiltered', {
                  filter: filterLabel.toLocaleLowerCase(a.localeCode),
                })
          }
          text={a.t('orders.emptyHistory')}
        />
      )}
    </div>
  )
}

export function OrderDetail({ a }: { a: Ctx }) {
  const o = a.orders.find((x) => x.id === a.detailId)
  if (!o) {
    return (
      <div className="screen sub">
        <Header title={a.t('orders.title')} backLabel={a.t('common.back')} onBack={a.back} />
        <Empty
          icon="receipt"
          title={a.t('tracking.noActiveTitle')}
          text={a.t('tracking.noActiveText')}
        />
      </div>
    )
  }

  const r = findRestaurant(o.restaurantId)
  const itemCount = o.items.reduce((s, i) => s + i.qty, 0)
  const breakdown = calculateTotals(o.items, r, o.deliveryOption ?? 0, o.discount ? 'BITE20' : '')
  const discountAmount = o.discount ?? breakdown.discount
  const statusLabel =
    o.status === 'canceled'
      ? a.t('status.canceled')
      : o.status === 'active'
        ? a.t('status.active')
        : a.t('status.delivered')

  return (
    <div className="screen sub">
      <Header
        title={a.t('order.title', { id: o.id })}
        backLabel={a.t('common.back')}
        onBack={a.back}
      />
      <div className="od-head">
        <Img src={r.thumb ?? r.image} alt="" width={72} height={72} />
        <div>
          <span className={`status ${o.status}`}>{statusLabel}</span>
          <h1>{r.name}</h1>
          <p>
            {o.date} · {a.t(itemCount === 1 ? 'order.item' : 'order.items', { count: itemCount })} ·{' '}
            {o.addressLine ?? a.address.line1}
          </p>
          {o.deliveryNote && <p>{o.deliveryNote}</p>}
        </div>
      </div>
      {o.status === 'active' && <LiveOrder a={a} o={o} compact />}
      <div className="card summary">
        {o.items.map((i) => (
          <p key={i.key}>
            <span className="flex items-start gap-2.5 min-w-0">
              <Img
                src={i.thumb ?? thumbOf(i.dishId) ?? i.image}
                alt=""
                width={38}
                height={38}
                className="w-[38px] h-[38px] rounded-[10px] object-cover shrink-0 bg-[#e7e1d2]"
              />
              <span className="min-w-0">
                <em>{i.qty}×</em>
                {i.name}
                <small>{i.summary}</small>
              </span>
            </span>
            <b>{money(i.unit * i.qty)}</b>
          </p>
        ))}
      </div>
      <section className="costs card">
        <p>
          <span>{a.t('costs.subtotal')}</span>
          <b>{money(breakdown.subtotal)}</b>
        </p>
        <p>
          <span>
            {a.t('costs.delivery')}
            {o.deliveryOption === 1 ? ` · ${a.t('costs.priority')}` : ''}
          </span>
          <b className={breakdown.deliveryFee ? '' : 'free'}>
            {breakdown.deliveryFee ? money(breakdown.deliveryFee) : a.t('common.free')}
          </b>
        </p>
        <p>
          <span>{a.t('costs.serviceFee')}</span>
          <b>{money(breakdown.serviceFee)}</b>
        </p>
        <p>
          <span>{a.t('costs.vat')}</span>
          <b>{money(breakdown.tax)}</b>
        </p>
        {discountAmount > 0 && (
          <p className="discount">
            <span>{a.t('costs.promo')}</span>
            <b>−{money(discountAmount)}</b>
          </p>
        )}
        <p className="total">
          <span>{a.t('costs.total')}</span>
          <b>{money(o.total)}</b>
        </p>
      </section>
      <div className="stack">
        <Button variant="accent" onClick={() => a.reorder(o)}>
          {a.t('review.reorder')}
        </Button>
        {o.status === 'delivered' && !o.reviewed && (
          <Button
            variant="ghost"
            onClick={() => {
              a.setTrackingId(o.id)
              a.go('review')
            }}
          >
            {a.t('tracking.rateOrder')}
          </Button>
        )}
        <Button variant="ghost" onClick={() => a.go('report')}>
          {a.t('review.getHelp')}
        </Button>
      </div>
    </div>
  )
}

export function SavedAddresses({ a }: { a: Ctx }) {
  return (
    <div className="screen sub">
      <Header title={a.t('addresses.title')} backLabel={a.t('common.back')} onBack={a.back} />
      <h1 className="large-title">{a.t('addresses.title')}</h1>
      <div className="card list">
        {a.addresses.map((x, idx) => {
          const isDefault = a.addressId === x.id
          const icon: IconName = x.label === 'Work' ? 'bag' : x.label === 'Home' ? 'home' : 'pin'

          return (
            <div
              key={x.id}
              className={`addr-item-row flex items-center ${idx > 0 ? 'border-t border-[var(--hair)]' : ''}`}
            >
              <button
                type="button"
                className="row flex-1 min-w-0"
                onClick={() => a.startAddress('saved-addresses', x)}
              >
                <span className={`row-icon ${isDefault ? 'tomato' : 'ink'}`}>
                  <Icon name={icon} size={18} weight="fill" />
                </span>
                <span className="row-copy">
                  <b>
                    {addressLabel(a, x.label)}
                    {isDefault ? ` · ${a.t('common.default')}` : ''}
                  </b>
                  <small>
                    {x.line1}
                    {x.apt ? `, ${x.apt}` : ''}
                  </small>
                </span>
                <span className="row-chev">
                  <Icon name="chevron" size={16} />
                </span>
              </button>
              {!isDefault && (
                <button
                  type="button"
                  className="min-h-[44px] px-3 me-2 rounded-full text-[12px] font-semibold text-[var(--cobalt)] bg-[rgba(36,72,255,0.08)] hover:bg-[rgba(36,72,255,0.14)] shrink-0 whitespace-nowrap"
                  onClick={() => a.setDefaultAddress(x.id)}
                >
                  {a.t('addresses.setDefault')}
                </button>
              )}
            </div>
          )
        })}
      </div>
      <button
        type="button"
        className="add-row press"
        onClick={() => a.startAddress('saved-addresses')}
      >
        <Icon name="plus" size={17} />
        {a.t('checkout.addAddress')}
      </button>
    </div>
  )
}

export function AddressSearch({ a }: { a: Ctx }) {
  const [q, setQ] = useState('')
  const pick = (line1: string, line2: string) => {
    if (a.draft) a.setDraft({ ...a.draft, line1, line2 })
    a.go('address-map')
  }
  const geo = useGeolocation(a, (lat, lng) =>
    pick(a.t('location.currentArea'), `${lat.toFixed(4)}, ${lng.toFixed(4)}`),
  )
  const trimmed = q.trim()
  const hits = trimmed
    ? places.filter((p) => (p[0] + p[1]).toLowerCase().includes(trimmed.toLowerCase()))
    : places.slice(0, 3)

  return (
    <div className="screen sub">
      <Header title={a.t('addresses.new')} backLabel={a.t('common.back')} onBack={a.back} />
      <h1 className="large-title">{a.t('addresses.find')}</h1>
      <div className="search-field glass-light">
        <Icon name="search" size={19} />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={a.t('addresses.searchPlaceholder')}
          aria-label={a.t('addresses.searchPlaceholder')}
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label={a.t('common.clear')}>
            <Icon name="close" size={15} />
          </button>
        )}
      </div>
      <div className="card list">
        <button type="button" className="select-row" onClick={geo.request}>
          <span className="row-icon cobalt">
            {geo.state === 'loading' ? (
              <span className="spinner" />
            ) : (
              <Icon name="locate" size={18} />
            )}
          </span>
          <div>
            <b>{a.t('addresses.useCurrent')}</b>
            <span>
              {geo.state === 'error' ? a.t('location.unavailable') : a.t('location.gpsHint')}
            </span>
          </div>
        </button>
      </div>
      <p className="group-label">
        {trimmed ? a.t('addresses.results') : a.t('addresses.suggestions')}
      </p>
      {hits.length ? (
        <div className="card list">
          {hits.map((p) => (
            <Row
              key={p[0]}
              icon="pin"
              tone="ink"
              title={p[0]}
              detail={p[1]}
              onClick={() => pick(p[0], p[1])}
            />
          ))}
        </div>
      ) : (
        <div className="card list">
          <Row
            icon="pin"
            tone="tomato"
            title={a.t('addresses.useCustom', { query: trimmed })}
            detail={a.t('addresses.cityFallback')}
            onClick={() => pick(trimmed, a.t('addresses.cityFallback'))}
          />
        </div>
      )}
    </div>
  )
}

export function AddressMap({ a }: { a: Ctx }) {
  const clamp = (v: number) => Math.max(-120, Math.min(120, v))
  const [off, setOff] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState(false)
  const mapLayerRef = useRef<HTMLDivElement>(null)
  const offRef = useRef({ x: 0, y: 0 })
  const start = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const d = a.draft

  const geo = useGeolocation(a, (lat, lng) => {
    offRef.current = { x: 0, y: 0 }
    setOff({ x: 0, y: 0 })
    if (d) {
      a.setDraft({
        ...d,
        line1: a.t('location.currentArea'),
        line2: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      })
    }
    haptic(10)
  })

  const end = () => {
    if (!start.current) return
    const prev = start.current
    start.current = null
    setDrag(false)
    const finalOff = offRef.current
    setOff(finalOff)
    if (!d) return
    if (Math.abs(finalOff.x - prev.ox) + Math.abs(finalOff.y - prev.oy) > 30) {
      const p =
        places[
          (Math.abs(Math.round(finalOff.x / 40)) + Math.abs(Math.round(finalOff.y / 40))) %
            places.length
        ]
      a.setDraft({ ...d, line1: p[0], line2: p[1] })
      haptic(10)
    }
  }

  const nudge = (dx: number, dy: number) => {
    const nextOff = { x: clamp(off.x + dx), y: clamp(off.y + dy) }
    offRef.current = nextOff
    setOff(nextOff)
    if (!d) return
    const p =
      places[
        (Math.abs(Math.round(nextOff.x / 40)) + Math.abs(Math.round(nextOff.y / 40))) %
          places.length
      ]
    a.setDraft({ ...d, line1: p[0], line2: p[1] })
    haptic(10)
  }

  return (
    <div className="screen map-page">
      <div
        className="big-map"
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y }
          offRef.current = off
          setDrag(true)
          ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!start.current) return
          const next = {
            x: clamp(start.current.ox + e.clientX - start.current.x),
            y: clamp(start.current.oy + e.clientY - start.current.y),
          }
          offRef.current = next
          if (mapLayerRef.current) {
            mapLayerRef.current.style.transform = `translate(${next.x}px, ${next.y}px)`
          }
        }}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div
          ref={mapLayerRef}
          className="big-map-layer"
          style={{ transform: `translate(${off.x}px, ${off.y}px)` }}
        >
          <div className="map-grid" />
        </div>
        <span className={`center-pin ${drag ? 'lift' : ''}`}>
          <Icon name="pin" size={34} filled />
        </span>
        <span className="pin-shadow" />
      </div>
      <div className="map-actions">
        <button
          type="button"
          className="glass-circle"
          onClick={a.back}
          aria-label={a.t('common.back')}
        >
          <Icon name="back" size={20} />
        </button>
        <span className="glass-light map-badge mono">{a.t('addresses.dragMap')}</span>
      </div>
      <button
        type="button"
        className="glass-circle small fixed left-[max(16px,var(--safe-left))] bottom-[calc(var(--safe-bottom)+208px)] z-[25]"
        aria-label={a.t('addresses.useCurrent')}
        onClick={geo.request}
        disabled={geo.state === 'loading'}
      >
        {geo.state === 'loading' ? <span className="spinner" /> : <Icon name="locate" size={18} />}
      </button>
      <div
        dir="ltr"
        role="group"
        aria-label={a.t('addresses.nudgeLabel')}
        className="fixed right-[max(16px,var(--safe-right))] bottom-[calc(var(--safe-bottom)+208px)] z-[25] grid grid-cols-3 gap-1.5"
      >
        <button
          type="button"
          className="col-start-2 row-start-1 glass-circle small"
          aria-label={`${a.t('addresses.nudgeLabel')} (N)`}
          onClick={() => nudge(0, -40)}
        >
          <Icon name="arrowUp" size={16} />
        </button>
        <button
          type="button"
          className="col-start-1 row-start-2 glass-circle small"
          aria-label={`${a.t('addresses.nudgeLabel')} (W)`}
          onClick={() => nudge(-40, 0)}
        >
          <Icon name="arrowLeft" size={16} />
        </button>
        <button
          type="button"
          className="col-start-3 row-start-2 glass-circle small"
          aria-label={`${a.t('addresses.nudgeLabel')} (E)`}
          onClick={() => nudge(40, 0)}
        >
          <Icon name="arrowRight" size={16} />
        </button>
        <button
          type="button"
          className="col-start-2 row-start-3 glass-circle small"
          aria-label={`${a.t('addresses.nudgeLabel')} (S)`}
          onClick={() => nudge(0, 40)}
        >
          <Icon name="arrowDown" size={16} />
        </button>
      </div>
      <section className="map-card glass-light">
        <span className="kicker">{a.t('addresses.deliveryPin')}</span>
        <h2>{d?.line1 || a.t('addresses.chooseSpot')}</h2>
        <p>{d?.line2}</p>
        <Button onClick={() => a.go('address-edit')}>{a.t('addresses.confirmLocation')}</Button>
      </section>
    </div>
  )
}

export function AddressEdit({ a }: { a: Ctx }) {
  const d = a.draft
  const [err, setErr] = useState('')
  if (!d) {
    return (
      <div className="screen sub">
        <Header title={a.t('addresses.edit')} backLabel={a.t('common.back')} onBack={a.back} />
        <Empty
          icon="pin"
          title={a.t('addresses.noLocation')}
          text={a.t('addresses.find')}
          action={a.t('addresses.title')}
          onAction={() => a.go('saved-addresses')}
        />
      </div>
    )
  }

  const set = (k: 'label' | 'apt' | 'instructions' | 'line1') => (v: string) => {
    a.setDraft({ ...d, [k]: v })
    setErr('')
  }
  const labels: ['Home' | 'Work' | 'Other', string][] = [
    ['Home', a.t('addresses.home')],
    ['Work', a.t('addresses.work')],
    ['Other', a.t('addresses.other')],
  ]
  const labelIndex = Math.max(0, ['Home', 'Work', 'Other'].indexOf(d.label))
  const dirSign = a.languageMeta.dir === 'rtl' ? -1 : 1

  return (
    <div className="screen sub has-sticky">
      <Header
        title={d.isNew ? a.t('addresses.new') : a.t('addresses.edit')}
        backLabel={a.t('common.back')}
        onBack={a.back}
      />
      <h1 className="large-title">{a.t('addresses.details')}</h1>
      <button type="button" className="addr-summary card press" onClick={() => a.go('address-map')}>
        <span className="row-icon tomato">
          <Icon name="pin" size={18} />
        </span>
        <div>
          <b>{d.line1 || a.t('addresses.noLocation')}</b>
          <span>{d.line2}</span>
        </div>
        <em>{a.t('common.edit')}</em>
      </button>
      <p className="group-label">{a.t('addresses.label')}</p>
      <div className="segmented three glass-light">
        <span
          className="seg-thumb"
          style={{ transform: `translateX(${labelIndex * 100 * dirSign}%)` }}
        />
        {labels.map(([val, text]) => (
          <button
            type="button"
            key={val}
            className={d.label === val ? 'on' : ''}
            onClick={() => set('label')(val)}
          >
            {text}
          </button>
        ))}
      </div>
      <Field label={a.t('addresses.street')} value={d.line1} onChange={set('line1')} error={err} />
      <Field
        label={a.t('addresses.apt')}
        value={d.apt}
        onChange={set('apt')}
        placeholder={a.t('addresses.aptPlaceholder')}
      />
      <TextArea
        label={a.t('addresses.instructions')}
        value={d.instructions}
        onChange={set('instructions')}
        placeholder={a.t('addresses.notesPlaceholder')}
      />
      {!d.isNew && a.addresses.length > 1 && (
        <button
          type="button"
          className="link danger center"
          onClick={() =>
            a.confirm({
              title: a.t('addresses.deleteConfirmTitle'),
              message: a.t('addresses.deleteConfirmMsg', {
                label: addressLabel(a, d.label),
                line1: d.line1,
              }),
              confirm: a.t('common.delete'),
              destructive: true,
              onConfirm: () => a.deleteAddress(d.id),
            })
          }
        >
          {a.t('addresses.delete')}
        </button>
      )}
      <div className="sticky-bar glass-light keep-on-keyboard">
        <Button
          onClick={() =>
            d.line1.trim().length < 3 ? setErr(a.t('addresses.streetErr')) : a.saveAddress()
          }
        >
          {a.t('addresses.save')}
        </Button>
      </div>
    </div>
  )
}

export function Notifications({ a }: { a: Ctx }) {
  const n = a.notices
  const flip = (k: keyof typeof n) => a.setNotices({ ...n, [k]: !n[k] })
  const test = async () => {
    const result = await sendLocalNotification(a.t('app.name'), a.t('notifications.testBody'))
    if (result === 'sent') a.toast(a.t('toast.testNoticeSent'))
    else if (result === 'denied') a.toast(a.t('toast.enableNotices'), 'error')
    else a.toast(a.t('toast.noticesUnsupported'), 'error')
  }

  return (
    <div className="screen sub">
      <Header title={a.t('notifications.title')} backLabel={a.t('common.back')} onBack={a.back} />
      <h1 className="large-title">{a.t('notifications.title')}</h1>
      <p className="group-label">{a.t('notifications.ordersGroup')}</p>
      <div className="card list">
        <Row
          icon="receipt"
          tone="tomato"
          title={a.t('notifications.orderUpdates')}
          detail={a.t('notifications.orderUpdatesDetail')}
          toggle
          on={n.orders}
          onClick={() => flip('orders')}
        />
        <Row
          icon="message"
          tone="cobalt"
          title={a.t('notifications.courierMsgs')}
          detail={a.t('notifications.courierMsgsDetail')}
          toggle
          on={n.courier}
          onClick={() => flip('courier')}
        />
      </div>
      <p className="group-label">{a.t('notifications.discoveryGroup')}</p>
      <div className="card list">
        <Row
          icon="sparkle"
          tone="butter"
          title={a.t('notifications.picks')}
          detail={a.t('notifications.picksDetail')}
          toggle
          on={n.picks}
          onClick={() => flip('picks')}
        />
        <Row
          icon="gift"
          tone="ink"
          title={a.t('notifications.offers')}
          detail={a.t('notifications.offersDetail')}
          toggle
          on={n.offers}
          onClick={() => flip('offers')}
        />
      </div>
      <Button variant="ghost" onClick={test}>
        <Icon name="bell" size={17} />
        {a.t('notifications.sendTest')}
      </Button>
    </div>
  )
}

export function Settings({ a }: { a: Ctx }) {
  const activePm = a.payments.find((p) => p.id === a.paymentId)

  return (
    <div className="screen sub">
      <Header title={a.t('settings.title')} backLabel={a.t('common.back')} onBack={a.back} />
      <h1 className="large-title">{a.t('settings.title')}</h1>
      <p className="group-label">{a.t('settings.account')}</p>
      <div className="card list">
        <Row
          icon="user"
          tone="ink"
          title={a.t('profile.editProfile')}
          detail={a.profile.email}
          onClick={() => a.setSheet('edit-profile')}
        />
        <Row
          icon="pin"
          tone="tomato"
          title={a.t('profile.addresses')}
          value={String(a.addresses.length)}
          onClick={() => a.go('saved-addresses')}
        />
        <Row
          icon="card"
          tone="cobalt"
          logo={activePm?.logo}
          title={a.t('checkout.paymentMethods')}
          detail={activePm?.label}
          value={String(a.payments.length)}
          onClick={() => a.go('saved-payments')}
        />
      </div>
      <p className="group-label">{a.t('settings.app')}</p>
      <div className="card list">
        <Row
          icon="bell"
          tone="butter"
          title={a.t('profile.notifications')}
          onClick={() => a.go('notifications')}
        />
        <Row
          icon="translate"
          tone="cobalt"
          title={a.t('profile.language')}
          value={a.language}
          onClick={() => a.go('language')}
        />
        <Row
          icon="sparkle"
          tone="ink"
          title={a.t('settings.replayIntro')}
          onClick={() => a.openIntroReplay('settings')}
        />
      </div>
      <p className="group-label">{a.t('settings.support')}</p>
      <div className="card list">
        <Row
          icon="help"
          tone="cobalt"
          title={a.t('profile.helpCenter')}
          onClick={() => a.go('help')}
        />
      </div>
      <div className="card list">
        <Row
          icon="logout"
          tone="tomato"
          danger
          title={a.t('profile.signOut')}
          onClick={() =>
            a.confirm({
              title: a.t('profile.signOutTitle'),
              message: a.t('profile.signOutMessage'),
              confirm: a.t('profile.signOut'),
              destructive: true,
              onConfirm: a.signOut,
            })
          }
        />
      </div>
      <p className="version mono">
        {isAndroidDevice() ? a.t('app.versionAndroid') : a.t('app.versionWeb')}
      </p>
    </div>
  )
}

export function Language({ a }: { a: Ctx }) {
  const [pick, setPick] = useState(a.language)
  const [saving, setSaving] = useState(false)

  return (
    <div className="screen sub has-sticky">
      <Header title={a.t('language.title')} backLabel={a.t('common.back')} onBack={a.back} />
      <h1 className="large-title">{a.t('language.title')}</h1>
      <p className="lede">{a.t('language.note')}</p>
      <div className="card list">
        {LANGUAGES.map((lang) => (
          <button
            type="button"
            key={lang.name}
            className={`select-row ${pick === lang.name ? 'on' : ''}`}
            onClick={() => {
              haptic(6)
              setPick(lang.name)
            }}
          >
            <i className="radio">{pick === lang.name && <Icon name="check" size={12} />}</i>
            <div>
              <b>{lang.name}</b>
              <span>{lang.english}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="sticky-bar glass-light">
        <Button
          disabled={pick === a.language || saving}
          onClick={async () => {
            setSaving(true)
            try {
              await a.setLanguage(pick)
              const nextT = createT(pick)
              a.toast(nextT('toast.languageUpdated', { lang: pick }))
              a.back()
            } finally {
              setSaving(false)
            }
          }}
        >
          {a.t('common.save')}
        </Button>
      </div>
    </div>
  )
}

export function Help({ a }: { a: Ctx }) {
  const [q, setQ] = useState('')
  const localizedFaqs = getLocalizedFaqs(a.t)
  const hits = localizedFaqs
    .map((f, i) => [f, i] as const)
    .filter(([f]) => !q || (f[0] + f[1]).toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="screen sub">
      <Header title={a.t('help.title')} backLabel={a.t('common.back')} onBack={a.back} />
      <div className="help-hero">
        <span className="kicker">{a.t('help.support')}</span>
        <h1 className="display">
          {a.t('help.heroLine1')}
          <br />
          {a.t('help.heroLine2')}
        </h1>
      </div>
      <div className="search-field glass-light">
        <Icon name="search" size={19} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={a.t('help.searchPlaceholder')}
          aria-label={a.t('help.searchPlaceholder')}
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label={a.t('common.clear')}>
            <Icon name="close" size={15} />
          </button>
        )}
      </div>
      <div className="tiles two">
        {(
          [
            [
              'message',
              a.t('profile.chatWithUs'),
              a.t('profile.chatRepliesIn'),
              () => a.openChat('general'),
            ],
            [
              'receipt',
              a.t('profile.reportIssue'),
              a.t('report.missingDesc'),
              () => a.go('report'),
            ],
          ] as [IconName, string, string, () => void][]
        ).map(([i, t, d, fn]) => (
          <button type="button" key={t} className="tile glass-light press" onClick={fn}>
            <span>
              <Icon name={i} size={19} />
            </span>
            <b>{t}</b>
            <small>{d}</small>
          </button>
        ))}
      </div>
      <p className="group-label">
        {q ? a.t('help.resultsCount', { count: hits.length }) : a.t('help.popular')}
      </p>
      {hits.length ? (
        <div className="card list">
          {hits.map(([f, i]) => (
            <Row
              key={f[0]}
              icon="help"
              tone="ink"
              title={f[0]}
              onClick={() => {
                a.setFaqOpen(i)
                a.go('faq')
              }}
            />
          ))}
        </div>
      ) : (
        <Empty icon="search" title={a.t('help.noResultsTitle')} text={a.t('help.noResultsText')} />
      )}
    </div>
  )
}

export function Faq({ a }: { a: Ctx }) {
  const localizedFaqs = getLocalizedFaqs(a.t)

  return (
    <div className="screen sub">
      <Header title={a.t('help.faqTitle')} backLabel={a.t('common.back')} onBack={a.back} />
      <h1 className="large-title">{a.t('help.questionsTitle')}</h1>
      <div className="accordion">
        {localizedFaqs.map(([q, ans], i) => (
          <div key={q} className={`acc card ${a.faqOpen === i ? 'open' : ''}`}>
            <button
              type="button"
              onClick={() => {
                haptic(6)
                a.setFaqOpen(a.faqOpen === i ? -1 : i)
              }}
              aria-expanded={a.faqOpen === i}
            >
              <b>{q}</b>
              <Icon name="plus" size={17} />
            </button>
            <div className="acc-body">
              <p>{ans}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="lede center">
        {a.t('help.stillStuck')}{' '}
        <button type="button" className="link inline" onClick={() => a.openChat('general')}>
          {a.t('profile.chatWithUs')}
        </button>
      </p>
    </div>
  )
}

export function Chat({ a }: { a: Ctx }) {
  const [text, setText] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [a.messages.length, a.typing])

  const courier = a.chatTopic === 'courier'
  const send = () => {
    if (!text.trim()) return
    a.sendMessage({ from: 'me', text: text.trim() })
    setText('')
  }

  return (
    <div className="screen chat">
      <Header
        title=""
        backLabel={a.t('common.back')}
        onBack={a.back}
        action={
          <span className="chat-online">
            <i />
            {a.t('chat.online')}
          </span>
        }
      />
      <div className="chat-id">
        <span className={`chat-avatar ${courier ? 'courier' : ''}`}>{courier ? 'DM' : 'L'}</span>
        <b>{courier ? a.t('chat.courierName') : a.t('chat.supportName')}</b>
        <span className="hint">{a.t('chat.simulated')}</span>
      </div>
      <div className="bubbles">
        {a.messages.map((m, i) => (
          <div key={i} className={`bubble ${m.from}`}>
            {m.imageUrl && (
              <img className="chat-photo-preview" src={m.imageUrl} alt={m.file ?? 'Attachment'} />
            )}
            {m.file && (
              <span className="attach">
                <Icon name="paperclip" size={14} />
                {m.file}
              </span>
            )}
            {m.text}
          </div>
        ))}
        {a.typing && (
          <div className="bubble agent typing">
            <i />
            <i />
            <i />
          </div>
        )}
        <div ref={end} />
      </div>
      {courier && (
        <div className="chips quick-replies">
          {(
            [
              ['door', a.t('chat.quick1')],
              ['coming', a.t('chat.quick2')],
              ['call', a.t('chat.quick3')],
            ] as readonly [ChatIntent, string][]
          ).map(([intent, quick]) => (
            <button
              type="button"
              key={intent}
              className="chip"
              onClick={() => a.sendMessage({ from: 'me', text: quick, intent })}
            >
              {quick}
            </button>
          ))}
        </div>
      )}
      <div className="composer glass-light">
        <input
          ref={file}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label={a.t('chat.attach')}
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              const imageUrl = await compressImageDataUrl(f)
              a.sendMessage({ from: 'me', file: f.name, imageUrl })
            } catch {
              a.sendMessage({ from: 'me', file: f.name })
            }
          }}
        />
        <button
          type="button"
          className="glass-circle small"
          onClick={() => file.current?.click()}
          aria-label={a.t('chat.attach')}
        >
          <Icon name="paperclip" size={17} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={a.t('chat.placeholder')}
          aria-label={a.t('chat.placeholder')}
        />
        <button
          type="button"
          className="send"
          disabled={!text.trim()}
          onClick={send}
          aria-label={a.t('chat.send')}
        >
          <Icon name="send" size={16} />
        </button>
      </div>
    </div>
  )
}

export function Report({ a }: { a: Ctx }) {
  const [issue, setIssue] = useState('')
  const [detail, setDetail] = useState('')
  const issues: [string, string][] = [
    [a.t('report.late'), a.t('report.lateDesc')],
    [a.t('report.missing'), a.t('report.missingDesc')],
    [a.t('report.wrong'), a.t('report.wrongDesc')],
    [a.t('report.quality'), a.t('report.qualityDesc')],
    [a.t('report.courier'), a.t('report.courierDesc')],
    [a.t('report.other'), a.t('report.otherDesc')],
  ]

  return (
    <div className="screen sub has-sticky">
      <Header title={a.t('report.title')} backLabel={a.t('common.back')} onBack={a.back} />
      <h1 className="large-title">{a.t('report.heading')}</h1>
      <div className="card list">
        {issues.map(([t, d]) => (
          <button
            type="button"
            key={t}
            className={`select-row ${issue === t ? 'on' : ''}`}
            onClick={() => {
              haptic(6)
              setIssue(t)
            }}
          >
            <i className="radio">{issue === t && <Icon name="check" size={12} />}</i>
            <div>
              <b>{t}</b>
              <span>{d}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="card pad">
        <TextArea
          label={a.t('report.detailsLabel')}
          value={detail}
          onChange={setDetail}
          placeholder={a.t('report.detailsPlaceholder')}
        />
      </div>
      <div className="sticky-bar glass-light keep-on-keyboard">
        <Button
          disabled={!issue}
          onClick={() =>
            a.openChat('general', detail.trim() ? `${issue} — ${detail.trim()}` : issue)
          }
        >
          {a.t('report.continue')}
        </Button>
      </div>
    </div>
  )
}
