import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Oops! Something went wrong</h1>
              <p className="text-gray-500 mt-2 text-sm">We encountered an error loading the application</p>
            </div>

            <div className="card p-6 space-y-4">
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                <p className="text-red-300 text-sm font-mono break-words">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors"
              >
                Reload Page
              </button>

              <details className="text-xs text-gray-400">
                <summary className="cursor-pointer hover:text-gray-300 mb-2">Error Details</summary>
                <pre className="bg-gray-900 p-2 rounded text-xs overflow-x-auto mt-2">
                  {this.state.error?.stack || 'No stack trace available'}
                </pre>
              </details>
            </div>

            <p className="text-gray-600 text-xs mt-6 text-center">
              If this persists, try clearing your browser cache and reloading
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
