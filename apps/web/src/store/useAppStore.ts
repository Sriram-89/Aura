import { create } from 'zustand';


// ✅ SIMPLE Mood type (dependency remove chesam)
export type Mood =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'calm'
  | 'anxious';


// ================= TYPES =================

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

export interface Conversation {
  id: string;
  title: string;
  lastMood?: Mood;
  updatedAt: number;
  messageCount: number;
}

export interface SuggestionCard {
  text: string;
  type: string;
  urgency: 'gentle' | 'moderate';
  icon: string;
}


// ================= STORE =================

interface AppState {
  // User
  userId: string;
  userName: string;
  setUser: (id: string, name: string) => void;

  // Conversations
  conversationId: string;
  conversations: Conversation[];
  setConversationId: (id: string) => void;
  addConversation: (conv: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;

  // Messages
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id'>) => Message;
  setMessages: (msgs: Message[]) => void;

  // Mood
  currentMood: Mood;
  moodHistory: MoodEntry[];
  setMood: (mood: Mood) => void;
  addMoodEntry: (entry: MoodEntry) => void;
  setMoodHistory: (history: MoodEntry[]) => void;

  // UI
  isThinking: boolean;
  setIsThinking: (val: boolean) => void;
  currentSuggestion: SuggestionCard | null;
  setCurrentSuggestion: (s: SuggestionCard | null) => void;
  followUpPrompts: string[];
  setFollowUpPrompts: (prompts: string[]) => void;

  // Sync
  isSynced: boolean;
  isOnline: boolean;
  setSyncState: (synced: boolean, online: boolean) => void;
}


// ================= STORE IMPLEMENTATION =================

export const useAppStore = create<AppState>((set) => ({

  // 👤 User
  userId: 'user_default',
  userName: 'You',
  setUser: (id, name) => set({ userId: id, userName: name }),

  // 💬 Conversations
  conversationId: 'default',
  conversations: [],

  setConversationId: (id) => set({ conversationId: id }),

  addConversation: (conv) =>
    set((s) => ({
      conversations: [conv, ...s.conversations],
    })),

  updateConversation: (id, updates) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  // 📨 Messages
  messages: [],

  addMessage: (msg) => {
    const newMsg: Message = {
      ...msg,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };

    set((s) => ({
      messages: [...s.messages, newMsg],
    }));

    return newMsg;
  },

  setMessages: (messages) => set({ messages }),

  // 🧠 Mood
  currentMood: 'neutral',
  moodHistory: [],

  setMood: (mood) => set({ currentMood: mood }),

  addMoodEntry: (entry) =>
    set((s) => ({
      moodHistory: [
        entry,
        ...s.moodHistory.filter((e) => e.date !== entry.date),
      ].slice(0, 30),
    })),

  setMoodHistory: (history) => set({ moodHistory: history }),

  // 🎨 UI
  isThinking: false,
  setIsThinking: (val) => set({ isThinking: val }),

  currentSuggestion: null,
  setCurrentSuggestion: (s) => set({ currentSuggestion: s }),

  followUpPrompts: [],
  setFollowUpPrompts: (prompts) => set({ followUpPrompts: prompts }),

  // 🌐 Sync
  isSynced: false,
  isOnline: true,
  setSyncState: (isSynced, isOnline) =>
    set({ isSynced, isOnline }),

}));