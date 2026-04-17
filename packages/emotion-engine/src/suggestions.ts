import type { Mood } from './detector';

export interface SuggestionContext {
  mood: Mood;
  moodTrend: string | null;
  hour: number;
  dayOfWeek: number;
  recentMoods: Mood[];
  messageCount?: number;
}

export interface Suggestion {
  text: string;
  type: 'rest' | 'social' | 'health' | 'productivity' | 'mindfulness' | 'creative';
  urgency: 'gentle' | 'moderate';
  icon: string;
}

const SUGGESTION_BANK: Record<string, Suggestion[]> = {
  consistently_low: [
    { text: "A short walk outside — even 10 minutes — can shift the weight.", type: 'health', urgency: 'moderate', icon: '🚶' },
    { text: "Sometimes a small change of scenery is enough to reset.", type: 'rest', urgency: 'gentle', icon: '🌿' },
    { text: "Have you had water and something to eat today?", type: 'health', urgency: 'gentle', icon: '💧' },
  ],
  morning_low: [
    { text: "A glass of water and 5 minutes of sunlight can help the morning feel less heavy.", type: 'mindfulness', urgency: 'gentle', icon: '☀️' },
    { text: "No pressure to be productive yet. A slow start is still a start.", type: 'rest', urgency: 'gentle', icon: '🌅' },
  ],
  afternoon_low: [
    { text: "The afternoon dip is real. A 10-minute break away from screens tends to reset focus.", type: 'rest', urgency: 'gentle', icon: '🌤️' },
    { text: "Step outside for a few minutes. Fresh air helps more than coffee.", type: 'health', urgency: 'gentle', icon: '🌬️' },
  ],
  evening_low: [
    { text: "Evening is a good time to wind down — screen light off early can help tomorrow feel lighter.", type: 'rest', urgency: 'gentle', icon: '🌙' },
  ],
  excited: [
    { text: "Your energy is high — good moment to work on something you've been putting off.", type: 'productivity', urgency: 'gentle', icon: '⚡' },
    { text: "Write down whatever's got you energised before the feeling fades.", type: 'creative', urgency: 'gentle', icon: '✍️' },
  ],
  sad_weekend: [
    { text: "Sometimes reaching out to someone you trust helps more than staying alone with the thoughts.", type: 'social', urgency: 'gentle', icon: '💬' },
  ],
  sad_general: [
    { text: "You don't have to fix anything right now. Just being here is enough.", type: 'mindfulness', urgency: 'gentle', icon: '🌊' },
    { text: "Sometimes the kindest thing is to rest without judgment.", type: 'rest', urgency: 'gentle', icon: '🛋️' },
  ],
  calm: [
    { text: "This is a good state to be in. Ride it — do something creative.", type: 'creative', urgency: 'gentle', icon: '🎨' },
  ],
  happy: [
    { text: "Good energy today. Use some of it for something that matters to you.", type: 'productivity', urgency: 'gentle', icon: '🌱' },
  ],
  recovering: [
    { text: "Something shifted — notice that. Small steps are still forward.", type: 'mindfulness', urgency: 'gentle', icon: '🌤️' },
  ],
};

export function getSuggestion(ctx: SuggestionContext): Suggestion | null {
  const { mood, moodTrend, hour, dayOfWeek, recentMoods } = ctx;

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isMorning = hour >= 6 && hour <= 10;
  const isAfternoon = hour >= 13 && hour <= 17;
  const isEvening = hour >= 19 && hour <= 23;

  // Priority: trend-based first
  if (moodTrend === 'consistently_low') {
    return getRandom(SUGGESTION_BANK.consistently_low);
  }

  if (moodTrend === 'recovering') {
    return getRandom(SUGGESTION_BANK.recovering);
  }

  // Mood + time combinations
  if (mood === 'low' || mood === 'sad') {
    if (isMorning) return getRandom(SUGGESTION_BANK.morning_low);
    if (isAfternoon) return getRandom(SUGGESTION_BANK.afternoon_low);
    if (isEvening) return getRandom(SUGGESTION_BANK.evening_low);
    if (isWeekend && mood === 'sad') return getRandom(SUGGESTION_BANK.sad_weekend);
    if (mood === 'sad') return getRandom(SUGGESTION_BANK.sad_general);
  }

  if (mood === 'excited') return getRandom(SUGGESTION_BANK.excited);
  if (mood === 'calm') return getRandom(SUGGESTION_BANK.calm);
  if (mood === 'happy') return getRandom(SUGGESTION_BANK.happy);

  return null;
}

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getFollowUpPrompts(mood: Mood): string[] {
  const prompts: Record<Mood, string[]> = {
    sad: ["Tell me more about that", "When did this start?", "Is there someone you can reach out to?"],
    low: ["What would help right now?", "Did something happen?", "What's the heaviest part today?"],
    neutral: ["How's the rest of your day going?", "Anything on your mind?", "What are you working on?"],
    calm: ["What's keeping you calm today?", "Anything you want to think through?", "How long have you felt this way?"],
    happy: ["What made today good?", "Tell me more!", "How can we make tomorrow just as good?"],
    excited: ["What's got you energised?", "What are you going to do with that energy?", "Tell me everything!"],
  };
  return prompts[mood] || prompts.neutral;
}