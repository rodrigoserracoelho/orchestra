import { Component } from 'react';
import { storageIsPersistent } from '../../services/storage';

// Without this, any uncaught render or effect error unmounts the whole tree and
// the user sees a blank white page with nothing to report. A blank page is the
// hardest bug to diagnose from a user's description, so it is worth never
// shipping one.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            The page could not be displayed. Reloading usually fixes it.
          </p>

          {!storageIsPersistent && (
            <p className="mt-3 text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg px-3 py-2">
              Your browser is blocking site data for this site. Allow it, or open the
              page in your normal browser rather than from inside another app.
            </p>
          )}

          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
          >
            Reload
          </button>

          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 break-words">
            {String(this.state.error?.message || this.state.error)}
          </p>
        </div>
      </div>
    );
  }
}
