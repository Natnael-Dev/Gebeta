import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { findRestaurant, thumbOf } from '../data'
import { computeOrderEtaMinutes } from '../domain/orders'
import { useOrderNow, type Ctx } from '../store'
import { Button, Header, HoldButton, Icon, Img, Rolling, TextArea, haptic } from '../ui'
import { Empty, LiveOrder, OrderRow, SectionHead, stageCopy } from './Shared'

export function Orders({ a }: { a: Ctx }) {
  const active = a.orders.filter((o) => o.status === 'active')
  const past = a.orders.filter((o) => o.status !== 'active')

  return (
    <div className="screen tab-screen">
      <h1 className="large-title">{a.t('orders.title')}</h1>
      {active.length ? (
        <>
          <SectionHead title={a.t('orders.inProgress')} />
          {active.map((o) => (
            <LiveOrder key={o.id} a={a} o={o} />
          ))}
        </>
      ) : (
        <div className="idle-card card">
          <span className="empty-icon">
            <Icon name="bag" size={22} />
          </span>
          <div>
            <b>{a.t('orders.idleTitle')}</b>
            <p>{a.t('orders.idleText')}</p>
          </div>
          <Button variant="ghost" onClick={() => a.openExplore()}>
            {a.t('nav.explore')}
          </Button>
        </div>
      )}
      <SectionHead
        title={a.t('orders.pastOrders')}
        action={a.t('common.seeAll')}
        onAction={() => a.go('history')}
      />
      <div className="card list stagger">
        {past.slice(0, 4).map((o) => (
          <OrderRow key={o.id} a={a} o={o} />
        ))}
      </div>
    </div>
  )
}

const ROUTE = 'M64 268 C 110 218 150 236 190 192 S 250 144 296 130 S 322 124 332 118'

