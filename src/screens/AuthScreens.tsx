import { useEffect, useRef, useState } from 'react'
import { brands, campaignEthiopian, findDish } from '../data'
import { LANGUAGES } from '../i18n'
import { isAndroidDevice } from '../native'
import type { Ctx } from '../store'
import { BlurText, Button, Field, Header, Icon, Img, haptic } from '../ui'
import { useGeolocation } from './Shared'

const LANG_PILLS: Readonly<Record<string, string>> = {
  en: 'EN',
  am: 'አማ',
  om: 'OM',
  ti: 'ትግ',
  fr: 'FR',
  ar: 'AR',
}

function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="18" cy="7.5" r="2.7" fill="var(--tomato)" />
      <path
        d="M6.5 23.5a11.5 11.5 0 0 1 23 0"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M4.5 25.5h27" stroke="var(--butter)" strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  )
}

export function Splash({ a }: { a: Ctx }) {
  useEffect(() => {
    const t = window.setTimeout(() => a.replace('welcome'), 900)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div
      className="screen splash"
      role="button"
      tabIndex={0}
      onClick={() => a.replace('welcome')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          a.replace('welcome')
        }
      }}
    >
      <div className="splash-orb o1" />
      <div className="splash-orb o2" />
      <div className="splash-orb o3" />
      <div className="splash-mark">
        <BrandMark size={48} />
      </div>
      <h1 className="wordmark">{a.t('app.name')}</h1>
      <p className="mono">{a.t('app.tagline')}</p>
    </div>
  )
}

export function Welcome({ a }: { a: Ctx }) {
  return (
    <div className="screen welcome">
      <img className="welcome-bg" src={campaignEthiopian} alt="" decoding="async" />
      <div className="welcome-top flex-wrap gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-2 text-white">
            <BrandMark size={20} />
            <span className="wordmark small">{a.t('app.name')}</span>
          </span>
          <span className="mono">{a.t('app.cityEst')}</span>
        </div>
        <div
          className="inline-flex items-center gap-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 p-1"
          role="group"
          aria-label={a.t('language.title')}
        >
          {LANGUAGES.map((lang) => {
            const active = a.language === lang.name
            return (
              <button
                type="button"
                key={lang.code}
                aria-label={lang.name}
                aria-pressed={active}
                onClick={() => {
                  haptic(6)
                  void a.setLanguage(lang.name)
                }}
                className={`min-h-[32px] px-2 rounded-full text-[11px] font-semibold transition ${
                  active ? 'bg-[var(--butter)] text-[var(--ink)]' : 'text-white/85 hover:text-white'
                }`}
              >
                {LANG_PILLS[lang.code] ?? lang.code.toUpperCase()}
              </button>
            )
          })}
        </div>
      </div>
      <div className="welcome-card glass-dark">
        <span className="kicker light">{a.t('welcome.kicker')}</span>
        <BlurText
          lines={[a.t('welcome.titleLine1'), a.t('welcome.titleLine2')]}
          em={1}
          delay={250}
        />
        <p>{a.t('welcome.subtitle')}</p>
        <Button variant="butter" onClick={() => a.go('onboarding')}>
          {a.t('welcome.getStarted')}
        </Button>
        <button type="button" className="link-light" onClick={() => a.go('login')}>
          {a.t('welcome.haveAccount')}
        </button>
      </div>
    </div>
  )
}

const slideDefs = [
  {
    kKey: 'onboarding.s1Kicker',
    tKey: 'onboarding.s1Title',
    dKey: 'onboarding.s1Desc',
    stickerKey: 'onboarding.s1Sticker',
    imgs: ['campaign', 'gursha-doro', 'gursha-kitfo'],
  },
  {
    kKey: 'onboarding.s2Kicker',
    tKey: 'onboarding.s2Title',
    dKey: 'onboarding.s2Desc',
    stickerKey: 'onboarding.s2Sticker',
    imgs: ['gursha-tibs', 'gursha-shiro', 'gursha-buna'],
  },
  {
    kKey: 'onboarding.s3Kicker',
    tKey: 'onboarding.s3Title',
    dKey: 'onboarding.s3Desc',
    stickerKey: 'onboarding.s3Sticker',
    imgs: ['gursha-doro', 'gursha-beyaynetu', 'gursha-tibs'],
  },
] as const

