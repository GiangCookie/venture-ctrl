import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '40px',
          textAlign: 'center',
          background: 'rgba(255,0,0,0.05)',
          border: '1px solid rgba(255,100,100,0.3)',
          borderRadius: '16px',
          margin: '20px',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💥</div>
          <h2 style={{ color: '#f66', margin: '0 0 10px', fontSize: '1.5rem' }}>
            Oops! Something went wrong
          </h2>
          <p style={{ color: '#888', margin: '0 0 20px', maxWidth: '400px' }}>
            This tab encountered an error. Try refreshing or switching to another tab.
          </p>
          {this.props.showDetails && (
            <details style={{ textAlign: 'left', maxWidth: '500px', width: '100%' }}>
              <summary style={{ color: '#f66', cursor: 'pointer', marginBottom: '10px' }}>
                Error Details (for debugging)
              </summary>
              <pre style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '15px',
                borderRadius: '8px',
                color: '#f66',
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: '200px',
                textAlign: 'left',
              }}>
                {this.state.error?.toString()}
                {'\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#4ECDC4',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
