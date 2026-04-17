export type Mood = 'sad' | 'low' | 'neutral' | 'calm' | 'happy' | 'excited';

export interface MoodResult {
  mood: Mood;
  confidence: number;
  signals: string[];
  score: number;
}

interface MoodPattern {
  patterns: RegExp[];
  weight: number;
  signals: string[];
}

const MOOD_PATTERNS: Record<Mood, MoodPattern> = {
  excited: {
    patterns: [
      /!{2,}/,
      /[A-Z]{3,}/,
      /go+d/i,
      /\b(wow|amazing|love|awesome|yay+|omg|incredible|unbelievable|fantastic)\b/i,
      /\b(so good|so happy|so excited|can't wait|can not wait)\b/i,
      /😄|🎉|🔥|⚡|🌟|✨/,
    ],
    weight: 1.4,
    signals: ['multiple_exclamations', 'caps_lock', 'elongated_words', 'positive_exclamations'],
  },
  happy: {
    patterns: [
      /\b(good|great|nice|happy|fine|well|better|thanks|wonderful|glad|pleased|joyful|cheerful|delighted)\b/i,
      /😊|😄|🙂|😁|☺️/,
      /\b(made my day|feeling good|doing well|pretty good)\b/i,
    ],
    weight: 1.0,
    signals: ['positive_words', 'gratitude'],
  },
  sad: {
    patterns: [
      /\b(sad|cry|crying|miss|hurt|lost|pain|alone|lonely|hopeless|broken|tired of|devastated|heartbroken|miserable)\b/i,
      /😢|😔|💔|😭|🥺/,
      /\.{3,}/,
      /\b(no one|nobody|nothing|never|always alone|nobody cares|what's the point)\b/i,
      /\b(can't stop|can not stop|won't stop|nothing helps|doesn't matter)\b/i,
    ],
    weight: 1.3,
    signals: ['sadness_words', 'ellipsis', 'isolation_language', 'hopelessness'],
  },
  low: {
    patterns: [
      /\b(okay|ok|meh|idk|whatever|cant|ugh+|nah|blah|exhausted|drained|numb|flat)\b/i,
      /^[a-z]/,
      /\b(not really|not much|kinda|sorta|i guess|i dunno|whatever)\b/i,
      /\b(tired|worn out|bored|unmotivated|can't be bothered)\b/i,
    ],
    weight: 1.1,
    signals: ['casual_shortcuts', 'no_capitalization', 'hedged_language', 'low_energy_words'],
  },
  calm: {
    patterns: [
      /\b(calm|peace|quiet|relax|easy|gentle|slow|taking it easy|serene|tranquil|content|settled)\b/i,
      /\b(meditat|breathing|mindful|grounded|centered|at ease)\b/i,
    ],
    weight: 0.9,
    signals: ['calm_words', 'mindfulness_language'],
  },
  neutral: {
    patterns: [],
    weight: 0.5,
    signals: [],
  },
};

export const MOOD_COLORS: Record<Mood, string> = {
  sad: '#7b9fd4',
  low: '#8b8fc4',
  neutral: '#7ab8c4',
  calm: '#5ecfa8',
  happy: '#8fc47a',
  excited: '#c47a8f',
};

export const MOOD_GRADIENTS: Record<Mood, [string, string]> = {
  sad: ['#7b9fd4', '#3d5a8a'],
  low: ['#8b8fc4', '#4a4a7a'],
  neutral: ['#7ab8c4', '#3a7a8a'],
  calm: ['#5ecfa8', '#2a7a5a'],
  happy: ['#8fc47a', '#4a7a3a'],
  excited: ['#c47a8f', '#8a3a5a'],
};

function scoreText(text: string): Record<Mood, number> {
  const scores: Record<Mood, number> = {
    excited: 0, happy: 0, sad: 0, low: 0, calm: 0, neutral: 0.3,
  };

  const moods = Object.keys(MOOD_PATTERNS) as Mood[];
  for (const mood of moods) {
    const p = MOOD_PATTERNS[mood];
    for (const pattern of p.patterns) {
      if (pattern.test(text)) {
        scores[mood] += p.weight;
      }
    }
  }

  // Linguistic signals
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations >= 2) scores.excited += 0.8;
  if (exclamations === 1) scores.happy += 0.3;

  const questionMarks = (text.match(/\?/g) || []).length;
  if (questionMarks >= 2) scores.low += 0.2;

  const startsLower = /^[a-z]/.test(text.trim());
  if (startsLower) scores.low += 0.4;

  const words = text.trim().split(/\s+/);
  const avgWordLen = words.reduce((a, w) => a + w.length, 0) / words.length;
  if (words.length <= 3 && avgWordLen <= 4) scores.low += 0.3;
  if (words.length > 12) scores.calm += 0.2;

  // Sentence structure signals
  const hasEllipsis = /\.{3,}/.test(text);
  if (hasEllipsis) scores.sad += 0.3;

  const allLower = text === text.toLowerCase();
  if (allLower && text.length > 5) scores.low += 0.2;

  // Punctuation absence
  const noPunctuation = !/[.!?]/.test(text) && text.length > 20;
  if (noPunctuation) scores.low += 0.2;

  return scores;
}

export function detectMood(text: string): MoodResult {
  if (!text.trim()) return { mood: 'neutral', confidence: 1, signals: [], score: 0 };

  const scores = scoreText(text);
  const entries = Object.entries(scores) as [Mood, number][];
  entries.sort((a, b) => b[1] - a[1]);

  const [topMood, topScore] = entries[0];
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const confidence = total > 0 ? topScore / total : 0.5;
  const signals = MOOD_PATTERNS[topMood]?.signals || [];

  return { mood: topMood, confidence, signals, score: topScore };
}

export function detectMoodTrend(history: Mood[]): string | null {
  if (history.length < 3) return null;
  const recent = history.slice(-5);
  const lowCount = recent.filter(m => m === 'low' || m === 'sad').length;
  const highCount = recent.filter(m => m === 'happy' || m === 'excited').length;

  if (lowCount >= 3) return 'consistently_low';
  if (highCount >= 4) return 'consistently_positive';
  if (lowCount >= 2 && recent[recent.length - 1] !== 'low') return 'recovering';
  if (recent[recent.length - 1] === 'excited' && recent[recent.length - 2] === 'sad') return 'upswing';
  return null;
}

export function getMoodLabel(mood: Mood): string {
  const labels: Record<Mood, string> = {
    sad: 'Feeling down',
    low: 'Low energy',
    neutral: 'Neutral',
    calm: 'Calm',
    happy: 'Happy',
    excited: 'Energised',
  };
  return labels[mood];
}