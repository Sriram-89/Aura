'use client';

import { useEffect, useRef } from 'react';
import type { Mood } from '@emotion/detector';
import { MOOD_GRADIENTS } from '@emotion/detector';

interface OrbProps {
  mood: Mood;
  size?: number;
  isThinking?: boolean;
  isListening?: boolean;
  className?: string;
}

export function Orb({ mood, size = 44, isThinking = false, isListening = false, className = '' }: OrbProps) {
  const orbRef = useRef<HTMLDivElement>(null);
  const [from, to] = MOOD_GRADIENTS[mood];

  const getBoxShadow = () => {
    const [primary] = MOOD_GRADIENTS[mood];
    const intensity = isThinking ? '0.6' : isListening ? '0.5' : '0.3';
    return `0 0 ${size * 0.7}px color-mix(in srgb, ${primary} ${intensity === '0.6' ? '60%' : intensity === '0.5' ? '50%' : '30%'}, transparent)`;
  };

  const animClass = isThinking
    ? 'aura-orb-think'
    : isListening
    ? 'aura-orb-listen'
    : 'aura-orb-breathe';

  return (
    <>
      <div
        ref={orbRef}
        className={`aura-orb ${animClass} ${className}`}
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 35%, ${from}, ${to})`,
          boxShadow: getBoxShadow(),
        }}
      />
    </>
  );
}