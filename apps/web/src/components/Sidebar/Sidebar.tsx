'use client';

import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { MoodTimeline } from './MoodTimeline';
import type { Conversation } from '../../store/useAppStore';

interface SidebarProps {
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function Sidebar({ onSelectConversation, onNewConversation }: SidebarProps) {
  const { conversations, conversationId, moodHistory, isSynced, isOnline, currentMood } =
    useAppStore();

  return (
    <aside
      style={{
        width: 272,
        background: '#0f0f12',
        borderRight: '1px solid rgba(255,255,255,0.055)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '22px 20px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 21,
            fontWeight: 300,
            fontStyle: 'italic',
            color: '#c8a97e',
            letterSpacing: '0.02em',
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#c8a97e',
              animation: 'sidebar-pulse 3s ease-in-out infinite',
            }}
          />
          Aura
        </div>
        <style>{`
          @keyframes sidebar-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.65); }
          }
        `}</style>
      </div>

      {/* Mood Timeline */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#2e2d35',
            marginBottom: 12,
            fontFamily: 'DM Sans, system-ui, sans-serif',
          }}
        >
          This week
        </div>
        <MoodTimeline moodHistory={moodHistory} />
      </div>

      {/* Sync Status */}
      <div style={{ padding: '4px 16px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 11px',
            background: '#141417',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isOnline ? (isSynced ? '#4caf50' : '#c8a97e') : '#666',
              animation: !isSynced && isOnline ? 'sidebar-pulse 1s ease-in-out infinite' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: '#3a3840',
              fontFamily: 'DM Sans, system-ui, sans-serif',
            }}
          >
            {!isOnline ? 'Offline' : isSynced ? 'Synced · Web' : 'Syncing…'}
          </span>
        </div>
      </div>

      {/* Conversations Label */}
      <div style={{ padding: '6px 20px 6px' }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#2e2d35',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          }}
        >
          Conversations
        </div>
      </div>

      {/* Conversation List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 10px',
        }}
      >
        <style>{`
          .conv-scroll::-webkit-scrollbar { width: 3px; }
          .conv-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }
          .conv-item-btn:hover { background: rgba(255,255,255,0.04) !important; }
        `}</style>
        {!conversations || conversations.length === 0 ? (
          <div
            style={{
              padding: '10px 10px',
              fontSize: 12,
              color: '#2e2d35',
              fontFamily: 'DM Sans, system-ui, sans-serif',
            }}
          >
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              className="conv-item-btn"
              onClick={() => onSelectConversation(conv.id)}
              style={{
                width: '100%',
                padding: '9px 10px',
                borderRadius: 7,
                background: conv.id === conversationId ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: 2,
                transition: 'background 0.15s',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: conv.id === conversationId ? '#e8e4dd' : '#5a5758',
                  fontFamily: 'DM Sans, system-ui, sans-serif',
                  fontWeight: 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: 3,
                }}
              >
                {conv.title || 'Conversation'}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#2e2d35',
                  fontFamily: 'DM Sans, system-ui, sans-serif',
                  display: 'flex',
                  gap: 6,
                }}
              >
                {formatTimestamp(conv.updatedAt)}
                <span>·</span>
                {conv.messageCount} msg{conv.messageCount !== 1 ? 's' : ''}
              </div>
            </button>
          ))
        )}
      </div>

      {/* New Conversation */}
      <button
        onClick={onNewConversation}
        style={{
          margin: '8px 12px 12px',
          padding: '10px 12px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          color: '#3a3840',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          fontSize: 13,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.15s',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
          (e.currentTarget as HTMLButtonElement).style.color = '#6a6770';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = '#3a3840';
        }}
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New conversation
      </button>
    </aside>
  );
}