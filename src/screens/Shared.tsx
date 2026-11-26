import { useState, type CSSProperties } from 'react'
import { findRestaurant, thumbOf, type Order, type Restaurant } from '../data'
import { computeOrderEtaMinutes } from '../domain/orders'
import { getCurrentPosition } from '../native'
import { useOrderNow, type Ctx } from '../store'
import { Button, FavButton, Icon, Img, Rolling, money, type IconName } from '../ui'

export function addressLabel(a: Ctx, label: string): string {
  if (label === 'Home') return a.t('addresses.home')
  if (label === 'Work') return a.t('addresses.work')
  if (label === 'Other') return a.t('addresses.other')
  return label
}

export function cuisineLabel(a: Ctx, c: string): string {
  switch (c) {
    case 'All':
      return a.t('cuisine.all')
    case 'Ethiopian':
      return a.t('cuisine.ethiopian')
    case 'Japanese':
      return a.t('cuisine.japanese')
    case 'Italian':
      return a.t('cuisine.italian')
    case 'Pizza':
      return a.t('cuisine.pizza')
    case 'Healthy':
      return a.t('cuisine.healthy')
    case 'Grill':
      return a.t('cuisine.grill')
    case 'Bakery':
      return a.t('cuisine.bakery')
    default:
      return c
  }
}

