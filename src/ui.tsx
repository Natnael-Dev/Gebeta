import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Icon, type IconName, type IconWeight } from './icons'
import { triggerHaptic } from './native'

export { Icon, type IconName, type IconWeight }

export const haptic = (ms = 8) => triggerHaptic(ms)
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Ethiopian Birr with non-breaking space so currency and amount never split across lines. */
export const money = (n: number) =>
  `Br\u00A0${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`

export function Header({
  title,
  onBack,
  action,
  large,
  backLabel = 'Back',
}: {
  title: string
  onBack?: () => void
  action?: ReactNode
  large?: string
  backLabel?: string
}) {
  return (
    <>
      <header className="topbar">
        <div>
          {onBack && (
            <button type="button" className="glass-circle" onClick={onBack} aria-label={backLabel}>
              <Icon name="back" size={20} />
            </button>
          )}
        </div>
        <strong>{title}</strong>
        <div>{action}</div>
      </header>
      {large && <h1 className="large-title">{large}</h1>}
    </>
  )
}

export function Button({
  children,
  onClick,
  variant = 'ink',
  disabled,
  loading,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'ink' | 'accent' | 'butter' | 'ghost' | 'danger'
  disabled?: boolean
  loading?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={() => {
        haptic(10)
        onClick?.()
      }}
      className={`btn btn-${variant} ${loading ? 'is-loading' : ''} ${className}`}
    >
      {loading ? <span className="spinner" /> : children}
    </button>
  )
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  inputMode,
  autoFocus,
  maxLength,
  autoComplete,
  resetKey,
  showPasswordLabel = 'Show password',
  hidePasswordLabel = 'Hide password',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  error?: string
  inputMode?: 'numeric' | 'email' | 'tel' | 'text'
  autoFocus?: boolean
  maxLength?: number
  autoComplete?: string
  resetKey?: string
  showPasswordLabel?: string
  hidePasswordLabel?: string
}) {
  const inputId = useId()
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    setRevealed(false)
  }, [resetKey])
  const isPassword = type === 'password'
  const effectiveType = isPassword ? (revealed ? 'text' : 'password') : type

  const inputEl = (
    <input
      id={inputId}
      type={effectiveType}
      value={value}
      placeholder={placeholder}
      inputMode={inputMode}
      autoFocus={autoFocus}
      maxLength={maxLength}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
    />
  )

  return (
    <div className={`field ${error ? 'invalid' : ''}`}>
      <label htmlFor={inputId}>{label}</label>
      {isPassword ? (
        <div className="password-wrap">
          {inputEl}
          <button
            type="button"
            className="pw-toggle"
            aria-label={revealed ? hidePasswordLabel : showPasswordLabel}
            aria-pressed={revealed}
            onClick={(e) => {
              e.preventDefault()
              setRevealed((r) => !r)
            }}
          >
            <Icon name={revealed ? 'eyeSlash' : 'eye'} size={18} />
          </button>
        </div>
      ) : (
        inputEl
      )}
      {error && <small role="alert">{error}</small>}
    </div>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const inputId = useId()
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <textarea
        id={inputId}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function Row({
  icon,
  logo,
  title,
  detail,
  onClick,
  danger,
  toggle,
  on,
  value,
  tone,
}: {
  icon?: IconName
  logo?: string
  title: string
  detail?: string
  onClick?: () => void
  danger?: boolean
  toggle?: boolean
  on?: boolean
  value?: string
  tone?: 'tomato' | 'cobalt' | 'butter' | 'ink' | 'green' | 'gold'
}) {
  return (
    <button
      type="button"
      className={`row ${danger ? 'danger' : ''}`}
      onClick={() => {
        haptic()
        onClick?.()
      }}
      role={toggle ? 'switch' : undefined}
      aria-checked={toggle ? on : undefined}
    >
      {logo ? (
        <span className="row-logo">
          <img src={logo} alt="" />
        </span>
      ) : (
        icon && (
          <span className={`row-icon ${tone ?? ''}`}>
            <Icon name={icon} size={18} weight={tone ? 'fill' : 'regular'} />
          </span>
        )
      )}
      <span className="row-copy">
        <b>{title}</b>
        {detail && <small>{detail}</small>}
      </span>
      {value && <span className="row-value">{value}</span>}
      {toggle ? (
        <span className={`switch ${on ? 'on' : ''}`}>
          <i />
        </span>
      ) : (
        !danger && (
          <span className="row-chev">
            <Icon name="chevron" size={16} />
          </span>
        )
      )}
    </button>
  )
}

export function Choice({
  title,
  subtitle,
  required,
  options,
  selected,
  onPick,
  prices,
  multi,
  requiredLabel = 'Required',
}: {
  title?: string
  subtitle?: string
  required?: boolean
  options: string[]
  selected: string[]
  onPick: (x: string) => void
  prices?: string[]
  multi?: boolean
  requiredLabel?: string
}) {
  return (
    <section className="choice">
      {title && (
        <div className="choice-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {required && <span className="tag">{requiredLabel}</span>}
        </div>
      )}
      {options.map((o, i) => {
        const on = selected.includes(o)
        return (
          <button
            type="button"
            key={o}
            className={on ? 'on' : ''}
            onClick={() => {
              haptic(6)
              onPick(o)
            }}
          >
            <i className={multi ? 'box' : 'radio'}>{on && <Icon name="check" size={12} />}</i>
            <b>{o}</b>
            {prices?.[i] && <span>{prices[i]}</span>}
          </button>
        )
      })}
    </section>
  )
}

export function Stepper({
  value,
  onChange,
  min = 1,
  small,
  decreaseLabel = 'Decrease',
  increaseLabel = 'Increase',
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  small?: boolean
  decreaseLabel?: string
  increaseLabel?: string
}) {
  return (
    <div className={`stepper ${small ? 'small' : ''}`}>
      <button
        type="button"
        aria-label={decreaseLabel}
        onClick={() => {
          haptic(6)
          onChange(Math.max(min, value - 1))
        }}
      >
        <Icon name={value <= 1 && min === 0 ? 'trash' : 'minus'} size={small ? 14 : 16} />
      </button>
      <b key={value} className="tick">
        {value}
      </b>
      <button
        type="button"
        aria-label={increaseLabel}
        onClick={() => {
          haptic(6)
          onChange(value + 1)
        }}
      >
        <Icon name="plus" size={small ? 14 : 16} />
      </button>
    </div>
  )
}

export type TabId = 'home' | 'explore' | 'orders' | 'favorites' | 'profile'
const tabs: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'explore', label: 'Explore', icon: 'search' },
  { id: 'orders', label: 'Orders', icon: 'receipt' },
  { id: 'favorites', label: 'Saved', icon: 'heart' },
  { id: 'profile', label: 'Profile', icon: 'user' },
]

