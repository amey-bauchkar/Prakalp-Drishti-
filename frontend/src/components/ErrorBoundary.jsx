import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Catches a render-time crash and shows something rather than nothing.
 *
 * There was no error boundary anywhere in the application. A single thrown
 * ReferenceError in one panel therefore unmounted the entire tree and left a blank
 * white page — no masthead, no navigation, no explanation, no route back. That is
 * the worst failure mode a government portal can have, because the user cannot tell
 * a crash from a page that simply has nothing on it, and has no way forward except
 * the browser's back button.
 *
 * The boundary keeps the shell alive, names what happened, and offers two exits.
 * The technical detail is present but collapsed: an officer does not need it, and a
 * developer being told "something went wrong" and nothing else is no better off.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Kept on the console for whoever is debugging; never shown as the only signal.
    console.error('Unhandled error in', this.props.label || 'a view', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="panel p-6 sm:p-10 my-6 max-w-2xl mx-auto text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-rose-800" aria-hidden="true" />
        <h2 className="text-lg font-heading font-black text-gov-navy">
          This section could not be displayed
        </h2>
        <p className="text-[12.5px] text-gov-soft leading-relaxed mt-2 max-w-md mx-auto">
          Something went wrong while rendering this page. Your session and your data
          are unaffected — nothing has been changed or submitted. The rest of the
          portal is still available from the navigation above.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-lg bg-gov-navy hover:bg-[#0060B6] text-white text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Try this page again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-lg border border-slate-400 text-gov-navy hover:bg-surface-3 text-xs font-bold transition-colors"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" /> Go to the home page
          </a>
        </div>

        <details className="mt-6 text-left">
          <summary className="text-[11.5px] font-bold text-gov-muted cursor-pointer">
            Technical detail
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-surface-3 border border-gov-border text-[11px] text-gov-soft overflow-x-auto whitespace-pre-wrap">
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </details>
      </div>
    );
  }
}
