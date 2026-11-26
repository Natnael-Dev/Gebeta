import { App as CapApp } from '@capacitor/app'
import { Capacitor, SystemBarType, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Keyboard } from '@capacitor/keyboard'
import { LocalNotifications } from '@capacitor/local-notifications'
import { SplashScreen } from '@capacitor/splash-screen'

export const isNativePlatform = () => Capacitor.isNativePlatform()
export const isAndroidDevice = () =>
  (isNativePlatform() && Capacitor.getPlatform() === 'android') ||
  /android/i.test(navigator.userAgent)

export function syncSystemBars(darkTop: boolean, darkBottom = false) {
  if (!isNativePlatform()) return
  void SystemBars.setStyle({
    style: darkTop ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
    bar: SystemBarType.StatusBar,
  }).catch(() => {})
  void SystemBars.setStyle({
    style: darkBottom ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
    bar: SystemBarType.NavigationBar,
  }).catch(() => {})
}

export function triggerHaptic(ms = 8) {
  if (isNativePlatform()) {
    const style = ms >= 20 ? ImpactStyle.Heavy : ms >= 10 ? ImpactStyle.Medium : ImpactStyle.Light
    void Haptics.impact({ style }).catch(() => {})
    return
  }
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(ms)
    } catch {
      // Ignore blocked vibration before user gesture
    }
  }
}

export async function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  if (isNativePlatform()) {
    const perms = await Geolocation.checkPermissions()
    if (perms.location !== 'granted' && perms.coarseLocation !== 'granted') {
      const requested = await Geolocation.requestPermissions()
      if (requested.location !== 'granted' && requested.coarseLocation !== 'granted') {
        throw new Error('Location permission denied')
      }
    }
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
    return { lat: pos.coords.latitude, lng: pos.coords.longitude }
  }

  if (!('geolocation' in navigator)) {
    throw new Error('Geolocation unsupported')
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  })
}

export async function sendLocalNotification(
  title: string,
  body: string,
): Promise<'sent' | 'denied' | 'unsupported'> {
  if (isNativePlatform()) {
    const perms = await LocalNotifications.checkPermissions()
    if (perms.display !== 'granted') {
      const requested = await LocalNotifications.requestPermissions()
      if (requested.display !== 'granted') return 'denied'
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() % 2147483647),
          title,
          body,
          schedule: { at: new Date(Date.now() + 150) },
        },
      ],
    })
    return 'sent'
  }

  if (!('Notification' in window)) return 'unsupported'
  const perm =
    Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission
  if (perm !== 'granted') return 'denied'

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, { body, icon: '/icon-192.png' })
      return 'sent'
    } catch {
      // Fall through to browser Notification constructor on desktop
    }
  }

  try {
    new Notification(title, { body, icon: '/icon-192.png' })
    return 'sent'
  } catch {
    return 'unsupported'
  }
}

export function initNativeShell(opts: { onBack: () => boolean }) {
  const cleanups: (() => void)[] = []
  const setKeyboardOpen = (open: boolean) => {
    document.documentElement.classList.toggle('keyboard-open', open)
  }

  if (isNativePlatform()) {
    void SplashScreen.hide().catch(() => {})

    const backSub = CapApp.addListener('backButton', () => {
      const handled = opts.onBack()
      if (!handled) {
        void CapApp.minimizeApp().catch(() => {
          void CapApp.exitApp()
        })
      }
    })
    cleanups.push(() => {
      void backSub.then((h) => h.remove())
    })

    const kbShow = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true))
    const kbWillShow = Keyboard.addListener('keyboardWillShow', () => setKeyboardOpen(true))
    const kbHide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false))
    const kbWillHide = Keyboard.addListener('keyboardWillHide', () => setKeyboardOpen(false))
    cleanups.push(() => {
      void kbShow.then((h) => h.remove())
      void kbWillShow.then((h) => h.remove())
      void kbHide.then((h) => h.remove())
      void kbWillHide.then((h) => h.remove())
    })
  } else {
    // Web fallback: keep a sentinel history entry so Android Chrome Back navigates in-app.
    if (!window.history.state?.gebetaSentinel) {
      window.history.replaceState({ gebetaBase: true }, '')
      window.history.pushState({ gebetaSentinel: true }, '')
    }
    const onPopState = () => {
      const handled = opts.onBack()
      if (handled) {
        window.history.pushState({ gebetaSentinel: true }, '')
      }
    }
    window.addEventListener('popstate', onPopState)
    cleanups.push(() => window.removeEventListener('popstate', onPopState))

    const vv = window.visualViewport
    if (vv) {
      let maxHeight = window.innerHeight
      const onOrientationChange = () => {
        maxHeight = window.innerHeight
        setKeyboardOpen(false)
      }
      const onResize = () => {
        const active = document.activeElement
        const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
        if (!isInput) {
          maxHeight = window.innerHeight
          setKeyboardOpen(false)
          return
        }
        maxHeight = Math.max(maxHeight, window.innerHeight)
        setKeyboardOpen(vv.height < maxHeight * 0.78)
      }
      vv.addEventListener('resize', onResize)
      window.addEventListener('orientationchange', onOrientationChange)
      cleanups.push(() => {
        vv.removeEventListener('resize', onResize)
        window.removeEventListener('orientationchange', onOrientationChange)
      })
    }
  }

  return () => {
    setKeyboardOpen(false)
    for (const fn of cleanups) fn()
  }
}