export function TabBar({
  active,
  onSelect,
  cartCount,
  onCart,
  activeOrder,
  labels,
  bagLabel,
  navLabel = 'Main navigation',
}: {
  active: TabId
  onSelect: (t: TabId) => void
  cartCount: number
  onCart: () => void
  activeOrder: boolean
  labels?: Partial<Record<TabId, string>>
  bagLabel?: string
  navLabel?: string
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const barRef = useRef<HTMLDivElement>(null)
  const prevInd = useRef<{ x: number; w: number } | null>(null)
  const [ind, setInd] = useState<CSSProperties>({ opacity: 0 })

  const measure = useCallback(() => {
    const el = refs.current[active]
    const bar = barRef.current
    if (!el || !bar) return
    const x = el.offsetLeft
    const w = el.offsetWidth
    if (prevInd.current && prevInd.current.x === x && prevInd.current.w === w) return
    prevInd.current = { x, w }
    setInd({ transform: `translateX(${x}px)`, width: w, opacity: 1 })
  }, [active])

  useLayoutEffect(() => {
    measure()
  }, [measure, labels])

  useEffect(() => {
    const el = refs.current[active]
    const bar = barRef.current
    if (!el || !bar) return

    let disposed = false
    const ro = new ResizeObserver(measure)
    ro.observe(bar)
    ro.observe(el)
    window.addEventListener('resize', measure)
    void document.fonts?.ready?.then(() => {
      if (!disposed) measure()
    })
    return () => {
      disposed = true
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [active, measure])

  const defaultBagLabel = `Bag, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`

  return (
    <div className="dock">
      <nav className="tabbar glass-dark" ref={barRef} aria-label={navLabel}>
        <span className="tab-indicator" style={ind} />
        {tabs.map((t) => {
          const label = labels?.[t.id] ?? t.label
          const isActive = active === t.id
          return (
            <button
              type="button"
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el
              }}
              className={isActive ? 'active' : ''}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                haptic(6)
                onSelect(t.id)
              }}
            >
              <span className="tab-icon">
                <Icon name={t.icon} size={20} weight={isActive ? 'fill' : 'regular'} />
                {t.id === 'orders' && activeOrder && <i className="live-dot" />}
              </span>
              <span className="tab-label">{label}</span>
            </button>
          )
        })}
      </nav>
      <button
        type="button"
        id="cart-fab"
        className={`cart-fab glass-dark ${cartCount ? 'has-items' : ''}`}
        onClick={() => {
          haptic(8)
          onCart()
        }}
        aria-label={bagLabel ?? defaultBagLabel}
      >
        <Icon name="bag" size={22} weight={cartCount ? 'fill' : 'regular'} />
        {cartCount > 0 && (
          <b key={cartCount} className="badge">
            {cartCount}
          </b>
        )}
      </button>
    </div>
  )
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
  )
}

