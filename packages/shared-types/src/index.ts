import type { Mood } from '../emotion-engine/src/detector';

export type { Mood };

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  mood?: Mood;
  timestamp: number;
  synced?: boolean;
}

export interface MoodEntry {
  date: string; // YYYY-MM-DD
  mood: Mood;
  conversationId?: string;
  timestamp?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  lastMood?: Mood;
}

export interface SuggestionCard {
  text: string;
  type: string;
  urgency: 'gentle' | 'moderate';
  icon: string;
}

export interface ChatAPIResponse {
  reply: string;
  mood: Mood;
  moodConfidence: number;
  suggestion: SuggestionCard | null;
  followUpPrompts: string[];
  language: 'en' | 'te' | 'mixed';
}

export interface AppUser {
  id: string;
  name: string;
  language: 'en' | 'te';
}