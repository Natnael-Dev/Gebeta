import { useRef, useState } from 'react'
import {
  allDishes,
  cuisines,
  findDish,
  findRestaurant,
  lineItem,
  PRICING,
  restaurants,
} from '../data'
import { isCrossRestaurantCart } from '../domain/cart'
import { filterRestaurants, type Ctx } from '../store'
import {
  Button,
  Choice,
  FavButton,
  Icon,
  Img,
  Rolling,
  Stepper,
  TextArea,
  haptic,
  money,
} from '../ui'
import { Empty, RestaurantCard, SectionHead, cuisineLabel, vt } from './Shared'

function sortLabel(a: Ctx, sort: string): string {
  switch (sort) {
    case 'Fastest delivery':
      return a.t('filters.sortFastest')
    case 'Top rated':
      return a.t('filters.sortTopRated')
    case 'Lowest fee':
      return a.t('filters.sortLowestFee')
    default:
      return a.t('filters.sortRecommended')
  }
}

export function Explore({ a, q, setQ }: { a: Ctx; q: string; setQ: (v: string) => void }) {
  const results = filterRestaurants(q, a.exploreCuisine, a.filters)
  const ql = q.trim().toLowerCase()
  const dishHits = ql
    ? allDishes
        .filter(
          (d) =>
            d.name.toLowerCase().includes(ql) ||
            d.desc.toLowerCase().includes(ql) ||
            (d.local ? d.local.toLowerCase().includes(ql) : false),
        )
        .slice(0, 4)
    : []
  const activeFilters =
    (a.filters.sort !== 'Recommended' ? 1 : 0) +
    (a.filters.price ? 1 : 0) +
    (a.filters.free ? 1 : 0)

  return (
    <div className="screen tab-screen">
      <h1 className="large-title">{a.t('explore.title')}</h1>
      <div className="search-field glass-light">
        <Icon name="search" size={19} />
        <input
          autoFocus={a.exploreFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={a.t('explore.searchPlaceholder')}
          aria-label={a.t('explore.searchPlaceholder')}
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label={a.t('common.clear')}>
            <Icon name="close" size={15} />
          </button>
        )}
      </div>
      <div className="chips">
        <button
          type="button"
          className={`chip ${activeFilters ? 'on' : ''}`}
          onClick={() => a.setSheet('filters')}
        >
          <Icon name="filter" size={15} />
          {a.t('explore.filters')}
          {activeFilters > 0 && <em>{activeFilters}</em>}
        </button>
        {cuisines.map((c) => (
          <button
            type="button"
            key={c}
            className={`chip ${a.exploreCuisine === c ? 'on' : ''}`}
            onClick={() => {
              haptic(6)
              a.setExploreCuisine(c)
            }}
          >
            {cuisineLabel(a, c)}
          </button>
        ))}
      </div>
      {dishHits.length > 0 && (
        <>
          <SectionHead
            title={a.t('explore.dishes')}
            detail={a.t(dishHits.length === 1 ? 'explore.match' : 'explore.matches', {
              count: dishHits.length,
            })}
          />
          <div className="dish-hits card">
            {dishHits.map((d) => (
              <button
                type="button"
                key={d.id}
                className="quick press"
                onClick={(e) => a.openDish(d.id, e.currentTarget)}
              >
                <Img src={d.thumb ?? d.image} alt="" width={54} height={54} />
                <div>
                  <b>{d.name}</b>
                  <span>{findRestaurant(d.restaurantId).name}</span>
                </div>
                <em>{money(d.price)}</em>
              </button>
            ))}
          </div>
        </>
      )}
      <SectionHead
        title={
          q
            ? a.t('explore.kitchens')
            : a.exploreCuisine === 'All'
              ? a.t('explore.topPicks')
              : cuisineLabel(a, a.exploreCuisine)
        }
        detail={`${a.t(results.length === 1 ? 'explore.place' : 'explore.places', {
          count: results.length,
        })}${a.filters.sort !== 'Recommended' ? ` · ${sortLabel(a, a.filters.sort)}` : ''}`}
      />
      {results.length ? (
        <div className="r-grid stagger">
          {results.map((r) => (
            <RestaurantCard key={r.id} a={a} r={r} />
          ))}
        </div>
      ) : (
        <Empty
          icon="search"
          title={a.t('explore.emptyTitle')}
          text={a.t('explore.emptyText')}
          action={a.t('explore.resetFilters')}
          onAction={() => {
            setQ('')
            a.setExploreCuisine('All')
            a.setFilters({ sort: 'Recommended', price: 0, free: false })
          }}
        />
      )}
    </div>
  )
}

