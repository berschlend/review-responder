import React from 'react';

const LoadingSpinner = () => (
  <div className="loading">
    <div className="spinner"></div>
    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading...</p>
  </div>
);

export default LoadingSpinner;
