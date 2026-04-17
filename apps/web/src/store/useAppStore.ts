import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Mood } from "@/lib/mood";

export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  mood?: Mood;
  timestamp: number;
}

interface UiFlags {
  isThinking: boolean;
  isListening: boolean;
}

interface AppState {
  messages: Message[];
  mood: Mood;
  conversationId: string;
  hasStartedConversation: boolean;
  ui: UiFlags;
  addMessage: (message: Omit<Message, "id">) => void;
  setMood: (mood: Mood) => void;
  setConversationId: (conversationId: string) => void;
  setHasStartedConversation: (value: boolean) => void;
  setUiFlag: <K extends keyof UiFlags>(key: K, value: UiFlags[K]) => void;
  resetConversation: () => void;
  hydrateUiDefaults: () => void;
}

const defaultUiFlags: UiFlags = {
  isThinking: false,
  isListening: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      messages: [],
      mood: "neutral",
      conversationId: "default",
      hasStartedConversation: false,
      ui: defaultUiFlags,
      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            },
          ],
        })),
      setMood: (mood) => set({ mood }),
      setConversationId: (conversationId) => set({ conversationId }),
      setHasStartedConversation: (value) => set({ hasStartedConversation: value }),
      setUiFlag: (key, value) =>
        set((state) => ({ ui: { ...state.ui, [key]: value } })),
      resetConversation: () =>
        set({
          messages: [],
          mood: "neutral",
          hasStartedConversation: false,
          ui: defaultUiFlags,
        }),
      hydrateUiDefaults: () => set({ ui: defaultUiFlags }),
    }),
    {
      name: "aura-chat-memory-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        messages: state.messages.slice(-80),
        mood: state.mood,
        conversationId: state.conversationId,
        hasStartedConversation: state.hasStartedConversation,
      }),
    },
  ),
);