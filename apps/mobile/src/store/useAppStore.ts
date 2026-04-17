import { create } from 'zustand';
import type { Mood } from '../../packages/emotion-engine/src/detector';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  mood?: Mood;
  timestamp: number;
  synced?: boolean;
}

export interface MoodEntry {
  date: string;
  mood: Mood;
  conversationId?: string;
}

export interface SuggestionCard {
  text: string;
  type: string;
  urgency: 'gentle' | 'moderate';
  icon: string;
}

interface AppState {
  userId: string;
  userName: string;
  setUser: (id: string, name: string) => void;

  conversationId: string;
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id'>) => Message;
  setMessages: (msgs: Message[]) => void;
  setConversationId: (id: string) => void;

  currentMood: Mood;
  moodHistory: MoodEntry[];
  setMood: (mood: Mood) => void;
  addMoodEntry: (entry: MoodEntry) => void;
  setMoodHistory: (history: MoodEntry[]) => void;

  isThinking: boolean;
  setIsThinking: (val: boolean) => void;
  currentSuggestion: SuggestionCard | null;
  setCurrentSuggestion: (s: SuggestionCard | null) => void;
  followUpPrompts: string[];
  setFollowUpPrompts: (prompts: string[]) => void;

  isSynced: boolean;
  isOnline: boolean;
  setSyncState: (synced: boolean, online: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  userId: 'user_default',
  userName: 'You',
  setUser: (id, name) => set({ userId: id, userName: name }),

  conversationId: 'default',
  messages: [],
  addMessage: (msg) => {
    const newMsg: Message = {
      ...msg,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    set((s) => ({ messages: [...s.messages, newMsg] }));
    return newMsg;
  },
  setMessages: (messages) => set({ messages }),
  setConversationId: (id) => set({ conversationId: id }),

  currentMood: 'neutral',
  moodHistory: [],
  setMood: (mood) => set({ currentMood: mood }),
  addMoodEntry: (entry) =>
    set((s) => ({
      moodHistory: [entry, ...s.moodHistory.filter((e) => e.date !== entry.date)].slice(0, 30),
    })),
  setMoodHistory: (history) => set({ moodHistory: history }),

  isThinking: false,
  setIsThinking: (val) => set({ isThinking: val }),
  currentSuggestion: null,
  setCurrentSuggestion: (s) => set({ currentSuggestion: s }),
  followUpPrompts: [],
  setFollowUpPrompts: (prompts) => set({ followUpPrompts: prompts }),

  isSynced: false,
  isOnline: true,
  setSyncState: (isSynced, isOnline) => set({ isSynced, isOnline }),
}));