const slideImage = (id: string) => (id === 'campaign' ? campaignEthiopian : findDish(id).image)

export function Onboarding({ a }: { a: Ctx }) {
  const [i, setI] = useState(0)
  const startX = useRef<number | null>(null)
  const next = () => (i < 2 ? (haptic(), setI(i + 1)) : a.finishIntroReplay())
  const slide = slideDefs[i]
  const dirSign = a.languageMeta.dir === 'rtl' ? -1 : 1

  return (
    <div
      className="screen onboarding"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('button, a, input')) return
        startX.current = e.clientX
        e.currentTarget.setPointerCapture?.(e.pointerId)
      }}
      onPointerUp={(e) => {
        if (startX.current === null) return
        const dx = (e.clientX - startX.current) * dirSign
        startX.current = null
        if (dx < -50) next()
        else if (dx > 50 && i > 0) setI(i - 1)
      }}
      onPointerCancel={() => {
        startX.current = null
      }}
    >
      <div className="ob-top">
        {i > 0 && (
          <button
            type="button"
            className="glass-circle small"
            aria-label={a.t('common.back')}
            onClick={() => {
              haptic()
              setI((prev) => Math.max(0, prev - 1))
            }}
          >
            <Icon name="back" size={18} />
          </button>
        )}
        <div className="ob-progress">
          {slideDefs.map((_, n) => (
            <i key={n} className={n <= i ? 'on' : ''} />
          ))}
        </div>
        <button type="button" className="link" onClick={() => a.finishIntroReplay()}>
          {a.t('common.skip')}
        </button>
      </div>
      <div className={`ob-stack s${i}`}>
        {slide.imgs.map((id, n) => (
          <div key={id} className={`ob-card c${n}`}>
            <Img src={slideImage(id)} alt="" />
          </div>
        ))}
        <span className="ob-sticker glass-light">
          <Icon name="sparkle" size={14} />
          {a.t(slide.stickerKey)}
        </span>
      </div>
      <div className="ob-copy" key={i}>
        <span className="kicker">
          0{i + 1} — {a.t(slide.kKey)}
        </span>
        <BlurText lines={[a.t(slide.tKey)]} />
        <p>{a.t(slide.dKey)}</p>
      </div>
      <Button onClick={next}>
        {i < 2 ? a.t('common.continue') : a.t('onboarding.createAccount')}
      </Button>
    </div>
  )
}