export const initials = (name: string) => {
  const clean = name.trim()
  if (!clean) return 'G'
  return clean
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export const vt = (name: string): CSSProperties => ({ viewTransitionName: name }) as CSSProperties

export function priceTierLabel(a: Ctx, price: number): string {
  if (price === 1) return a.t('price.budget')
  if (price === 2) return a.t('price.midrange')
  if (price === 3) return a.t('price.premium')
  return ''
}

export function stageCopy(a: Ctx, stage: number): { title: string; detail: string } {
  switch (stage) {
    case 0:
      return { title: a.t('stage.confirmedTitle'), detail: a.t('stage.confirmedDetail') }
    case 1:
      return { title: a.t('stage.preparingTitle'), detail: a.t('stage.preparingDetail') }
    case 2:
      return { title: a.t('stage.onWayTitle'), detail: a.t('stage.onWayDetail') }
    case 3:
      return { title: a.t('stage.nearTitle'), detail: a.t('stage.nearDetail') }
    default:
      return { title: a.t('stage.deliveredTitle'), detail: a.t('stage.deliveredDetail') }
  }
}

export function useGeolocation(a: Ctx, onSuccess: (lat: number, lng: number) => void) {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const request = async () => {
    setState('loading')
    try {
      const { lat, lng } = await getCurrentPosition()
      setState('idle')
      onSuccess(lat, lng)
    } catch {
      setState('error')
      a.toast(a.t('location.error'), 'error')
    }
  }
  return { state, request }
}

export function Avatar({ a, size = 'sm' }: { a: Ctx; size?: 'sm' | 'lg' }) {
  return (
    <span className={`avatar avatar-${size}`} aria-hidden="true">
      {a.profile.avatar ? <img src={a.profile.avatar} alt="" /> : initials(a.profile.name)}
    </span>
  )
}

export function SectionHead({
  title,
  detail,
  action,
  onAction,
}: {
  title: string
  detail?: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
      {action && (
        <button type="button" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  )
}

export function Empty({
  icon,
  title,
  text,
  action,
  onAction,
}: {
  icon: IconName
  title: string
  text: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={26} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <Button onClick={onAction}>{action}</Button>}
    </div>
  )
}

export function RestaurantCard({ a, r, compact }: { a: Ctx; r: Restaurant; compact?: boolean }) {
  return (
    <div className={`r-card-wrap ${compact ? 'compact' : ''}`}>
      <button
        type="button"
        className={`r-card press ${compact ? 'compact' : ''}`}
        onClick={(e) => a.openRestaurant(r.id, e.currentTarget)}
      >
        <div className="r-media">
          <Img
            src={r.thumb ?? r.image}
            alt={r.name}
            width={compact ? 160 : undefined}
            height={compact ? 152 : undefined}
          />
          <span className="r-chip glass-light">
            {r.fee
              ? `${money(r.fee)} ${a.t('costs.delivery').toLowerCase()}`
              : a.t('common.freeDelivery')}
          </span>
        </div>
        <div className="r-meta">
          <div>
            <h3>{r.name}</h3>
            <p>{r.type}</p>
          </div>
          <span className="rating">
            <Icon name="star" size={11} filled />
            {r.rating}
          </span>
        </div>
        <p className="r-time">
          <Icon name="clock" size={13} />
          {r.minutes[0]}–{r.minutes[1]} {a.t('common.min')}
          {'  ·  '}
          {priceTierLabel(a, r.price)}
        </p>
      </button>
      <FavButton
        glass
        saveLabel={a.t('favorites.save', { name: r.name })}
        removeLabel={a.t('favorites.remove', { name: r.name })}
        on={a.favR.includes(r.id)}
        onToggle={() => a.toggleFav('r', r.id)}
      />
    </div>
  )
}

export function Steps({ current, a }: { current: number; a?: Ctx }) {
  const labels = [
    a?.t('steps.address') ?? 'Address',
    a?.t('steps.delivery') ?? 'Delivery',
    a?.t('steps.payment') ?? 'Payment',
    a?.t('steps.review') ?? 'Review',
  ]
  const caption = a
    ? a.t('checkout.stepOf', { current: current + 1, total: labels.length })
    : `Step ${current + 1} of ${labels.length}`

  return (
    <div className="mb-3.5" aria-label={caption}>
      <p className="mono mb-1.5 text-[var(--muted)]">
        {caption} · {labels[current]}
      </p>
      <div className="steps !mb-0">
        {labels.map((s, i) => (
          <span
            key={s}
            className={`${i < current ? 'done' : i === current ? 'now' : ''} after:content-[''] after:h-[2px] after:flex-1 after:rounded-full ${i < current ? 'after:bg-[var(--ink)]' : i === current ? 'after:bg-[var(--tomato-ink)]/35' : 'after:bg-[var(--hair-2)]'} last:after:hidden min-[480px]:after:hidden`}
            aria-current={i === current ? 'step' : undefined}
          >
            <i>{i < current ? <Icon name="check" size={10} /> : i + 1}</i>
            <b className="font-semibold truncate max-[479px]:sr-only">{s}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

export function Costs({ a }: { a: Ctx }) {
  return (
    <section className="costs card">
      <p>
        <span>{a.t('costs.subtotal')}</span>
        <b>{money(a.subtotal)}</b>
      </p>
      <p>
        <span>
          {a.t('costs.delivery')}
          {a.deliveryOption === 1 ? ` · ${a.t('costs.priority')}` : ''}
        </span>
        <b className={a.deliveryFee ? '' : 'free'}>
          {a.deliveryFee ? money(a.deliveryFee) : a.t('common.free')}
        </b>
      </p>
      <p>
        <span>{a.t('costs.serviceFee')}</span>
        <b>{money(a.serviceFee)}</b>
      </p>
      <p>
        <span>{a.t('costs.vat')}</span>
        <b>{money(a.tax)}</b>
      </p>
      {a.promo && (
        <p className="discount">
          <span>
            {a.t('costs.promo')} · {a.promo}
          </span>
          <b>−{money(a.discount)}</b>
        </p>
      )}
      <p className="total">
        <span>{a.t('costs.total')}</span>
        <b>
          <Rolling value={money(a.total)} />
        </b>
      </p>
    </section>
  )
}

export function OrderRow({ a, o }: { a: Ctx; o: Order }) {
  const r = findRestaurant(o.restaurantId)
  const itemCount = o.items.reduce((s, i) => s + i.qty, 0)
  const statusLabel =
    o.status === 'canceled'
      ? a.t('status.canceled')
      : o.status === 'active'
        ? a.t('status.active')
        : a.t('status.delivered')

  return (
    <button
      type="button"
      className="order-row press"
      onClick={() => {
        a.setDetailId(o.id)
        a.go('order-detail')
      }}
    >
      <Img
        src={thumbOf(o.items[0].dishId) ?? o.items[0].thumb ?? o.items[0].image}
        alt=""
        width={56}
        height={56}
      />
      <div>
        <b>{r.name}</b>
        <span>
          {o.date} · {a.t(itemCount === 1 ? 'order.item' : 'order.items', { count: itemCount })} ·{' '}
          {money(o.total)}
        </span>
        <small className={`status ${o.status}`}>{statusLabel}</small>
      </div>
      <Icon name="chevron" size={16} />
    </button>
  )
}

export function LiveOrder({ a, o, compact }: { a: Ctx; o: Order; compact?: boolean }) {
  const now = useOrderNow(o)
  const st = a.stageOf(o, now)
  const r = findRestaurant(o.restaurantId)
  const mins = computeOrderEtaMinutes(o, r.minutes, a.elapsedOf(o, now))
  const itemCount = o.items.reduce((s, i) => s + i.qty, 0)
  const stage = stageCopy(a, st)

  return (
    <button
      type="button"
      className={`live-order press ${compact ? 'compact' : ''}`}
      onClick={() => {
        a.setTrackingId(o.id)
        a.go('tracking')
      }}
    >
      <div className="live-top">
        <span className={`pulse ${st >= 4 ? 'done' : ''}`} />
        <div>
          <small>
            {st >= 4
              ? a.t('status.delivered')
              : o.deliveryOption === 2 && o.scheduleTime
                ? a.t('tracking.scheduledFor', { time: o.scheduleTime })
                : `${a.t('tracking.arrivingIn')} ${mins} ${a.t('common.min')}`}
          </small>
          <h3>{st >= 4 ? a.t('tracking.rateOrder') : stage.title}</h3>
        </div>
        <Img
          src={thumbOf(o.items[0].dishId) ?? o.items[0].thumb ?? o.items[0].image}
          alt=""
          width={52}
          height={52}
        />
      </div>
      {!compact && (
        <p className="live-sub">
          {r.name} · {a.t(itemCount === 1 ? 'order.item' : 'order.items', { count: itemCount })} ·{' '}
          {money(o.total)}
        </p>
      )}
      <div className="segments">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={st > i ? 'full' : st === i ? 'fill' : ''} />
        ))}
      </div>
    </button>
  )
}