export function Tracking({ a }: { a: Ctx }) {
  const o = a.orders.find((x) => x.id === a.trackingId) ?? a.activeOrder
  const path = useRef<SVGPathElement>(null)
  const [len, setLen] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const dragStartY = useRef<number | null>(null)
  const didDrag = useRef(false)

  useLayoutEffect(() => {
    if (path.current) setLen(path.current.getTotalLength())
  }, [o?.id])

  if (!o) {
    return (
      <div className="screen sub">
        <Header title={a.t('tracking.title')} backLabel={a.t('common.back')} onBack={a.back} />
        <Empty
          icon="receipt"
          title={a.t('tracking.noActiveTitle')}
          text={a.t('tracking.noActiveText')}
          action={a.t('cart.exploreKitchens')}
          onAction={() => a.openExplore()}
        />
      </div>
    )
  }

  const now = useOrderNow(o)
  const st = a.stageOf(o, now)
  const t = a.elapsedOf(o, now)
  const r = findRestaurant(o.restaurantId)
  const progress = o.status === 'delivered' ? 1 : Math.min(1, Math.max(0, (t - 2) / 2))
  const pt = path.current && len ? path.current.getPointAtLength(len * progress) : { x: 64, y: 268 }
  const mins = computeOrderEtaMinutes(o, r.minutes, t)
  const currentStage = stageCopy(a, Math.max(0, st))

  return (
    <div className="screen tracking">
      <div className="map bg-[#ebe6d8]">
        <svg
          viewBox="0 0 400 380"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Delivery map"
          role="img"
        >
          <rect x="-200" y="-200" width="800" height="800" className="map-bg" />
          {[-120, -40, 40, 120, 200, 280, 360, 440, 520].map((x) => (
            <path key={`v${x}`} d={`M${x} -200 L${x - 45} 600`} className="road" />
          ))}
          {[-120, -30, 60, 150, 240, 330, 420, 510].map((y) => (
            <path key={`h${y}`} d={`M-200 ${y} L600 ${y - 52}`} className="road" />
          ))}
          <rect
            x="210"
            y="190"
            width="80"
            height="60"
            rx="14"
            className="park"
            transform="rotate(-8 250 220)"
          />
          <path d={ROUTE} className="route-bg" />
          <path
            ref={path}
            d={ROUTE}
            className="route"
            style={{ strokeDasharray: len, strokeDashoffset: len * (1 - progress) }}
          />
          <g transform="translate(64 268)">
            <circle r="16" className="pin-r" />
            <text y="5" textAnchor="middle" className="pin-txt">
              {r.initial}
            </text>
          </g>
          <g transform="translate(332 118)">
            <circle r="16" className="pin-h" />
            <path d="M-6 2 0-4 6 2v6h-12Z" className="pin-house" />
          </g>
          {st >= 2 && st < 4 && (
            <g className="courier" style={{ transform: `translate(${pt.x}px, ${pt.y}px)` }}>
              <circle r="22" className="courier-halo" />
              <circle r="11" className="courier-dot" />
            </g>
          )}
        </svg>
        <div className="map-actions">
          <button
            type="button"
            className="glass-circle"
            onClick={a.back}
            aria-label={a.t('common.back')}
          >
            <Icon name="back" size={20} />
          </button>
          <span className="glass-light map-badge mono">{a.t('order.title', { id: o.id })}</span>
        </div>
      </div>

      <section className={`track-panel glass-light ${expanded ? 'expanded' : ''}`}>
        <button
          type="button"
          className="w-full min-h-[44px] py-3 -mt-2 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
          aria-expanded={expanded}
          aria-label={a.t(expanded ? 'tracking.collapseDetails' : 'tracking.expandDetails')}
          onPointerDown={(e) => {
            dragStartY.current = e.clientY
            didDrag.current = false
            e.currentTarget.setPointerCapture?.(e.pointerId)
          }}
          onPointerMove={(e) => {
            if (dragStartY.current === null) return
            const dy = e.clientY - dragStartY.current
            if (Math.abs(dy) > 8) didDrag.current = true
            if (dy < -30) {
              setExpanded(true)
              dragStartY.current = null
              haptic(6)
            } else if (dy > 30) {
              setExpanded(false)
              dragStartY.current = null
              haptic(6)
            }
          }}
          onPointerUp={() => {
            dragStartY.current = null
          }}
          onPointerCancel={() => {
            dragStartY.current = null
          }}
          onClick={() => {
            if (didDrag.current) {
              didDrag.current = false
              return
            }
            haptic(6)
            setExpanded((v) => !v)
          }}
        >
          <span className="sheet-handle !mb-0" />
        </button>

        {o.status === 'canceled' ? (
          <>
            <span className="kicker">{a.t('status.canceled')}</span>
            <h1 className="track-title">{a.t('tracking.canceledTitle')}</h1>
            <p className="lede">{a.t('tracking.canceledDesc')}</p>
          </>
        ) : (
          <>
            <span className={`kicker live ${st >= 4 ? 'done' : ''}`}>
              <i />
              {st >= 4 ? a.t('status.delivered') : a.t('tracking.live')}
            </span>
            <h1 className="track-title">
              {st >= 4 ? (
                a.t('tracking.enjoyMeal')
              ) : o.deliveryOption === 2 && o.scheduleTime ? (
                a.t('tracking.scheduledFor', { time: o.scheduleTime })
              ) : (
                <>
                  {st >= 2 ? '' : `${a.t('tracking.arrivingIn')} `}
                  <Rolling value={String(mins)} /> {a.t('common.min')}
                  {st >= 2 ? ` ${a.t('tracking.away')}` : ''}
                </>
              )}
            </h1>
            <p className="lede">
              {currentStage.detail} · {r.name}
            </p>
            <div className="segments big">
              {[0, 1, 2, 3].map((i) => (
                <i key={i} className={st > i ? 'full' : st === i ? 'fill' : ''} />
              ))}
            </div>

            {st >= 4 ? (
              <>
                <Button variant="accent" onClick={() => a.go('completed')}>
                  {a.t('tracking.rateOrder')}
                </Button>
                <div className="courier-card card mt-3">
                  <span className="courier-avatar">DM</span>
                  <div>
                    <small className="mono">{a.t('tracking.yourCourier')}</small>
                    <b>Dawit M.</b>
                    <span>{a.t('tracking.courierStats')}</span>
                  </div>
                  <button
                    type="button"
                    className="glass-circle small"
                    onClick={() => a.openChat('courier')}
                    aria-label={a.t('tracking.msgCourierLabel')}
                  >
                    <Icon name="message" size={17} />
                  </button>
                  <button
                    type="button"
                    className="glass-circle small"
                    onClick={() => a.setSheet('contact')}
                    aria-label={a.t('tracking.callCourierLabel')}
                  >
                    <Icon name="phone" size={17} />
                  </button>
                </div>
                <button type="button" className="link center" onClick={() => a.go('report')}>
                  {a.t('tracking.somethingWrong')}
                </button>
              </>
            ) : (
              <>
                <ol className="timeline">
                  {[0, 1, 2, 3, 4].map((i) => {
                    const stage = stageCopy(a, i)
                    return (
                      <li key={i} className={i < st ? 'done' : i === st ? 'now' : ''}>
                        <i>{i < st && <Icon name="check" size={11} />}</i>
                        <div>
                          <b>{stage.title}</b>
                          {i === st && <span>{stage.detail}</span>}
                        </div>
                      </li>
                    )
                  })}
                </ol>
                <div className="courier-card card">
                  <span className="courier-avatar">DM</span>
                  <div>
                    <small className="mono">{a.t('tracking.yourCourier')}</small>
                    <b>Dawit M.</b>
                    <span>{a.t('tracking.courierStats')}</span>
                  </div>
                  <button
                    type="button"
                    className="glass-circle small"
                    onClick={() => a.openChat('courier')}
                    aria-label={a.t('tracking.msgCourierLabel')}
                  >
                    <Icon name="message" size={17} />
                  </button>
                  <button
                    type="button"
                    className="glass-circle small"
                    onClick={() => a.setSheet('contact')}
                    aria-label={a.t('tracking.callCourierLabel')}
                  >
                    <Icon name="phone" size={17} />
                  </button>
                </div>
                {st < 2 ? (
                  <HoldButton
                    label={a.t('tracking.holdToCancel')}
                    holdingLabel={a.t('tracking.keepHolding')}
                    onConfirm={() => a.cancelOrder(o.id)}
                  />
                ) : (
                  <button type="button" className="link center" onClick={() => a.go('report')}>
                    {a.t('tracking.somethingWrong')}
                  </button>
                )}
                <p className="hint center">{a.t('tracking.protoHint')}</p>
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}

const REVIEW_TAG_KEYS = [
  'review.tag1',
  'review.tag2',
  'review.tag3',
  'review.tag4',
  'review.tag5',
  'review.tag6',
] as const

function reviewWords(a: Ctx): string[] {
  return [
    '',
    a.t('review.word1'),
    a.t('review.word2'),
    a.t('review.word3'),
    a.t('review.word4'),
    a.t('review.word5'),
  ]
}

export function Completed({ a }: { a: Ctx }) {
  const o = a.orders.find((x) => x.id === a.trackingId)
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')

  useEffect(() => {
    if (o && o.status === 'active') a.completeOrder(o.id)
    if (o) haptic(30)
  }, [])

  if (!o) {
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

  const deliveredTs = o.deliveredAt ?? (o.placedAt ? o.placedAt : undefined)
  const deliveredTime =
    deliveredTs && Number.isFinite(deliveredTs)
      ? new Date(deliveredTs).toLocaleTimeString(a.localeCode, {
          hour: 'numeric',
          minute: '2-digit',
        })
      : ''
  const deliveryInstructions = o.deliveryNote || a.deliveryNote || a.t('stage.deliveredDetail')
  const words = reviewWords(a)

  return (
    <div className="screen centered completed">
      <svg className="check-draw" viewBox="0 0 80 80" aria-hidden>
        <circle cx="40" cy="40" r="36" />
        <path d="m25 41 10 10 21-22" />
      </svg>
      <span className="kicker">
        {a.t('status.delivered')}
        {deliveredTime ? ` · ${deliveredTime}` : ''}
      </span>
      <h1 className="display">{a.t('completed.title')}</h1>
      <p className="lede">{deliveryInstructions}</p>
      <div className="confirm-art">
        <Img src={o.items[0].thumb ?? thumbOf(o.items[0].dishId) ?? o.items[0].image} alt="" />
      </div>
      <div className="stars big">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            className={n <= a.reviewRating ? 'on' : ''}
            onClick={() => {
              haptic(8)
              a.setReviewRating(n)
            }}
            aria-label={a.t(n === 1 ? 'review.starOne' : 'review.starMany', { count: n })}
          >
            <Icon name="star" size={30} filled={n <= a.reviewRating} />
          </button>
        ))}
      </div>
      {a.reviewRating > 0 ? (
        <div className="w-full text-start mt-2">
          <p className="rating-word">{words[a.reviewRating]}</p>
          <div className="chips wrap center">
            {REVIEW_TAG_KEYS.map((tagKey) => (
              <button
                type="button"
                key={tagKey}
                className={`chip ${tags.includes(tagKey) ? 'on' : ''}`}
                onClick={() =>
                  setTags((v) =>
                    v.includes(tagKey) ? v.filter((x) => x !== tagKey) : [...v, tagKey],
                  )
                }
              >
                {a.t(tagKey)}
              </button>
            ))}
          </div>
          <div className="card pad">
            <TextArea
              label={a.t('review.anythingElse')}
              value={note}
              onChange={setNote}
              placeholder={a.t('review.placeholder')}
            />
          </div>
          <div className="form-submit-inline">
            <Button
              onClick={() => {
                a.markReviewed(o.id, a.reviewRating)
                a.setReviewRating(0)
                a.toast(a.t('toast.reviewThanks'))
                a.resetTo('home')
              }}
            >
              {a.t('review.submit')}
            </Button>
          </div>
          <Button variant="ghost" onClick={() => a.resetTo('home')}>
            {a.t('completed.done')}
          </Button>
        </div>
      ) : (
        <>
          <Button onClick={() => a.go('review')}>{a.t('tracking.rateOrder')}</Button>
          <Button variant="ghost" onClick={() => a.resetTo('home')}>
            {a.t('completed.done')}
          </Button>
        </>
      )}
    </div>
  )
}

export function Review({ a }: { a: Ctx }) {
  const o = a.orders.find((x) => x.id === a.trackingId) ?? a.orders.find((x) => x.id === a.detailId)
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const r = o ? findRestaurant(o.restaurantId) : null
  const words = reviewWords(a)

  return (
    <div className="screen sub has-sticky review">
      <Header title={a.t('review.title')} backLabel={a.t('common.back')} onBack={a.back} />
      {o && (
        <Img
          src={o.items[0].thumb ?? thumbOf(o.items[0].dishId) ?? o.items[0].image}
          alt=""
          className="review-art"
        />
      )}
      <span className="kicker center">{r?.name}</span>
      <h1 className="display center">{a.t('review.howWasIt')}</h1>
      <div className="stars big">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            className={n <= a.reviewRating ? 'on' : ''}
            onClick={() => {
              haptic(8)
              a.setReviewRating(n)
            }}
            aria-label={a.t(n === 1 ? 'review.starOne' : 'review.starMany', { count: n })}
          >
            <Icon name="star" size={34} filled={n <= a.reviewRating} />
          </button>
        ))}
      </div>
      <p className="rating-word">{words[a.reviewRating] || a.t('review.tapToRate')}</p>
      <div className="chips wrap center">
        {REVIEW_TAG_KEYS.map((tagKey) => (
          <button
            type="button"
            key={tagKey}
            className={`chip ${tags.includes(tagKey) ? 'on' : ''}`}
            onClick={() =>
              setTags((v) => (v.includes(tagKey) ? v.filter((x) => x !== tagKey) : [...v, tagKey]))
            }
          >
            {a.t(tagKey)}
          </button>
        ))}
      </div>
      <div className="card pad">
        <TextArea
          label={a.t('review.anythingElse')}
          value={note}
          onChange={setNote}
          placeholder={a.t('review.placeholder')}
        />
      </div>
      <div className="sticky-bar glass-light keep-on-keyboard">
        <Button
          disabled={!a.reviewRating}
          onClick={() => {
            if (o) a.markReviewed(o.id, a.reviewRating)
            a.setReviewRating(0)
            a.toast(a.t('toast.reviewThanks'))
            a.resetTo('home')
          }}
        >
          {a.t('review.submit')}
        </Button>
      </div>
    </div>
  )
}
