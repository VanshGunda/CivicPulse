import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Keep details in the browser console for development diagnostics.
    console.error('CivicPulse UI rendering error:', error);
  }

  render() {
    if (this.state.hasError) {
      return <main className="fatal-ui-error"><span><AlertTriangle size={24} /></span><h1>That view hit a snag.</h1><p>Your session is still safe. Reload the view to continue working.</p><button className="btn btn-primary" onClick={() => window.location.reload()}><RefreshCw size={15} /> Reload application</button></main>;
    }
    return this.props.children;
  }
}
