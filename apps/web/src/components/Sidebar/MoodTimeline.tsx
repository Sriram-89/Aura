'use client';

import { useMemo } from 'react';
type Mood = 'happy' | 'sad' | 'angry' | 'anxious' | 'calm' | 'neutral';
import type { MoodEntry } from '../../store/useAppStore';

interface MoodTimelineProps {
  moodHistory: MoodEntry[];
}
// ✅ LOCAL MOOD COLORS
const MOOD_COLORS: Record<string, string> = {
  happy: '#4ade80',
  sad: '#60a5fa',
  angry: '#f87171',
  anxious: '#facc15',
  calm: '#a78bfa',
  neutral: '#9ca3af',
};

// ✅ LABEL FUNCTION
function getMoodLabel(mood: string) {
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function MoodTimeline({ moodHistory }: MoodTimelineProps) {
  const today = new Date().getDay();

  // Build a map of day-of-week → most recent mood
  const dayMoods = useMemo(() => {
    const map: Record<number, Mood> = {};
    const sorted = [...moodHistory].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    for (const entry of sorted) {
      const date = new Date(entry.date + 'T12:00:00');
      const dow = date.getDay();
      if (!(dow in map)) map[dow] = entry.mood;
    }
    return map;
  }, [moodHistory]);

  return (
    <div style={{ display: 'flex', gap: 4, padding: '0 4px' }}>
      {DAY_LABELS.map((label, i) => {
        const mood = dayMoods[i];
        const isToday = i === today;
        const color = mood ? MOOD_COLORS[mood] : undefined;

        return (
          <div
            key={label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <div
              title={mood ? getMoodLabel(mood) : 'No data'}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: color
                  ? `color-mix(in srgb, ${color} 22%, #1a1a1f)`
                  : '#1a1a1f',
                border: isToday
                  ? `2px solid ${color || 'rgba(200,169,126,0.5)'}`
                  : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.4s',
                cursor: 'default',
                position: 'relative',
              }}
            >
              {mood && (
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                  }}
                />
              )}
              {!mood && (
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#2a2a35',
                  }}
                />
              )}
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.05em',
                color: isToday ? 'rgba(200,169,126,0.8)' : '#3a3840',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-body)',
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}