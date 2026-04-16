import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '300px',
      padding: '40px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(78, 205, 196, 0.3)',
        borderTop: '3px solid #4ECDC4',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{
        marginTop: '20px',
        color: '#888',
        fontSize: '0.9rem',
      }}>
        {message}
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