export function BagBar({ a, targetId }: { a: Ctx; targetId?: string }) {
  if (!a.cartCount) return null
  return (
    <div className="bag-bar-wrap">
      <button
        type="button"
        id={targetId}
        className="bag-bar glass-dark press"
        onClick={() => a.go('cart')}
      >
        <span className="bag-count">{a.cartCount}</span>
        <b>{a.t('cart.viewBag')}</b>
        <span>
          <Rolling value={money(a.subtotal)} />
        </span>
      </button>
    </div>
  )
}

export function RestaurantScreen({ a }: { a: Ctx }) {
  const r = findRestaurant(a.restaurantId)
  const quickAdd = (id: string, el: HTMLElement | null) => {
    const d = findDish(id)
    a.tryAddToCart(lineItem(d, 1, d.option.choices[0], []), () => a.flyToCart(el, d.image))
  }

  return (
    <div className="screen detail has-bag">
      <div className="hero">
        <img src={r.image} alt={r.name} style={vt('hero')} decoding="async" />
        <div className="hero-shade" />
        <div className="hero-actions">
          <button
            type="button"
            className="glass-circle"
            onClick={a.back}
            aria-label={a.t('common.back')}
          >
            <Icon name="back" size={20} />
          </button>
          <div className="hero-right">
            <FavButton
              glass
              saveLabel={a.t('favorites.save', { name: r.name })}
              removeLabel={a.t('favorites.remove', { name: r.name })}
              on={a.favR.includes(r.id)}
              onToggle={() => a.toggleFav('r', r.id)}
            />
          </div>
        </div>
      </div>
      <section className="venue glass-light">
        <span className="kicker">{r.type}</span>
        <h1>{r.name}</h1>
        <p>{r.blurb}</p>
        <div className="venue-facts">
          <span>
            <Icon name="star" size={13} filled />
            {r.rating}
            <small>({r.reviews})</small>
          </span>
          <span>
            <Icon name="clock" size={13} />
            {r.minutes[0]}–{r.minutes[1]} {a.t('common.min')}
          </span>
          <span>
            {r.fee
              ? `${money(r.fee)} ${a.t('costs.delivery').toLowerCase()}`
              : a.t('common.freeDelivery')}
          </span>
        </div>
      </section>
      {r.fee > 0 && (
        <div className="perk">
          <span>
            <Icon name="gift" size={16} />
          </span>
          <p>
            {a.t('restaurant.clubPerk', {
              amount: money(PRICING.freeDeliveryOver),
            })}
          </p>
        </div>
      )}
      <SectionHead
        title={a.t('restaurant.menu')}
        detail={a.t('restaurant.madeToOrder', { count: r.menu.length })}
      />
      <div className="menu stagger">
        {r.menu.map((d) => {
          const inBagQty = a.cart
            .filter((i) => i.dishId === d.id)
            .reduce((sum, i) => sum + i.qty, 0)
          const requiresChoice = d.option.choices.length > 1

          return (
            <div key={d.id} className="menu-item">
              <button
                type="button"
                className="menu-main press"
                onClick={(e) => a.openDish(d.id, e.currentTarget)}
              >
                <div>
                  {d.tag && <span className="tag">{d.tag}</span>}
                  <h3>{d.name}</h3>
                  <p>{d.desc}</p>
                  <b>{money(d.price)}</b>
                </div>
                <Img src={d.thumb ?? d.image} alt={d.name} width={110} height={110} />
              </button>
              <button
                type="button"
                className="quick-add"
                aria-label={a.t('menu.addItem', { name: d.name })}
                onClick={(e) => {
                  const mainBtn = e.currentTarget.previousElementSibling as HTMLElement | null
                  if (requiresChoice) {
                    a.openDish(d.id, mainBtn)
                    return
                  }
                  quickAdd(d.id, mainBtn?.querySelector('img') ?? null)
                }}
              >
                {inBagQty > 0 ? (
                  <b className="text-[13px] font-bold leading-none text-[var(--tomato-ink)]">
                    {inBagQty}
                  </b>
                ) : (
                  <Icon name="plus" size={16} />
                )}
              </button>
            </div>
          )
        })}
      </div>
      <BagBar a={a} targetId={a.screen === 'restaurant' ? 'cart-target' : undefined} />
    </div>
  )
}

