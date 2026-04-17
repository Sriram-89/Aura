'use client';

import { useState } from 'react';
import type { SuggestionCard } from '../../store/useAppStore';
import { MOOD_COLORS } from '@emotion/detector';
import type { Mood } from '@emotion/detector';

interface SuggestionCardsProps {
  suggestion: SuggestionCard | null;
  followUpPrompts: string[];
  currentMood: Mood;
  onSendPrompt: (text: string) => void;
}

export function SuggestionCards({
  suggestion,
  followUpPrompts,
  currentMood,
  onSendPrompt,
}: SuggestionCardsProps) {
  const [dismissed, setDismissed] = useState(false);
  const accentColor = MOOD_COLORS[currentMood];

  if (followUpPrompts.length === 0 && !suggestion) return null;

  return (
    <div
      style={{
        padding: '0 26px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        animation: 'suggestions-in 0.4s ease',
      }}
    >
      <style>{`
        @keyframes suggestions-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .prompt-chip:hover { background: rgba(255,255,255,0.07) !important; color: #c8c4be !important; }
        .suggestion-card:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* Contextual suggestion card */}
      {suggestion && !dismissed && (
        <div
          className="suggestion-card"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '11px 14px',
            background: `color-mix(in srgb, ${accentColor} 6%, #141417)`,
            borderRadius: 10,
            border: `1px solid color-mix(in srgb, ${accentColor} 18%, rgba(255,255,255,0.05))`,
            cursor: 'default',
            transition: 'background 0.2s',
          }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>{suggestion.icon}</span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12.5,
                color: '#7a7880',
                fontFamily: 'DM Sans, system-ui, sans-serif',
                lineHeight: 1.55,
              }}
            >
              {suggestion.text}
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#2e2d35',
              padding: 0,
              lineHeight: 1,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Follow-up prompt chips */}
      {followUpPrompts.length > 0 && (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {followUpPrompts.slice(0, 3).map((prompt, i) => (
            <button
              key={i}
              className="prompt-chip"
              onClick={() => onSendPrompt(prompt)}
              style={{
                padding: '7px 13px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20,
                color: '#4a4850',
                fontFamily: 'DM Sans, system-ui, sans-serif',
                fontSize: 12.5,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}