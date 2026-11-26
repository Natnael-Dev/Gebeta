import { Component, type ErrorInfo, type ReactNode } from 'react'
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from '../domain/storage'
import { Button } from '../ui'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Gebeta ErrorBoundary caught an error:', error, info)
  }

  private reload = () => {
    window.location.reload()
  }

  private resetLocalData = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
      window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    } catch {
      // Ignore storage errors in restricted contexts
    }
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="shell">
        <div className="ambient" aria-hidden />
        <div className="scroller">
          <div className="screen centered">
            <span className="kicker">Gebeta</span>
            <h1 className="display">Something went wrong</h1>
            <p className="lede">
              We hit an unexpected issue displaying this screen. You can reload the app or reset
              local data.
            </p>
            {this.state.message && <p className="hint">{this.state.message}</p>}
            <Button variant="ink" onClick={this.reload}>
              Reload
            </Button>
            <Button variant="ghost" onClick={this.resetLocalData}>
              Reset local data
            </Button>
          </div>
        </div>
      </main>
    )
  }
}
