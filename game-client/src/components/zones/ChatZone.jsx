import React, { useState, useRef, useEffect } from 'react';
import './ChatZone.css';

const QUICK_PHRASES = [
  { key: 'gg', label: 'Good game' },
  { key: 'np', label: 'Nice play' },
  { key: 'think', label: 'Thinking…' },
  { key: 'gl', label: 'Good luck' },
];

export default function ChatZone({ G, ctx, config = {}, handlers, playerID, sandboxMode, sandboxLabel }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, open]);

  function handleSend() {
    const msg = input.trim();
    if (!msg) return;
    handlers.sendChatMessage?.(playerID, msg).catch(() => null);
    setLocalMessages(prev => [...prev, { sender: playerID, text: msg, ts: Date.now() }]);
    setInput('');
  }

  function handleQuick(phraseKey) {
    handlers.sendQuickPhrase?.(playerID, phraseKey).catch(() => null);
    const label = QUICK_PHRASES.find(p => p.key === phraseKey)?.label || phraseKey;
    setLocalMessages(prev => [...prev, { sender: playerID, text: label, ts: Date.now() }]);
  }

  const sandboxMessages = sandboxMode
    ? [{ sender: '1', text: 'Nice play!', ts: 1 }, { sender: '0', text: 'Thanks!', ts: 2 }]
    : [];
  const messages = [...sandboxMessages, ...localMessages];

  return (
    <div className={`chat-zone ${open ? 'open' : ''} ${sandboxMode ? 'sandbox-zone' : ''}`}>
      {sandboxMode && <span className="sandbox-label">{sandboxLabel || 'ChatZone'}</span>}

      <button className="chat-toggle-btn" onClick={() => setOpen(o => !o)} aria-label={open ? 'Close chat' : 'Open chat'}>
        {open ? '✕ Chat' : '💬 Chat'}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-messages" aria-live="polite" aria-label="Chat messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.sender === playerID ? 'chat-msg-mine' : 'chat-msg-theirs'}`}>
                <span className="chat-msg-sender">P{m.sender}</span>
                <span className="chat-msg-text">{m.text}</span>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="chat-empty">No messages yet.</div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-quick-phrases">
            {QUICK_PHRASES.map(p => (
              <button key={p.key} className="chat-quick-btn" onClick={() => handleQuick(p.key)}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value.slice(0, 200))}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type a message…"
              aria-label="Chat message input"
              maxLength={200}
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
