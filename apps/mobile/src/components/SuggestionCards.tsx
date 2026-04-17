import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MOOD_COLORS } from '@emotion/detector';
import type { Mood } from '@emotion/detector';

const MOOD_COLORS: Record<Mood, string> = {
  sad: '#7b9fd4',
  low: '#8b8fc4',
  neutral: '#7ab8c4',
  calm: '#5ecfa8',
  happy: '#8fc47a',
  excited: '#c47a8f',
};

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

  if (!suggestion && followUpPrompts.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Contextual suggestion */}
      {suggestion && !dismissed && (
        <View
          style={[
            styles.suggestionCard,
            { borderColor: `${accentColor}30`, backgroundColor: `${accentColor}0D` },
          ]}
        >
          <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
          <Text style={styles.suggestionText}>{suggestion.text}</Text>
          <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.dismissBtn}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Follow-up prompts */}
      {followUpPrompts.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promptsRow}
        >
          {followUpPrompts.slice(0, 3).map((prompt, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => onSendPrompt(prompt)}
              style={styles.promptChip}
              activeOpacity={0.7}
            >
              <Text style={styles.promptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  suggestionIcon: {
    fontSize: 15,
    lineHeight: 20,
  },
  suggestionText: {
    flex: 1,
    fontSize: 12.5,
    color: '#7a7880',
    fontFamily: 'System',
    lineHeight: 18,
  },
  dismissBtn: {
    fontSize: 16,
    color: '#3a3840',
    lineHeight: 20,
  },
  promptsRow: {
    paddingVertical: 2,
    gap: 7,
    flexDirection: 'row',
  },
  promptChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginRight: 7,
  },
  promptText: {
    fontSize: 12.5,
    color: '#4a4850',
    fontFamily: 'System',
  },
});