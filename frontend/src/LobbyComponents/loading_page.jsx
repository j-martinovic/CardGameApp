import React from 'react';
import './loading_page.css';

function LoadingPage({ 
  message = "Connecting to Game Server...", 
  subMessage = "Synchronizing match credentials..." 
}) {
  return (
    <div className="loading-container">
      <div className="loading-card-wrapper">
        {/* Animated shuffling cards effect */}
        <div className="loading-card card-back"></div>
        <div className="loading-card card-middle"></div>
        <div className="loading-card card-front">
          <span className="card-suit">♠</span>
        </div>
      </div>
      
      <h3 className="loading-title">{message}</h3>
      <p className="loading-subtitle">{subMessage}</p>
      
      {/* Subtle pulsing status indicator */}
      <div className="loading-pulse-dot"></div>
    </div>
  );
}

export default LoadingPage