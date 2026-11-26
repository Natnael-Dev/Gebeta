import { useEffect, useRef } from 'react'
import { campaignEthiopian, campaignHeat, cuisines, restaurants } from '../data'
import type { Ctx } from '../store'
import { BlurText, Icon, Img, Marquee } from '../ui'
import {
  Avatar,
  LiveOrder,
  RestaurantCard,
  SectionHead,
  addressLabel,
  cuisineLabel,
  initials,
} from './Shared'

export function Home({ a }: { a: Ctx }) {
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? a.t('home.morning') : hour < 18 ? a.t('home.afternoon') : a.t('home.evening')

  const marqueeWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = marqueeWrapRef.current?.querySelector('.marquee')
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          el.classList.toggle('paused', !entry.isIntersecting)
        }
      },
      { threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="screen tab-screen home">
      <header className="home-head">
        <button
          type="button"
          className="address-pill glass-light press"
          onClick={() => a.go('saved-addresses')}
        >
          <span className="pin-dot">
            <Icon name="pin" size={14} />
          </span>
          <span>
            <small>
              {a.t('home.deliverTo')} · {addressLabel(a, a.address.label)}
            </small>
            <b>{a.address.line1}</b>
          </span>
          <Icon name="chevron" size={14} />
        </button>
        <button
          type="button"
          className="press"
          onClick={() => a.tab('profile')}
          aria-label={`${initials(a.profile.name)} · ${a.t('nav.profile')}`}
        >
          <Avatar a={a} />
        </button>
      </header>
      <section className="hero-title rise">
        <p className="kicker">
          {greeting}, {a.profile.name.split(' ')[0]}
        </p>
        <BlurText lines={[a.t('home.heroLine1'), a.t('home.heroLine2')]} em={1} />
      </section>
      <div className="search-pill glass-light rise">
        <button
          type="button"
          className="flex-1 min-w-0 h-full flex items-center gap-2.5 text-start press"
          onClick={() => a.openExplore({ focus: true })}
        >
          <Icon name="search" size={19} />
          <span>{a.t('home.searchPlaceholder')}</span>
        </button>
        <button
          type="button"
          className="w-[44px] h-[44px] min-w-[44px] min-h-[44px] rounded-full grid place-items-center bg-[var(--ink)] text-[var(--paper)] press shrink-0"
          aria-label={a.t('explore.filters')}
          onClick={() => a.setSheet('filters')}
        >
          <Icon name="filter" size={16} />
        </button>
      </div>
      {a.activeOrder && <LiveOrder a={a} o={a.activeOrder} compact />}
      <div ref={marqueeWrapRef}>
        <Marquee
          items={[
            ['በያይነቱ', 'Beyaynetu'],
            ['ዶሮ ወጥ', 'Doro wot'],
            ['ክትፎ', 'Kitfo'],
            ['ጥብስ', 'Tibs'],
            ['ሽሮ', 'Shiro'],
            ['ቡና', 'Buna'],
            ['ራመን', 'Ramen'],
            ['ፒዛ', 'Pizza'],
          ]}
        />
      </div>
      <div className="cuisine-rail">
        {cuisines.slice(1).map((c) => {
          const r = restaurants.find((x) => x.cuisine === c)!
          return (
            <button
              type="button"
              key={c}
              className="press"
              onClick={() => a.openExplore({ cuisine: c })}
            >
              <span>
                <Img
                  src={r.menu[0].thumb ?? r.menu[0].image}
                  alt={cuisineLabel(a, c)}
                  width={66}
                  height={66}
                />
              </span>
              <b>{cuisineLabel(a, c)}</b>
            </button>
          )
        })}
      </div>

      <div className="bento-home">
        <div className="bento-hero">
          <SectionHead title={a.t('home.gurshaTitle')} detail={a.t('home.gurshaDetail')} />
          <button
            type="button"
            className="feature press"
            onClick={(e) => a.openRestaurant('gursha', e.currentTarget)}
          >
            <img
              src={campaignEthiopian}
              alt="A shared injera platter with doro wot, misir, gomen, shiro and tibs"
              decoding="async"
              fetchPriority="high"
            />
            <div className="feature-caption glass-dark">
              <span className="mono">{a.t('home.editorsPick')}</span>
              <h3>{a.t('home.gurshaHeadline')}</h3>
              <p>
                Gursha House · 20–30 {a.t('common.min')} · {a.t('common.freeDelivery')}
              </p>
              <i>
                <Icon name="chevron" size={16} />
              </i>
            </div>
          </button>
        </div>

        <div className="bento-side">
          <SectionHead title={a.t('home.heatTitle')} detail={a.t('home.heatDetail')} />
          <button
            type="button"
            className="feature short min-[720px]:h-[clamp(260px,38dvh,360px)]! press"
            onClick={(e) => a.openRestaurant('smoke', e.currentTarget)}
          >
            <img
              src={campaignHeat}
              alt="Colorful plates of grilled chicken, noodles and salad"
              decoding="async"
            />
            <div className="feature-caption glass-dark">
              <span className="mono">{a.t('home.fromGrill')}</span>
              <h3>{a.t('home.heatHeadline')}</h3>
              <p>Smoke &amp; Salt · 30–45 {a.t('common.min')}</p>
              <i>
                <Icon name="chevron" size={16} />
              </i>
            </div>
          </button>
        </div>

        <div className="bento-full">
          <SectionHead
            title={a.t('home.popularNearby')}
            action={a.t('common.seeAll')}
            onAction={() => a.openExplore()}
          />
          <div className="h-scroll stagger">
            {restaurants.slice(0, 5).map((r) => (
              <RestaurantCard key={r.id} a={a} r={r} compact />
            ))}
          </div>
        </div>

        <div className="bento-full">
          <SectionHead title={a.t('home.fastFresh')} detail={a.t('home.fastFreshDetail')} />
          <div className="quick-list card stagger">
            {restaurants
              .filter((r) => r.minutes[1] <= 25)
              .map((r) => (
                <button
                  type="button"
                  key={r.id}
                  className="quick press"
                  onClick={(e) => a.openRestaurant(r.id, e.currentTarget)}
                >
                  <Img src={r.thumb ?? r.image} alt="" width={54} height={54} />
                  <div>
                    <b>{r.name}</b>
                    <span>{r.type}</span>
                  </div>
                  <em>
                    {r.minutes[0]}–{r.minutes[1]}
                    <small>{a.t('common.min')}</small>
                  </em>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