function useModalFocusTrap(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onEscape: () => void,
) {
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape

  useEffect(() => {
    const container = containerRef.current
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (container && !container.contains(document.activeElement)) {
      container.focus({ preventScroll: true })
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onEscapeRef.current()
        return
      }
      if (e.key !== 'Tab' || !container) return
      const focusables = getFocusableElements(container)
      if (!focusables.length) {
        e.preventDefault()
        container.focus({ preventScroll: true })
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey) {
        if (active === first || active === container || !container.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !container.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (previousFocus && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [containerRef])
}

export function Sheet({
  title,
  onClose,
  children,
  tall,
  closeLabel = 'Close',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  tall?: boolean
  closeLabel?: string
}) {
  const [full, setFull] = useState(!!tall)
  const [closing, setClosing] = useState(false)
  const start = useRef<number | null>(null)
  const dragYRef = useRef(0)
  const backdropHit = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const close = useCallback(() => {
    if (closeTimer.current !== null) return
    setClosing(true)
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null
      onCloseRef.current()
    }, 220)
  }, [])

  useEffect(
    () => () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current)
        closeTimer.current = null
      }
    },
    [],
  )

  useModalFocusTrap(containerRef, close)

  const down = (e: React.PointerEvent) => {
    start.current = e.clientY
    dragYRef.current = 0
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const move = (e: React.PointerEvent) => {
    if (start.current === null || !containerRef.current) return
    const dy = e.clientY - start.current
    dragYRef.current = dy
    containerRef.current.style.transition = 'none'
    containerRef.current.style.transform = `translateY(${Math.max(dy, -40)}px)`
  }
  const up = () => {
    if (start.current === null) return
    const dy = dragYRef.current
    start.current = null
    dragYRef.current = 0
    if (containerRef.current) {
      containerRef.current.style.transition = ''
      containerRef.current.style.transform = ''
    }
    if (dy > 110) {
      if (full && !tall) {
        setFull(false)
        haptic(6)
      } else close()
    } else if (dy < -60 && !full) {
      setFull(true)
      haptic(6)
    }
  }

  return (
    <div
      className={`sheet-overlay ${closing ? 'closing' : ''}`}
      onPointerDown={(e) => {
        backdropHit.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (backdropHit.current && e.target === e.currentTarget) close()
      }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className={`sheet glass-light ${full ? 'full' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="sheet-grab"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <span className="sheet-handle" />
          <div className="sheet-title">
            <h2>{title}</h2>
            <button
              type="button"
              className="glass-circle small"
              onClick={close}
              aria-label={closeLabel}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

export type DialogSpec = {
  title: string
  message: string
  confirm: string
  destructive?: boolean
  onConfirm: () => void
}
export function Dialog({
  spec,
  onClose,
  cancelLabel = 'Cancel',
}: {
  spec: DialogSpec
  onClose: () => void
  cancelLabel?: string
}) {
  const backdropHit = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  useModalFocusTrap(containerRef, onClose)

  return (
    <div
      className="dialog-overlay"
      onPointerDown={(e) => {
        backdropHit.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (backdropHit.current && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="dialog glass-light"
        role="alertdialog"
        aria-modal="true"
        aria-label={spec.title}
      >
        <h3>{spec.title}</h3>
        <p>{spec.message}</p>
        <div className="dialog-actions">
          <button type="button" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={spec.destructive ? 'destructive' : ''}
            onClick={() => {
              haptic(14)
              spec.onConfirm()
              onClose()
            }}
          >
            {spec.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Toast({ message, tone }: { message: string; tone: 'success' | 'error' | 'info' }) {
  return (
    <div className={`toast glass-dark ${tone}`} role="status">
      <span className="toast-icon">
        <Icon name={tone === 'error' ? 'close' : tone === 'info' ? 'sparkle' : 'check'} size={14} />
      </span>
      {message}
    </div>
  )
}

/** Favorite button with particle burst — safe sibling button (no nested buttons). */
export function FavButton({
  on,
  onToggle,
  glass,
  saveLabel = 'Save',
  removeLabel = 'Remove from saved',
  entityName,
}: {
  on: boolean
  onToggle: () => void
  glass?: boolean
  saveLabel?: string
  removeLabel?: string
  entityName?: string
}) {
  const [burst, setBurst] = useState(0)
  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    haptic(6)
    if (!on) setBurst((b) => b + 1)
    onToggle()
  }
  const baseLabel = on ? removeLabel : saveLabel
  const ariaLabel = entityName ? `${baseLabel}: ${entityName}` : baseLabel
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={ariaLabel}
      className={`fav ${glass ? 'glass-circle' : ''} ${on ? 'on' : ''}`}
      onClick={toggle}
    >
      <Icon name="heart" size={17} weight={on ? 'fill' : 'regular'} />
      {burst > 0 && (
        <span key={burst} className="burst" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} style={{ '--a': `${i * 45}deg` } as CSSProperties} />
          ))}
        </span>
      )}
    </button>
  )
}

export function Img({
  src,
  alt = '',
  className = '',
  style,
  width,
  height,
}: {
  src: string
  alt?: string
  className?: string
  style?: CSSProperties
  width?: number
  height?: number
}) {
  if (!src?.trim()) return null

  // Eager on purpose: native lazy-loading never fires inside the app's custom scroll container.
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      decoding="async"
    />
  )
}

/* ── Interaction components ── */

/** Digits roll on a drum when the value changes — exact em offset, no rounding drift. */
export function Rolling({ value }: { value: string }) {
  const chars = value.split('')
  return (
    <span className="rolling" dir="ltr" aria-label={value}>
      {chars.map((c, i) => {
        const key = chars.length - i
        return /\d/.test(c) ? (
          <span key={key} className="roll" aria-hidden="true">
            <span className="roll-strip" style={{ transform: `translateY(-${Number(c) * 1.3}em)` }}>
              {'0123456789'.split('').map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={key} className="roll-char" aria-hidden="true">
            {c}
          </span>
        )
      })}
    </span>
  )
}

/** Words resolve quickly (capped <= 90ms stagger) without blurring or blanking. */
export function BlurText({
  lines,
  em,
  className = '',
  delay = 0,
}: {
  lines: string[]
  em?: number
  className?: string
  delay?: number
}) {
  let n = 0
  const baseDelay = Math.min(delay, 60)
  return (
    <h1 className={`blur-text ${className}`}>
      {lines.map((line, li) => {
        const words = line.split(' ').map((w, wi, arr) => (
          <span key={wi}>
            <span
              className="blur-word"
              style={{ animationDelay: `${baseDelay + Math.min(n++ * 20, 90)}ms` }}
            >
              {w}
            </span>
            {wi < arr.length - 1 ? ' ' : ''}
          </span>
        ))
        return (
          <span key={li}>
            {li === em ? <em>{words}</em> : words}
            {li < lines.length - 1 && <br />}
          </span>
        )
      })}
    </h1>
  )
}

/** Press-and-hold to confirm destructive actions. */
export function HoldButton({
  label,
  holdingLabel = 'Keep holding…',
  onConfirm,
  ms = 1200,
}: {
  label: string
  holdingLabel?: string
  onConfirm: () => void
  ms?: number
}) {
  const [holding, setHolding] = useState(false)
  const timer = useRef(0)
  const start = () => {
    if (holding) return
    setHolding(true)
    haptic(6)
    timer.current = window.setTimeout(() => {
      setHolding(false)
      haptic(30)
      onConfirm()
    }, ms)
  }
  const stop = () => {
    window.clearTimeout(timer.current)
    setHolding(false)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <button
      type="button"
      className={`hold ${holding ? 'holding' : ''}`}
      style={{ '--hold': `${ms}ms` } as CSSProperties}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault()
          start()
        }
      }}
      onKeyUp={stop}
    >
      <span className="hold-fill" />
      <span className="hold-label">
        <Icon name="trash" size={16} />
        {holding ? holdingLabel : label}
      </span>
    </button>
  )
}

/** Infinite ticker — pauses on press. */
export function Marquee({ items }: { items: [string, string][] }) {
  const row = (hidden?: boolean) => (
    <div className="mq-row" aria-hidden={hidden}>
      {items.map(([local, en]) => (
        <span key={en} className="mq-item">
          <b lang="am">{local}</b>
          {en}
          <Icon name="sparkle" size={12} weight="fill" />
        </span>
      ))}
    </div>
  )
  return (
    <div className="marquee" aria-label={items.map((i) => i[1]).join(', ')}>
      <div className="mq-track">
        {row()}
        {row(true)}
      </div>
    </div>
  )
}
