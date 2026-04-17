import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Orb } from '../components/Orb';
import { MOOD_COLORS } from '@emotion/detector';
import type { Mood } from '@emotion/detector';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface HomeScreenProps {
  onStartChat: () => void;
}

export default function HomeScreen({ onStartChat }: HomeScreenProps) {
  const { currentMood, moodHistory } = useAppStore();
  const today = new Date().getDay();

  const dayMoods: Record<number, Mood> = {};
  const sorted = [...moodHistory].sort((a, b) => b.date.localeCompare(a.date));
  for (const entry of sorted) {
    const date = new Date(entry.date + 'T12:00:00');
    const dow = date.getDay();
    if (!(dow in dayMoods)) dayMoods[dow] = entry.mood;
  }

  const moodColor = MOOD_COLORS[currentMood];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Logo */}
        <View style={styles.header}>
          <Text style={styles.logo}>Aura</Text>
        </View>

        {/* Orb hero */}
        <View style={styles.orbSection}>
          <Orb mood={currentMood} size={96} />
          <Text style={styles.heroTitle}>
            {getGreeting()}
          </Text>
          <Text style={styles.heroSub}>
            Your companion is here. How are you feeling?
          </Text>
        </View>

        {/* Mood Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.cardLabel}>This week</Text>
          <View style={styles.timeline}>
            {DAY_LABELS.map((label, i) => {
              const mood = dayMoods[i];
              const isToday = i === today;
              const color = mood ? MOOD_COLORS[mood] : undefined;

              return (
                <View key={label} style={styles.dayCol}>
                  <View
                    style={[
                      styles.dayDot,
                      isToday && { borderColor: color || '#c8a97e', borderWidth: 1.5 },
                      mood && { backgroundColor: `${color}22` },
                    ]}
                  >
                    {mood && (
                      <View
                        style={[
                          styles.dotInner,
                          { backgroundColor: color, shadowColor: color },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.dayLabel, isToday && { color: '#c8a97e' }]}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: moodColor }]}
          onPress={onStartChat}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Open Chat</Text>
        </TouchableOpacity>

        {/* Quick starters */}
        <View style={styles.quickSection}>
          <Text style={styles.cardLabel}>Quick starts</Text>
          {[
            "I'm feeling anxious today",
            "I just need to talk",
            "Help me think something through",
          ].map((s) => (
            <TouchableOpacity
              key={s}
              style={styles.quickItem}
              onPress={onStartChat}
              activeOpacity={0.7}
            >
              <Text style={styles.quickText}>{s}</Text>
              <Text style={styles.quickArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning.';
  if (h < 18) return 'Good afternoon.';
  return 'Good evening.';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scroll: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 26,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#c8a97e',
    letterSpacing: 0.5,
  },
  orbSection: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  heroTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 22,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#f0ede8',
  },
  heroSub: {
    fontSize: 14,
    color: '#3a3840',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  timelineCard: {
    backgroundColor: '#0f0f12',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',
    gap: 14,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#2e2d35',
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 5,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#141417',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 4,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#2e2d35',
    textTransform: 'uppercase',
  },
  ctaBtn: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1208',
    letterSpacing: 0.2,
  },
  quickSection: {
    gap: 10,
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#0f0f12',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',
  },
  quickText: {
    fontSize: 13.5,
    color: '#3a3840',
    flex: 1,
  },
  quickArrow: {
    fontSize: 15,
    color: '#2e2d35',
  },
});