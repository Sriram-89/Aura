import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';
import type { Mood } from '../../../packages/emotion-engine/src/detector';

// React Native linear gradient requires expo-linear-gradient
// import { LinearGradient } from 'expo-linear-gradient';

interface OrbProps {
  mood: Mood;
  size?: number;
  isThinking?: boolean;
  isListening?: boolean;
}

const MOOD_COLORS: Record<Mood, [string, string]> = {
  sad:     ['#7b9fd4', '#3d5a8a'],
  low:     ['#8b8fc4', '#4a4a7a'],
  neutral: ['#7ab8c4', '#3a7a8a'],
  calm:    ['#5ecfa8', '#2a7a5a'],
  happy:   ['#8fc47a', '#4a7a3a'],
  excited: ['#c47a8f', '#8a3a5a'],
};

export function Orb({ mood, size = 44, isThinking = false, isListening = false }: OrbProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.9)).current;
  const primaryColor = MOOD_COLORS[mood][0];

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    if (isThinking) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1.1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 0.92, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(opacityAnim, { toValue: 0.65, duration: 600, useNativeDriver: true }),
          ]),
        ])
      );
    } else if (isListening) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.06, duration: 400, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.96, duration: 400, useNativeDriver: true }),
        ])
      );
    } else {
      // Breathing
      animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1.07, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(opacityAnim, { toValue: 0.88, duration: 2000, useNativeDriver: true }),
          ]),
        ])
      );
    }

    animation.start();
    return () => animation.stop();
  }, [isThinking, isListening, mood]);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: primaryColor,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          shadowColor: primaryColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: size * 0.4,
          elevation: 8,
        },
      ]}
    />
  );
}