import { useEffect, useRef, useState } from 'react'
import { brands, PRICING } from '../data'
import type { Filters } from '../domain/types'
import { detectCardBrand, validateCard, validateProfile, validatePromo } from '../domain/validation'
import { filterRestaurants, type Ctx } from '../store'
import { Button, Choice, Field, Icon, Row, Sheet, TextArea, haptic, money } from '../ui'
import { compressImageDataUrl } from '../utils/image'
import { initials, priceTierLabel } from './Shared'

export function SheetHost({ a, exploreQuery = '' }: { a: Ctx; exploreQuery?: string }) {
  const close = () => a.setSheet(null)
  const [draftFilters, setDraftFilters] = useState<Filters>(a.filters)
  const [promo, setPromo] = useState(a.promo)
  const [promoErr, setPromoErr] = useState('')
  const [note, setNote] = useState(a.deliveryNote)
  const [p, setP] = useState(a.profile)
  const [pErr, setPErr] = useState<Record<string, string>>({})
  const [card, setCard] = useState({ name: a.profile.name, number: '', exp: '', cvc: '' })
  const [cErr, setCErr] = useState<Record<string, string>>({})
  const avatarInput = useRef<HTMLInputElement>(null)
  const promoFieldWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (a.sheet === 'filters') setDraftFilters(a.filters)
    if (a.sheet === 'promo') {
      setPromo(a.promo)
      setPromoErr('')
    }
    if (a.sheet === 'instructions') setNote(a.deliveryNote)
    if (a.sheet === 'edit-profile') {
      setP(a.profile)
      setPErr({})
    }
    if (a.sheet === 'add-card') {
      setCard({ name: a.profile.name, number: '', exp: '', cvc: '' })
      setCErr({})
    }
  }, [a.sheet, a.filters, a.promo, a.deliveryNote, a.profile])

  useEffect(() => {
    if (a.sheet !== 'promo') return
    const timer = window.setTimeout(() => {
      promoFieldWrapRef.current?.querySelector('input')?.focus({ preventScroll: true })
    }, 260)
    return () => window.clearTimeout(timer)
  }, [a.sheet])

  const count = filterRestaurants(exploreQuery, a.exploreCuisine, draftFilters).length

  const sortEntries: [Filters['sort'], string][] = [
    ['Recommended', a.t('filters.sortRecommended')],
    ['Fastest delivery', a.t('filters.sortFastest')],
    ['Top rated', a.t('filters.sortTopRated')],
    ['Lowest fee', a.t('filters.sortLowestFee')],
  ]
  const currentSortLabel =
    sortEntries.find(([k]) => k === draftFilters.sort)?.[1] ?? a.t('filters.sortRecommended')

  const applyPromo = (code: string) => {
    const res = validatePromo(code, a.cart, a.t)
    if (!res.valid) {
      haptic(30)
      setPromoErr(res.error)
      return
    }
    a.setPromo(res.code)
    a.toast(a.t('toast.promoApplied', { code: res.code }))
    close()
  }

  const saveProfile = () => {
    const res = validateProfile(p, a.t)
    if (!res.valid) {
      setPErr(res.errors)
      return
    }
    a.setProfile({
      ...p,
      name: p.name.trim(),
      email: p.email.trim(),
      phone: p.phone.trim(),
    })
    a.toast(a.t('toast.profileUpdated'))
    close()
  }

  const addCard = () => {
    const res = validateCard(card, a.t)
    if (!res.valid) {
      setCErr(res.errors)
      haptic(30)
      return
    }
    const id = `c${Date.now()}`
    a.addPaymentMethod({
      id,
      label: `${res.brand} •••• ${res.last4}`,
      detail: a.t('card.expires', { exp: card.exp.trim() }),
      kind: 'card',
      logo:
        res.brand === 'Visa'
          ? brands.visa
          : res.brand === 'Mastercard'
            ? brands.mastercard
            : undefined,
      removable: true,
    })
    a.toast(a.t('toast.cardAdded', { brand: res.brand }))
    close()
  }

  if (!a.sheet) return null

  const titles: Record<string, string> = {
    filters: a.t('filters.title'),
    promo: a.t('promo.title'),
    instructions: a.t('cart.deliveryInstructions'),
    contact: a.t('tracking.contactCourier'),
    'edit-profile': a.t('profile.editProfile'),
    'add-card': a.t('card.title'),
  }
  const dirSign = a.languageMeta.dir === 'rtl' ? -1 : 1
  const previewBrand = detectCardBrand(card.number)
  const previewLogo =
    previewBrand === 'Visa' ? brands.visa : previewBrand === 'Mastercard' ? brands.mastercard : null

  return (
    <Sheet
      title={titles[a.sheet] ?? ''}
      onClose={close}
      closeLabel={a.t('common.close')}
      tall={a.sheet === 'edit-profile' || a.sheet === 'add-card'}
    >
      {a.sheet === 'filters' && (
        <>
          <p className="group-label">{a.t('filters.sortBy')}</p>
          <div className="card pad">
            <Choice
              options={sortEntries.map(([, label]) => label)}
              selected={[currentSortLabel]}
              onPick={(label) => {
                const canonical = sortEntries.find(([, l]) => l === label)?.[0] ?? 'Recommended'
                setDraftFilters({ ...draftFilters, sort: canonical })
              }}
            />
          </div>
          <p className="group-label">{a.t('filters.price')}</p>
          <div className="segmented three glass-light">
            <span
              className="seg-thumb"
              style={{
                transform: `translateX(${((draftFilters.price || 1) - 1) * 100 * dirSign}%)`,
                opacity: draftFilters.price ? 1 : 0,
              }}
            />
            {[1, 2, 3].map((n) => (
              <button
                type="button"
                key={n}
                className={draftFilters.price === n ? 'on' : ''}
                onClick={() =>
                  setDraftFilters({
                    ...draftFilters,
                    price: draftFilters.price === n ? 0 : n,
                  })
                }
              >
                {priceTierLabel(a, n)}
              </button>
            ))}
          </div>
          <div className="card list">
            <Row
              icon="gift"
              tone="tomato"
              title={a.t('filters.freeDeliveryOnly')}
              toggle
              on={draftFilters.free}
              onClick={() => setDraftFilters({ ...draftFilters, free: !draftFilters.free })}
            />
          </div>
          <div className="sheet-actions">
            <button
              type="button"
              className="text-btn"
              onClick={() => setDraftFilters({ sort: 'Recommended', price: 0, free: false })}
            >
              {a.t('common.reset')}
            </button>
            <Button
              onClick={() => {
                a.setFilters(draftFilters)
                close()
              }}
            >
              {a.t(count === 1 ? 'filters.showPlace' : 'filters.showPlaces', { count })}
            </Button>
          </div>
        </>
      )}

      {a.sheet === 'promo' && (
        <>
          <div ref={promoFieldWrapRef}>
            <Field
              label={a.t('promo.codeLabel')}
              value={promo}
              onChange={(v) => {
                setPromo(v.toUpperCase())
                setPromoErr('')
              }}
              placeholder={a.t('promo.placeholder')}
              error={promoErr}
            />
          </div>
          <Button onClick={() => applyPromo(promo)}>{a.t('common.apply')}</Button>
          <p className="group-label">{a.t('promo.available')}</p>
          <button type="button" className="coupon press" onClick={() => applyPromo('BITE20')}>
            <span className="coupon-code">BITE20</span>
            <div>
              <b>{a.t('promo.offerTitle')}</b>
              <small>{a.t('promo.upTo', { amount: money(PRICING.promoCap) })}</small>
            </div>
            <em>{a.t('common.apply')}</em>
          </button>
          {a.promo && (
            <button
              type="button"
              className="link danger center"
              onClick={() => {
                a.setPromo('')
                a.toast(a.t('toast.promoRemoved'), 'info')
                close()
              }}
            >
              {a.t('promo.remove', { code: a.promo })}
            </button>
          )}
        </>
      )}

      {a.sheet === 'instructions' && (
        <>
          <TextArea
            label={a.t('addresses.instructions')}
            value={note}
            onChange={setNote}
            placeholder={a.t('addresses.notesPlaceholder')}
          />
          <div className="chips wrap">
            {[
              a.t('instructions.p1'),
              a.t('instructions.p2'),
              a.t('instructions.p3'),
              a.t('instructions.p4'),
            ].map((preset) => (
              <button
                type="button"
                key={preset}
                className={`chip ${note === preset ? 'on' : ''}`}
                onClick={() => setNote(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
          <Button
            onClick={() => {
              a.setDeliveryNote(note.trim())
              a.toast(a.t('toast.instructionsSaved'))
              close()
            }}
          >
            {a.t('common.save')}
          </Button>
        </>
      )}

      {a.sheet === 'contact' && (
        <>
          <div className="courier-card card">
            <span className="courier-avatar">DM</span>
            <div>
              <small className="mono">{a.t('tracking.yourCourier')}</small>
              <b>Dawit M.</b>
              <span>{a.t('tracking.courierStats')}</span>
            </div>
          </div>
          <div className="card list">
            <Row
              icon="message"
              tone="cobalt"
              title={a.t('tracking.sendMessage')}
              detail={a.t('tracking.repliesFast')}
              onClick={() => a.openChat('courier')}
            />
            <Row
              icon="phone"
              tone="butter"
              title={a.t('tracking.callCourier')}
              detail={a.t('tracking.privateNumber')}
              onClick={() => {
                close()
                a.confirm({
                  title: a.t('tracking.callTitle'),
                  message: a.t('tracking.callMessage'),
                  confirm: a.t('common.ok'),
                  onConfirm: () => a.toast(a.t('tracking.callToast'), 'info'),
                })
              }}
            />
          </div>
        </>
      )}

      {a.sheet === 'edit-profile' && (
        <>
          <div className="edit-avatar">
            <span className="avatar avatar-lg">
              {p.avatar ? <img src={p.avatar} alt="" /> : initials(p.name || 'G')}
            </span>
            <input
              ref={avatarInput}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label={a.t('editProfile.changePhoto')}
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                void compressImageDataUrl(f)
                  .then((compressed) => {
                    setP((prev) => ({ ...prev, avatar: compressed }))
                  })
                  .catch(() => {})
              }}
            />
            <button
              type="button"
              className="glass-circle small cam"
              onClick={() => avatarInput.current?.click()}
              aria-label={a.t('editProfile.changePhoto')}
            >
              <Icon name="camera" size={16} />
            </button>
            {p.avatar && (
              <button
                type="button"
                className="link"
                onClick={() => setP((prev) => ({ ...prev, avatar: '' }))}
              >
                {a.t('editProfile.removePhoto')}
              </button>
            )}
          </div>
          <Field
            label={a.t('auth.fullName')}
            value={p.name}
            onChange={(v) => {
              setP((prev) => ({ ...prev, name: v }))
              setPErr((prev) => ({ ...prev, name: '' }))
            }}
            error={pErr.name}
          />
          <Field
            label={a.t('auth.email')}
            type="email"
            inputMode="email"
            value={p.email}
            onChange={(v) => {
              setP((prev) => ({ ...prev, email: v }))
              setPErr((prev) => ({ ...prev, email: '' }))
            }}
            error={pErr.email}
          />
          <Field
            label={a.t('editProfile.phone')}
            type="tel"
            inputMode="tel"
            value={p.phone}
            onChange={(v) => {
              setP((prev) => ({ ...prev, phone: v }))
              setPErr((prev) => ({ ...prev, phone: '' }))
            }}
            error={pErr.phone}
          />
          <Button onClick={saveProfile}>{a.t('common.save')}</Button>
        </>
      )}

      {a.sheet === 'add-card' && (
        <>
          <div className="card-preview">
            <div className="wc-shine" />
            {previewLogo ? (
              <span className="wc-logo">
                <img src={previewLogo} alt="" />
              </span>
            ) : (
              <span className="mono">{previewBrand}</span>
            )}
            <b>{(card.number || '•••• •••• •••• ••••').padEnd(19, '•')}</b>
            <span>
              {card.name || a.t('card.nameOnCard')}
              <em>{card.exp || 'MM/YY'}</em>
            </span>
          </div>
          <Field
            label={a.t('card.number')}
            inputMode="numeric"
            value={card.number}
            maxLength={19}
            onChange={(v) => {
              setCard({
                ...card,
                number: v
                  .replace(/\D/g, '')
                  .slice(0, 16)
                  .replace(/(.{4})/g, '$1 ')
                  .trim(),
              })
              setCErr((prev) => ({ ...prev, number: '' }))
            }}
            placeholder="4242 4242 4242 4242"
            error={cErr.number}
          />
          <div className="field-pair">
            <Field
              label={a.t('card.expiry')}
              inputMode="numeric"
              value={card.exp}
              maxLength={5}
              onChange={(v) => {
                const d = v.replace(/\D/g, '').slice(0, 4)
                setCard({
                  ...card,
                  exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d,
                })
                setCErr((prev) => ({ ...prev, exp: '' }))
              }}
              placeholder="MM/YY"
              error={cErr.exp}
            />
            <Field
              label={a.t('card.cvc')}
              inputMode="numeric"
              value={card.cvc}
              maxLength={4}
              onChange={(v) => {
                setCard({ ...card, cvc: v.replace(/\D/g, '') })
                setCErr((prev) => ({ ...prev, cvc: '' }))
              }}
              placeholder="123"
              error={cErr.cvc}
            />
          </div>
          <Field
            label={a.t('card.nameOnCard')}
            value={card.name}
            onChange={(v) => {
              setCard({ ...card, name: v })
              setCErr((prev) => ({ ...prev, name: '' }))
            }}
            error={cErr.name}
          />
          <Button onClick={addCard}>
            <Icon name="lock" size={16} />
            {a.t('card.add')}
          </Button>
          <p className="fine">{a.t('card.prototypeNote')}</p>
        </>
      )}
    </Sheet>
  )
}
