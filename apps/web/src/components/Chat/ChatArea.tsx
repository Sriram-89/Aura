'use client';

import { useRef, useState, KeyboardEvent } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Mic, Send } from 'lucide-react';

export function ChatArea() {
  const {
    messages,
    addMessage,
    setMood,
    setIsThinking,
  } = useAppStore();

  const [input, setInput] = useState('');
  const sendingRef = useRef(false);

  // ✅ SEND
  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text) return;
    if (sendingRef.current) return;

    sendingRef.current = true;

    addMessage({
      role: 'user',
      text,
      timestamp: Date.now(),
    });

    setInput('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      addMessage({
        role: 'assistant',
        text: data.reply || "Mawa… reply raledhu 😅",
        timestamp: Date.now(),
      });

      setMood(data.mood || 'neutral');
    } catch {
      addMessage({
        role: 'assistant',
        text: "Network issue mawa… malli try chey.",
        timestamp: Date.now(),
      });
    } finally {
      setIsThinking(false);
      sendingRef.current = false;
    }
  };

  // ✅ ENTER
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ VOICE
  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };

    recognition.start();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

      {/* 🔥 CENTER CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 120 }}>
            
            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 600,
              color: '#e6c36a',
              fontSize: '48px'
            }}>
              Hello, I'm Aura.
            </h1>

            <p style={{
              color: '#9aa0a6',
              marginTop: 10
            }}>
              your personal companion...
            </p>

          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: 10 }}>
              <b>{msg.role === 'user' ? 'You' : 'Aura'}:</b> {msg.text}
            </div>
          ))
        )}

      </div>

      {/* 💎 INPUT BAR (ALWAYS VISIBLE) */}
      <div style={{
        position: 'fixed',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type something..."
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e5e7eb',
              resize: 'none'
            }}
          />

          {/* MIC */}
          <button
            onClick={startVoiceInput}
            style={{
              background: 'transparent',
              border: 'none',
              marginLeft: 8,
              cursor: 'pointer'
            }}
          >
            <Mic size={18} color="#e6c36a" />
          </button>

          {/* SEND */}
          <button
            onClick={() => handleSend()}
            style={{
              marginLeft: 8,
              background: '#e6c36a',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <Send size={16} color="#000" />
          </button>
          
        </div>
      </div>

    </div>
  );
}