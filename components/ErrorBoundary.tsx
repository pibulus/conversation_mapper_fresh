/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */

import { Component } from "preact";
import type { ComponentChildren } from "preact";

interface ErrorBoundaryProps {
  children: ComponentChildren;
  fallback?: ComponentChildren;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div class="error-boundary-fallback" style={{
          padding: '2rem',
          margin: '1rem',
          borderRadius: '8px',
          backgroundColor: 'var(--color-error-bg, #FEE)',
          border: '2px solid var(--color-error, #C33)',
          color: 'var(--soft-black, #2a2a2a)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            color: 'var(--color-error, #C33)'
          }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: '1rem', opacity: 0.8 }}>
            An error occurred while rendering this component. Try refreshing the page.
          </p>
          <details style={{ marginBottom: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
              Error details
            </summary>
            <pre style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '4px',
              fontSize: '0.875rem',
              overflow: 'auto'
            }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
          </details>
          <button
            onClick={this.resetError}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-accent, #FF69B4)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
