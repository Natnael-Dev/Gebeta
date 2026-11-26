import { useEffect, useRef, useState } from 'react'
import { findRestaurant, lineItem, PRICING, thumbOf } from '../data'
import type { PaymentMethod } from '../domain/types'
import type { Ctx } from '../store'
import { Button, Header, Icon, Img, Rolling, Row, Stepper, haptic, money } from '../ui'
import { Costs, Empty, SectionHead, Steps, addressLabel } from './Shared'

export function Cart({ a }: { a: Ctx }) {
  const r = a.cartRestaurant
  if (!a.cart.length) {
    return (
      <div className="screen sub">
        <Header title={a.t('cart.title')} backLabel={a.t('common.back')} onBack={a.back} />
        <Empty
          icon="bag"
          title={a.t('cart.emptyTitle')}
          text={a.t('cart.emptyText')}
          action={a.t('cart.exploreKitchens')}
          onAction={() => a.openExplore()}
        />
      </div>
    )
  }

  const pairings = r ? r.menu.filter((d) => !a.cart.some((i) => i.dishId === d.id)).slice(0, 3) : []

  return (
    <div className="screen sub has-sticky">
      <Header
        title={a.t('cart.title')}
        backLabel={a.t('common.back')}
        onBack={a.back}
        action={
          <button
            type="button"
            className="text-btn"
            onClick={() =>
              a.confirm({
                title: a.t('cart.clearTitle'),
                message: a.t('cart.clearMessage'),
                confirm: a.t('cart.clearConfirm'),
                destructive: true,
                onConfirm: () => {
                  a.clearCart()
                  a.toast(a.t('toast.bagCleared'), 'info')
                },
              })
            }
          >
            {a.t('common.clear')}
          </button>
        }
      />
      <h1 className="large-title">{a.t('cart.yourBag')}</h1>
      <div className="split-detail">
        <div>
          {r && (
            <button type="button" className="from-row press" onClick={() => a.openRestaurant(r.id)}>
              <span className="mono-logo">{r.initial}</span>
              <div>
                <b>{r.name}</b>
                <span>
                  {r.minutes[0]}–{r.minutes[1]} {a.t('common.min')} ·{' '}
                  {a.t(a.cartCount === 1 ? 'order.item' : 'order.items', { count: a.cartCount })}
                </span>
              </div>
              <Icon name="chevron" size={16} />
            </button>
          )}
          <div className="card cart-list">
            {a.cart.map((i) => (
              <div key={i.key} className="cart-item">
                <Img src={i.thumb ?? thumbOf(i.dishId) ?? i.image} alt="" width={64} height={64} />
                <div className="ci-copy">
                  <b>{i.name}</b>
                  <p>{i.summary}</p>
                  <button type="button" onClick={() => a.openDish(i.dishId, null, i.key)}>
                    {a.t('common.edit')}
                  </button>
                </div>
                <div className="ci-end">
                  <b>{money(i.unit * i.qty)}</b>
                  <Stepper small min={0} value={i.qty} onChange={(n) => a.setQty(i.key, n)} />
                </div>
              </div>
            ))}
          </div>
          {pairings.length > 0 && (
            <>
              <SectionHead title={a.t('cart.pairings')} />
              <div className="pairings">
                {pairings.map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    className="pairing press"
                    onClick={(e) => {
                      const imgEl = e.currentTarget.querySelector('img')
                      a.tryAddToCart(lineItem(d, 1, d.option.choices[0], []), () =>
                        a.flyToCart(imgEl, d.image),
                      )
                    }}
                  >
                    <Img src={d.thumb ?? d.image} alt="" width={140} height={108} />
                    <b>{d.name}</b>
                    <span>{money(d.price)}</span>
                    <i>
                      <Icon name="plus" size={14} />
                    </i>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="split-sticky">
          <div className="card list">
            <Row
              icon="edit"
              tone="butter"
              title={a.t('cart.deliveryInstructions')}
              detail={a.deliveryNote || a.t('cart.addCourierNote')}
              onClick={() => a.setSheet('instructions')}
            />
            <Row
              icon="gift"
              tone="tomato"
              title={a.promo ? a.t('cart.promoApplied', { code: a.promo }) : a.t('cart.addPromo')}
              detail={
                a.promo ? a.t('cart.youSave', { amount: money(a.discount) }) : a.t('cart.tryPromo')
              }
              onClick={() => a.setSheet('promo')}
            />
          </div>
          <Costs a={a} />
        </div>
      </div>

      <div className="sticky-bar glass-light column">
        <p className="sticky-note">
          <Icon name="pin" size={14} />
          {a.address.line1} · {r?.minutes[0]}–{r?.minutes[1]} {a.t('common.min')}
        </p>
        <Button variant="accent" onClick={() => a.go('addresses')}>
          <span className="split">
            <span>{a.t('cart.checkout')}</span>
            <b>
              <Rolling value={money(a.total)} />
            </b>
          </span>
        </Button>
      </div>
    </div>
  )
}

export function AddressStep({ a }: { a: Ctx }) {
  return (
    <div className="screen sub has-sticky">
      <Header title={a.t('checkout.title')} backLabel={a.t('common.back')} onBack={a.back} />
      <Steps current={0} a={a} />
      <h1 className="large-title">{a.t('checkout.whereTo')}</h1>
      <div className="mini-map card">
        <div className="map-grid" />
        <span className="map-pin-big">
          <Icon name="pin" size={22} filled />
        </span>
        <span className="map-tag glass-light">{a.address.line1}</span>
      </div>
      <div className="card list">
        {a.addresses.map((x) => (
          <button
            type="button"
            key={x.id}
            className={`select-row ${a.addressId === x.id ? 'on' : ''}`}
            onClick={() => {
              haptic(6)
              a.setAddressId(x.id)
            }}
          >
            <i className="radio">{a.addressId === x.id && <Icon name="check" size={12} />}</i>
            <div>
              <b>{addressLabel(a, x.label)}</b>
              <span>
                {x.line1}
                {x.apt ? `, ${x.apt}` : ''}
              </span>
            </div>
          </button>
        ))}
      </div>
      <button type="button" className="add-row press" onClick={() => a.startAddress('addresses')}>
        <Icon name="plus" size={17} />
        {a.t('checkout.addAddress')}
      </button>
      <div className="sticky-bar glass-light">
        <Button onClick={() => (a.checkoutEditing ? a.finishCheckoutEdit() : a.go('delivery'))}>
          {a.checkoutEditing ? a.t('checkout.doneEditing') : a.t('checkout.deliverHere')}
        </Button>
      </div>
    </div>
  )
}

export function DeliveryStep({ a }: { a: Ctx }) {
  const r = a.cartRestaurant
  const standardWindow = r
    ? `${r.minutes[0]}–${r.minutes[1]} ${a.t('common.min')}`
    : a.t('checkout.standardDesc')
  const opts = [
    [a.t('checkout.standard'), standardWindow, a.t('checkout.included')],
    [a.t('checkout.priority'), a.t('checkout.priorityDesc'), `+${money(PRICING.priorityFee)}`],
    [a.t('checkout.schedule'), a.t('checkout.scheduleDesc'), a.t('common.free')],
  ]
  const activeSlot = a.scheduleSlots.includes(a.scheduleTime) ? a.scheduleTime : a.scheduleSlots[0]

  return (
    <div className="screen sub has-sticky">
      <Header title={a.t('checkout.title')} backLabel={a.t('common.back')} onBack={a.back} />
      <Steps current={1} a={a} />
      <h1 className="large-title">{a.t('checkout.when')}</h1>
      <div className="option-cards">
        {opts.map((o, i) => (
          <button
            type="button"
            key={o[0]}
            className={`option-card press ${a.deliveryOption === i ? 'on' : ''}`}
            onClick={() => {
              haptic(6)
              a.setDeliveryOption(i)
            }}
          >
            <span className="oc-icon">
              <Icon name={i === 0 ? 'clock' : i === 1 ? 'sparkle' : 'bell'} size={18} />
            </span>
            <div>
              <b>{o[0]}</b>
              <span>{o[1]}</span>
            </div>
            <em>{o[2]}</em>
          </button>
        ))}
      </div>
      {a.deliveryOption === 2 && (
        <div className="chips wrap">
          {a.scheduleSlots.map((slot) => (
            <button
              type="button"
              key={slot}
              className={`chip ${activeSlot === slot ? 'on' : ''}`}
              onClick={() => a.setScheduleTime(slot)}
            >
              {slot}
            </button>
          ))}
        </div>
      )}
      <div className="card list">
        <Row
          icon="edit"
          tone="butter"
          title={a.t('cart.deliveryInstructions')}
          detail={a.deliveryNote || a.t('cart.addCourierNote')}
          onClick={() => a.setSheet('instructions')}
        />
      </div>
      <div className="sticky-bar glass-light">
        <Button onClick={() => (a.checkoutEditing ? a.finishCheckoutEdit() : a.go('payments'))}>
          {a.checkoutEditing ? a.t('checkout.doneEditing') : a.t('checkout.continuePayment')}
        </Button>
      </div>
    </div>
  )
}

function paymentLabel(a: Ctx, p: PaymentMethod): string {
  return p.id === 'telebirr' ? a.t('payment.telebirrLabel') : p.label
}

function paymentDetail(a: Ctx, p: PaymentMethod): string {
  return p.id === 'telebirr' ? a.t('payment.telebirrDetail') : p.detail
}

export function PaymentStep({ a, manage }: { a: Ctx; manage?: boolean }) {
  const pm = a.payments.find((p) => p.id === a.paymentId) ?? a.payments[0]
  const isCash = pm?.kind === 'cash'

  return (
    <div className={`screen sub ${manage ? '' : 'has-sticky'}`}>
      <Header
        title={manage ? a.t('checkout.paymentMethods') : a.t('checkout.title')}
        backLabel={a.t('common.back')}
        onBack={a.back}
      />
      {!manage && <Steps current={2} a={a} />}
      <h1 className="large-title">{manage ? a.t('checkout.wallet') : a.t('checkout.howToPay')}</h1>
      <div
        className={`wallet-card ${
          isCash
            ? '!bg-[linear-gradient(135deg,#2b2922_0%,#171611_100%)] !shadow-[var(--shadow-2)]'
            : ''
        }`}
      >
        <div className="wc-shine" />
        <span className="mono">{isCash ? a.t('payment.cashBadge') : a.t('checkout.wallet')}</span>
        {pm?.logo ? (
          <span className="wc-logo">
            <img src={pm.logo} alt="" />
          </span>
        ) : (
          isCash && (
            <span className="wc-logo !bg-white/15 !text-[var(--butter)] !shadow-none">
              <Icon name="money" size={18} weight="fill" />
            </span>
          )
        )}
        <b>{pm ? paymentLabel(a, pm) : ''}</b>
        <span>{a.profile.name}</span>
        {pm && pm.id === a.paymentId && <span className="wc-default">{a.t('common.default')}</span>}
      </div>
      <div className="card list">
        {a.payments.map((p, idx) => {
          const label = paymentLabel(a, p)
          return (
            <div
              key={p.id}
              className={`payment-row flex items-center ${idx > 0 ? 'border-t border-[var(--hair)]' : ''}`}
            >
              <button
                type="button"
                className={`select-row flex-1 min-w-0 ${a.paymentId === p.id ? 'on' : ''}`}
                onClick={() => {
                  haptic(6)
                  a.setPaymentId(p.id)
                  if (manage) a.toast(a.t('toast.defaultPayment', { label }))
                }}
              >
                <i className="radio">{a.paymentId === p.id && <Icon name="check" size={12} />}</i>
                <span className={`pm-logo ${p.logo ? 'brand' : ''}`}>
                  {p.logo ? (
                    <img src={p.logo} alt="" />
                  ) : (
                    <Icon name={p.kind === 'cash' ? 'money' : 'card'} size={18} weight="fill" />
                  )}
                </span>
                <div>
                  <b>{label}</b>
                  <span>{paymentDetail(a, p)}</span>
                </div>
              </button>
              {p.removable && (
                <button
                  type="button"
                  className="min-w-[44px] min-h-[44px] grid place-items-center shrink-0 me-2 rounded-full text-[var(--muted)] hover:text-[var(--tomato)] active:scale-90 transition"
                  aria-label={a.t('payment.removeCard')}
                  onClick={() =>
                    a.confirm({
                      title: a.t('card.removeTitle'),
                      message: a.t('card.removeMessage', { label }),
                      confirm: a.t('common.delete'),
                      destructive: true,
                      onConfirm: () => a.deletePayment(p.id),
                    })
                  }
                >
                  <Icon name="trash" size={17} />
                </button>
              )}
            </div>
          )
        })}
      </div>
      <button type="button" className="add-row press" onClick={() => a.setSheet('add-card')}>
        <Icon name="plus" size={17} />
        {a.t('checkout.addCard')}
      </button>
      {!manage && (
        <div className="sticky-bar glass-light">
          <Button onClick={() => (a.checkoutEditing ? a.finishCheckoutEdit() : a.go('checkout'))}>
            {a.checkoutEditing ? a.t('checkout.doneEditing') : a.t('checkout.reviewOrder')}
          </Button>
        </div>
      )}
    </div>
  )
}

export function Checkout({ a }: { a: Ctx }) {
  const [placing, setPlacing] = useState(false)
  const placeTimer = useRef(0)
  useEffect(() => () => window.clearTimeout(placeTimer.current), [])

  const r = a.cartRestaurant
  const pm = a.payments.find((p) => p.id === a.paymentId)
  if (!a.cart.length || !r) {
    return (
      <div className="screen sub">
        <Header title={a.t('checkout.title')} backLabel={a.t('common.back')} onBack={a.back} />
        <Empty
          icon="bag"
          title={a.t('cart.emptyTitle')}
          text={a.t('cart.emptyText')}
          action={a.t('cart.exploreKitchens')}
          onAction={() => a.openExplore()}
        />
      </div>
    )
  }

  const effectiveSlot = a.scheduleSlots.includes(a.scheduleTime)
    ? a.scheduleTime
    : (a.scheduleSlots[0] ?? a.scheduleTime)

  const eta =
    a.deliveryOption === 2
      ? effectiveSlot
      : a.deliveryOption === 1
        ? `15–20 ${a.t('common.min')}`
        : `${r.minutes[0]}–${r.minutes[1]} ${a.t('common.min')}`

  const deliveryLabel = [
    a.t('checkout.standard'),
    a.t('checkout.priority'),
    `${a.t('checkout.schedule')} · ${effectiveSlot}`,
  ][a.deliveryOption]

  const pmLabel = pm ? paymentLabel(a, pm) : a.t('checkout.howToPay')

  return (
    <div className="screen sub has-sticky">
      <Header title={a.t('checkout.title')} backLabel={a.t('common.back')} onBack={a.back} />
      <Steps current={3} a={a} />
      <h1 className="large-title">{a.t('checkout.looksGood')}</h1>
      <section className="eta">
        <span className="mono">{a.t('checkout.arriving')}</span>
        <h2>{eta}</h2>
        <p>{r.name}</p>
        <div className="h-[3px] w-16 mt-4 rounded-full bg-[var(--butter)]/80" aria-hidden="true" />
      </section>
      <div className="card list">
        <Row
          icon="pin"
          tone="cobalt"
          title={a.address.line1}
          detail={`${a.address.apt ? `${a.address.apt} · ` : ''}${a.deliveryNote || a.t('cart.addCourierNote')}`}
          onClick={() => a.goFromCheckout('addresses')}
        />
        <Row
          icon="clock"
          tone="butter"
          title={deliveryLabel}
          detail={a.deliveryFee ? money(a.deliveryFee) : a.t('common.free')}
          onClick={() => a.goFromCheckout('delivery')}
        />
        <Row
          icon="card"
          tone="tomato"
          title={pmLabel}
          detail={pm ? paymentDetail(a, pm) : undefined}
          onClick={() => a.goFromCheckout('payments')}
        />
      </div>
      <div className="card summary">
        {a.cart.map((i) => (
          <p key={i.key}>
            <span>
              <em>{i.qty}×</em>
              {i.name}
              <small>{i.summary}</small>
            </span>
            <b>{money(i.unit * i.qty)}</b>
          </p>
        ))}
      </div>
      <Costs a={a} />
      <p className="fine">{a.t('checkout.prototypeFine')}</p>
      <div className="sticky-bar glass-light">
        <Button
          variant="accent"
          loading={placing}
          onClick={() => {
            if (placing) return
            setPlacing(true)
            placeTimer.current = window.setTimeout(a.placeOrder, 220)
          }}
        >
          <span className="split">
            <span>
              {pm?.kind === 'wallet'
                ? a.t('checkout.payWith', { method: pmLabel })
                : pm?.kind === 'cash'
                  ? a.t('checkout.placeOrderCash')
                  : a.t('checkout.placeOrder')}
            </span>
            <b>
              <Rolling value={money(a.total)} />
            </b>
          </span>
        </Button>
      </div>
    </div>
  )
}

export function Confirmation({ a }: { a: Ctx }) {
  const o = a.orders.find((x) => x.id === a.trackingId)
  const r = o ? findRestaurant(o.restaurantId) : null
  if (!o || !r) {
    return (
      <div className="screen sub">
        <Header title={a.t('orders.title')} backLabel={a.t('common.back')} onBack={a.back} />
        <Empty
          icon="receipt"
          title={a.t('tracking.noActiveTitle')}
          text={a.t('tracking.noActiveText')}
          action={a.t('confirm.backHome')}
          onAction={() => a.resetTo('home')}
        />
      </div>
    )
  }

  const itemCount = o.items.reduce((s, i) => s + i.qty, 0)

  return (
    <div className="screen centered confirm">
      <svg className="check-draw" viewBox="0 0 80 80" aria-hidden>
        <circle cx="40" cy="40" r="36" />
        <path d="m25 41 10 10 21-22" />
      </svg>
      <span className="kicker">{a.t('order.title', { id: o.id })}</span>
      <h1 className="display">{a.t('confirm.title')}</h1>
      <p className="lede">{a.t('confirm.subtitle', { restaurant: r.name })}</p>
      <div className="confirm-art">
        <Img src={o.items[0].thumb ?? thumbOf(o.items[0].dishId) ?? o.items[0].image} alt="" />
        <span className="glass-light mono">
          {a.t(itemCount === 1 ? 'order.item' : 'order.items', { count: itemCount })} ·{' '}
          {money(o.total)}
        </span>
      </div>
      <Button onClick={() => a.replace('tracking')}>{a.t('confirm.trackOrder')}</Button>
      <Button variant="ghost" onClick={() => a.resetTo('home')}>
        {a.t('confirm.backHome')}
      </Button>
    </div>
  )
}
