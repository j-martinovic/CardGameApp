import React from 'react';
import './MessagePanel.css';

export default function MessagePanel({
  visible,
  title,
  body,
  buttons = [],
  onDismiss,
}) {
  if (!visible) return null;

  return (
    <div className="mp-overlay" onClick={onDismiss}>
      <div className="mp-panel" onClick={e => e.stopPropagation()}>
        {title && <h2 className="mp-title">{title}</h2>}
        {body  && <p  className="mp-body">{body}</p>}
        {buttons.length > 0 && (
          <div className="mp-buttons">
            {buttons.map((btn, i) => (
              <button
                key={i}
                className={`mp-btn mp-btn--${btn.variant || 'secondary'}`}
                onClick={btn.onClick}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