export function Food({ a }: { a: Ctx }) {
  const d = findDish(a.dishId)
  const r = findRestaurant(d.restaurantId)
  const editing = a.editingKey ? a.cart.find((i) => i.key === a.editingKey) : undefined
  const [choice, setChoice] = useState(editing?.choice ?? d.option.choices[0])
  const [extras, setExtras] = useState<string[]>(editing?.extras ?? [])
  const [qty, setQty] = useState(editing?.qty ?? 1)
  const [note, setNote] = useState(editing?.note ?? '')
  const [adding, setAdding] = useState(false)
  const hero = useRef<HTMLImageElement>(null)
  const unit =
    d.price + d.extras.filter((e) => extras.includes(e.name)).reduce((s, e) => s + e.price, 0)

  const submit = () => {
    if (adding) return
    const item = lineItem(d, qty, choice, extras, note.trim())
    if (editing) {
      setAdding(true)
      a.replaceCartItem(editing.key, item)
      a.toast(a.t('toast.bagUpdated'))
      a.back()
      return
    }
    if (isCrossRestaurantCart(a.cart, item.restaurantId)) {
      a.tryAddToCart(item, () => {
        setAdding(true)
        a.flyToCart(hero.current, d.image, a.back)
      })
      return
    }
    setAdding(true)
    a.tryAddToCart(item, () => a.flyToCart(hero.current, d.image, a.back))
  }

  return (
    <div className="screen detail food has-sticky min-[860px]:px-[var(--screen-px)] min-[860px]:pt-[calc(var(--safe-top)+18px)]">
      <div className="split-detail">
        <div className="split-sticky">
          <div className="hero tall">
            <img ref={hero} src={d.image} alt={d.name} style={vt('dish')} decoding="async" />
            <div className="hero-shade" />
            <div className="hero-actions">
              <button
                type="button"
                className="glass-circle"
                onClick={a.back}
                aria-label={a.t('common.back')}
              >
                <Icon name="back" size={20} />
              </button>
              <div className="hero-right">
                <FavButton
                  glass
                  saveLabel={a.t('favorites.save', { name: d.name })}
                  removeLabel={a.t('favorites.remove', { name: d.name })}
                  on={a.favD.includes(d.id)}
                  onToggle={() => a.toggleFav('d', d.id)}
                />
                <button
                  type="button"
                  id="cart-target"
                  className="glass-circle"
                  onClick={() => a.go('cart')}
                  aria-label={`${a.t('nav.bag')}, ${a.t(
                    a.cartCount === 1 ? 'order.item' : 'order.items',
                    { count: a.cartCount },
                  )}`}
                >
                  <Icon name="bag" size={18} />
                  {a.cartCount > 0 && <b className="badge">{a.cartCount}</b>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <section className="dish-copy">
            <button
              type="button"
              className="kicker link-kicker"
              onClick={() => a.openRestaurant(r.id)}
            >
              {r.name} <Icon name="chevron" size={11} />
            </button>
            <h1>{d.name}</h1>
            <p>{d.desc}</p>
            <div className="dish-meta">
              <b>{money(d.price)}</b>
              <span>{a.t('menu.cal', { cal: d.cal })}</span>
              {d.tag && <span className="tag">{d.tag}</span>}
            </div>
          </section>
          <div className="card pad">
            <Choice
              title={d.option.title}
              required
              requiredLabel={a.t('common.required')}
              options={d.option.choices}
              selected={[choice]}
              onPick={setChoice}
            />
          </div>
          {d.extras.length > 0 && (
            <div className="card pad">
              <Choice
                title={a.t('dish.makeItYours')}
                subtitle={a.t('dish.chooseAny')}
                multi
                options={d.extras.map((e) => e.name)}
                prices={d.extras.map((e) => `+${money(e.price)}`)}
                selected={extras}
                onPick={(x) =>
                  setExtras((v) => (v.includes(x) ? v.filter((y) => y !== x) : [...v, x]))
                }
              />
            </div>
          )}
          <div className="card pad">
            <TextArea
              label={a.t('dish.kitchenNote')}
              value={note}
              onChange={setNote}
              placeholder={a.t('dish.notePlaceholder')}
            />
          </div>
        </div>
      </div>

      <div className="sticky-bar glass-light keep-on-keyboard">
        <Stepper value={qty} onChange={setQty} />
        <Button variant="accent" disabled={adding} onClick={submit}>
          <span className="split">
            <span>{editing ? a.t('dish.updateItem') : a.t('dish.addToBag')}</span>
            <b>
              <Rolling value={money(unit * qty)} />
            </b>
          </span>
        </Button>
      </div>
    </div>
  )
}