export function AuthForm({ a }: { a: Ctx }) {
  const s = a.screen as 'signup' | 'login' | 'forgot' | 'otp' | 'reset-password'
  const [f, setF] = useState({
    name: '',
    email: a.authEmail || '',
    password: '',
    confirm: '',
  })
  const [err, setErr] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState(['', '', '', ''])
  const [resend, setResend] = useState(30)
  const boxes = useRef<(HTMLInputElement | null)[]>([])
  const submitTimer = useRef<number>(0)

  useEffect(() => () => window.clearTimeout(submitTimer.current), [])

  useEffect(() => {
    setErr({})
    setLoading(false)
    setF((prev) => ({ ...prev, password: '', confirm: '' }))
    if (s === 'otp') {
      setCode(['', '', '', ''])
      setResend(30)
    }
  }, [s])

  useEffect(() => {
    if (s !== 'otp' || resend <= 0) return
    const t = window.setTimeout(() => setResend(resend - 1), 1000)
    return () => window.clearTimeout(t)
  }, [s, resend])

  const set = (k: keyof typeof f) => (v: string) => {
    setF((prev) => ({ ...prev, [k]: v }))
    if (k === 'email') a.setAuthEmail(v)
    setErr((prev) => ({ ...prev, [k]: '' }))
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (s === 'otp') {
      if (code.join('').length < 4) return setErr({ code: a.t('auth.errCode') })
    } else if (s === 'reset-password') {
      if (f.password.length < 8) e.password = a.t('auth.errPassword')
      if (f.confirm !== f.password) e.confirm = a.t('auth.errConfirm')
    } else {
      if (s === 'signup' && f.name.trim().length < 2) e.name = a.t('auth.errName')
      if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = a.t('auth.errEmail')
      if (s !== 'forgot' && f.password.length < 8) e.password = a.t('auth.errPassword')
    }
    setErr(e)
    if (Object.keys(e).length) {
      haptic(30)
      return
    }
    setLoading(true)
    window.clearTimeout(submitTimer.current)
    submitTimer.current = window.setTimeout(() => {
      setLoading(false)
      const trimmedEmail = f.email.trim()
      if (s === 'signup') {
        a.setAuthEmail(trimmedEmail)
        a.setProfile({ ...a.profile, name: f.name.trim(), email: trimmedEmail })
        a.setOtpPurpose('signup')
        a.go('otp')
      } else if (s === 'forgot') {
        a.setAuthEmail(trimmedEmail)
        a.setOtpPurpose('forgot')
        a.go('otp')
      } else if (s === 'otp') {
        a.go(a.otpPurpose === 'forgot' ? 'reset-password' : 'location')
      } else if (s === 'reset-password') {
        setF((prev) => ({ ...prev, password: '', confirm: '' }))
        a.toast(a.t('auth.pwUpdated'))
        a.resetTo('login')
      } else {
        if (a.addresses.length === 0) {
          a.go('location')
        } else {
          a.resetTo('home')
        }
        a.toast(a.t('toast.welcomeBack', { name: a.profile.name.split(' ')[0] }))
      }
    }, 160)
  }

  const targetEmail = f.email.trim() || a.authEmail.trim() || a.profile.email
  const copy = {
    signup: [a.t('auth.signupTitle'), a.t('auth.signupSub'), a.t('auth.signupCta')],
    login: [a.t('auth.loginTitle'), a.t('auth.loginSub'), a.t('auth.loginCta')],
    forgot: [a.t('auth.forgotTitle'), a.t('auth.forgotSub'), a.t('auth.forgotCta')],
    otp: [a.t('auth.otpTitle'), a.t('auth.otpSub', { email: targetEmail }), a.t('auth.otpCta')],
    'reset-password': [a.t('auth.resetTitle'), a.t('auth.resetSub'), a.t('auth.resetCta')],
  }[s]

  const typeCode = (n: number, v: string) => {
    const digits = v.replace(/\D/g, '')
    if (digits.length > 1) {
      const next = digits.slice(0, 4).split('')
      setCode([0, 1, 2, 3].map((k) => next[k] ?? ''))
      boxes.current[Math.min(3, next.length)]?.focus()
      return
    }
    const c = [...code]
    c[n] = digits
    setCode(c)
    setErr({})
    if (digits && n < 3) boxes.current[n + 1]?.focus()
  }

  const handleSocial = () => {
    if (s === 'signup' || a.addresses.length === 0) {
      a.go('location')
    } else {
      a.resetTo('home')
    }
  }

  return (
    <div className="screen auth">
      <Header
        title=""
        backLabel={a.t('common.back')}
        onBack={() => (a.history.length ? a.back() : a.replace('welcome'))}
      />
      <h1 className="auth-title">{copy[0]}</h1>
      <p className="auth-sub">{copy[1]}</p>
      <div className="auth-fields">
        {s === 'otp' ? (
          <>
            <div className="otp" dir="ltr">
              {code.map((c, n) => (
                <input
                  key={n}
                  ref={(el) => {
                    boxes.current[n] = el
                  }}
                  value={c}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  autoFocus={n === 0}
                  aria-label={a.t('auth.digitLabel', { n: n + 1 })}
                  onChange={(e) => typeCode(n, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !c && n > 0) boxes.current[n - 1]?.focus()
                  }}
                  className={c ? 'filled' : ''}
                />
              ))}
            </div>
            {err.code && (
              <p className="form-error" role="alert">
                {err.code}
              </p>
            )}
            <p className="hint">{a.t('auth.otpHint')}</p>
          </>
        ) : s === 'reset-password' ? (
          <>
            <Field
              label={a.t('auth.newPassword')}
              type="password"
              resetKey={s}
              showPasswordLabel={a.t('ui.showPassword')}
              hidePasswordLabel={a.t('ui.hidePassword')}
              value={f.password}
              onChange={set('password')}
              placeholder={a.t('auth.pwPlaceholder')}
              error={err.password}
            />
            <Field
              label={a.t('auth.confirmPassword')}
              type="password"
              resetKey={s}
              showPasswordLabel={a.t('ui.showPassword')}
              hidePasswordLabel={a.t('ui.hidePassword')}
              value={f.confirm}
              onChange={set('confirm')}
              placeholder={a.t('auth.confirmPlaceholder')}
              error={err.confirm}
            />
          </>
        ) : (
          <>
            {s === 'signup' && (
              <Field
                label={a.t('auth.fullName')}
                value={f.name}
                onChange={set('name')}
                placeholder={a.t('auth.namePlaceholder')}
                error={err.name}
              />
            )}
            <Field
              label={a.t('auth.email')}
              type="email"
              inputMode="email"
              value={f.email}
              onChange={set('email')}
              placeholder={a.t('auth.emailPlaceholder')}
              error={err.email}
            />
            {s !== 'forgot' && (
              <Field
                label={a.t('auth.password')}
                type="password"
                resetKey={s}
                showPasswordLabel={a.t('ui.showPassword')}
                hidePasswordLabel={a.t('ui.hidePassword')}
                value={f.password}
                onChange={set('password')}
                placeholder={a.t('auth.pwPlaceholder')}
                error={err.password}
              />
            )}
          </>
        )}
      </div>
      {s === 'login' && (
        <button type="button" className="link right" onClick={() => a.go('forgot')}>
          {a.t('auth.forgotLink')}
        </button>
      )}
      <Button onClick={submit} loading={loading}>
        {copy[2]}
      </Button>
      {s === 'otp' && (
        <button
          type="button"
          className="link center"
          disabled={resend > 0}
          onClick={() => {
            setResend(30)
            a.toast(a.t('auth.resendToast'), 'info')
          }}
        >
          {resend > 0
            ? a.t('auth.resendIn', { sec: String(resend).padStart(2, '0') })
            : a.t('auth.resend')}
        </button>
      )}
      {(s === 'signup' || s === 'login') && (
        <>
          <div className="divider">
            <span />
            {a.t('auth.orDivider')}
            <span />
          </div>
          <button type="button" className="google-btn" onClick={handleSocial}>
            <img src={brands.google} alt="" />
            {a.t('auth.continueGoogle')}
          </button>
          {!isAndroidDevice() && (
            <button type="button" className="apple-btn" onClick={handleSocial}>
              <Icon name="apple" size={18} />
              {a.t('auth.continueApple')}
            </button>
          )}
          <p className="auth-switch">
            {s === 'signup' ? a.t('auth.alreadyMember') : a.t('auth.newToGebeta')}{' '}
            <button type="button" onClick={() => a.replace(s === 'signup' ? 'login' : 'signup')}>
              {s === 'signup' ? a.t('auth.loginCta') : a.t('auth.signupCta')}
            </button>
          </p>
        </>
      )}
    </div>
  )
}

export function Location({ a }: { a: Ctx }) {
  const geo = useGeolocation(a, (lat, lng) => {
    a.setDraft({
      id: `a${Date.now()}`,
      label: 'Home',
      line1: a.t('location.currentArea'),
      line2: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      apt: '',
      instructions: '',
      returnTo: 'home',
      isNew: true,
    })
    a.go('address-map')
  })

  return (
    <div className="screen location">
      <div className="radar">
        <span />
        <span />
        <span />
        <i className="glass-light">
          <Icon name="pin" size={26} />
        </i>
      </div>
      <span className="kicker">{a.t('location.kicker')}</span>
      <h1 className="display">{a.t('location.title')}</h1>
      <p className="lede">{a.t('location.subtitle')}</p>
      {geo.state === 'error' && (
        <p className="form-error center" role="alert">
          {a.t('location.error')}
        </p>
      )}
      <Button onClick={geo.request} loading={geo.state === 'loading'}>
        <Icon name="locate" size={18} />
        {a.t('location.useCurrent')}
      </Button>
      <Button variant="ghost" onClick={() => a.startAddress('home')}>
        {a.t('location.enterManual')}
      </Button>
    </div>
  )
}
