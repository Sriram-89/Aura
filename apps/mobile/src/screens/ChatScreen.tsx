import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  StatusBar,
  Keyboard,
  ListRenderItem,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAppStore } from '../store/useAppStore';
import { detectMood, MOOD_COLORS, getMoodLabel, MOOD_GRADIENTS } from '@emotion/detector';
import {
  listenMessages,
  listenMoodHistory,
  saveMessage,
  saveMoodEntry,
  saveConversationMeta,
  flushOfflineQueue,
} from '../lib/syncManager';
import { Orb } from '../components/Orb';
import { SuggestionCards } from '../components/SuggestionCards';
import type { Mood } from '../../../packages/emotion-engine/src/detector';
import type { Message } from '../store/useAppStore';

const MOOD_COLORS: Record<Mood, string> = {
  sad: '#7b9fd4',
  low: '#8b8fc4',
  neutral: '#7ab8c4',
  calm: '#5ecfa8',
  happy: '#8fc47a',
  excited: '#c47a8f',
};

const MOOD_LABELS: Record<Mood, string> = {
  sad: 'Feeling down',
  low: 'Low energy',
  neutral: 'Neutral',
  calm: 'Calm',
  happy: 'Happy',
  excited: 'Energised',
};

const STARTERS = [
  "I'm feeling anxious today",
  "Something's been on my mind",
  "I just need to vent",
  "I'm having a good day",
  "I feel stuck",
];

export default function ChatScreen() {
  const {
    userId,
    conversationId,
    setConversationId,
    messages,
    addMessage,
    setMessages,
    currentMood,
    setMood,
    addMoodEntry,
    setMoodHistory,
    isThinking,
    setIsThinking,
    currentSuggestion,
    setCurrentSuggestion,
    followUpPrompts,
    setFollowUpPrompts,
    setSyncState,
  } = useAppStore();

  const [inputText, setInputText] = useState('');
  const [liveMood, setLiveMood] = useState<Mood | null>(null);
  const flatRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const moodColor = MOOD_COLORS[currentMood];

  // ── Connectivity watcher ───────────────────────────────────────────────
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected;
      setSyncState(online, online);
      if (online) flushOfflineQueue(userId);
    });
    return () => unsub();
  }, [userId]);

  // ── Mood history listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const unsub = listenMoodHistory(userId, (history) => {
      setMoodHistory(
        history.map((h) => ({ date: h.id, mood: h.mood, conversationId: h.conversationId }))
      );
    });
    return () => unsub();
  }, [userId]);

  // ── Message listener for current conversation ─────────────────────────
  useEffect(() => {
    if (!userId || conversationId === 'default') return;
    const unsub = listenMessages(userId, conversationId, (msgs) => {
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text,
          mood: m.mood,
          timestamp: m.clientTimestamp || Date.now(),
          synced: true,
        }))
      );
    });
    return () => unsub();
  }, [userId, conversationId]);

  // ── Handle input change ────────────────────────────────────────────────
  const handleInputChange = (text: string) => {
    setInputText(text);
    if (text.length > 8) {
      const result = detectMood(text);
      if (result.confidence > 0.35) setLiveMood(result.mood);
      else setLiveMood(null);
    } else {
      setLiveMood(null);
    }
  };

  // ── Send message ───────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? inputText).trim();
      if (!text || isThinking) return;

      Keyboard.dismiss();
      setInputText('');
      setLiveMood(null);

      // Detect mood
      const moodResult = detectMood(text);
      setMood(moodResult.mood);

      // Ensure conversation
      let convId = conversationId;
      if (convId === 'default') {
        convId = `conv_${Date.now()}`;
        setConversationId(convId);
        const title = text.length > 45 ? text.slice(0, 42) + '…' : text;
        await saveConversationMeta(userId, convId, {
          title,
          lastMood: moodResult.mood,
          updatedAt: Date.now(),
        });
      }

      // Add user message locally
      const userMsg = addMessage({
        role: 'user',
        text,
        mood: moodResult.mood,
        timestamp: Date.now(),
      });

      // Sync
      await saveMessage(userId, convId, {
        id: userMsg.id,
        role: 'user',
        text,
        mood: moodResult.mood,
        timestamp: userMsg.timestamp,
      });

      // Save mood
      const today = new Date().toISOString().split('T')[0];
      addMoodEntry({ date: today, mood: moodResult.mood, conversationId: convId });
      await saveMoodEntry(userId, moodResult.mood, convId);

      // Call API
      setIsThinking(true);
      setCurrentSuggestion(null);
      setFollowUpPrompts([]);

      try {
        const recentMoods = messages
          .filter((m) => m.mood)
          .slice(-6)
          .map((m) => m.mood);

        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.text })),
              { role: 'user', content: text },
            ],
            userId,
            conversationId: convId,
            recentMoods,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API error');

        const aiMsg = addMessage({
          role: 'assistant',
          text: data.reply,
          mood: data.mood,
          timestamp: Date.now(),
        });

        await saveMessage(userId, convId, {
          id: aiMsg.id,
          role: 'assistant',
          text: data.reply,
          mood: data.mood,
          timestamp: aiMsg.timestamp,
        });

        if (data.suggestion) setCurrentSuggestion(data.suggestion);
        if (data.followUpPrompts?.length) setFollowUpPrompts(data.followUpPrompts);
      } catch (err) {
        console.error('Chat error:', err);
        addMessage({
          role: 'assistant',
          text: "Something went wrong — I couldn't connect. Try again in a moment.",
          timestamp: Date.now(),
        });
      } finally {
        setIsThinking(false);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [inputText, isThinking, messages, conversationId, userId]
  );

  const renderMessage: ListRenderItem<Message> = ({ item }) => {
    const isUser = item.role === 'user';
    const msgMoodColor = item.mood ? MOOD_COLORS[item.mood] : MOOD_COLORS.neutral;

    return (
      <View style={[styles.msgRow, isUser ? styles.userRow : styles.aiRow]}>
        {/* Avatar */}
        {!isUser && (
          <View
            style={[
              styles.avatar,
              { backgroundColor: msgMoodColor, shadowColor: msgMoodColor },
            ]}
          />
        )}

        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text style={styles.msgText}>{item.text}</Text>
        </View>

        {isUser && (
          <View style={[styles.avatar, styles.userAvatar]} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Orb mood={currentMood} size={38} isThinking={isThinking} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>Aura</Text>
            <View style={styles.moodBadge}>
              <View style={[styles.moodDot, { backgroundColor: moodColor }]} />
              <Text style={[styles.moodLabel, { color: moodColor }]}>
                {MOOD_LABELS[currentMood]}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.syncBadge}>
          <Text style={styles.syncText}>Mobile</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.welcomeContainer,
          ]}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.welcome}>
              <Orb mood={currentMood} size={80} />
              <Text style={styles.welcomeTitle}>Hello, I'm Aura.</Text>
              <Text style={styles.welcomeSubtitle}>
                Your AI companion — always here. How are you feeling today?
              </Text>
              <View style={styles.starters}>
                {STARTERS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => handleSend(s)}
                    style={styles.starterChip}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.starterText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          ListFooterComponent={
            isThinking ? (
              <View style={styles.typingWrap}>
                <View
                  style={[
                    styles.typingAvatar,
                    { backgroundColor: moodColor, shadowColor: moodColor },
                  ]}
                />
                <View style={styles.typingBubble}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={styles.typingDot} />
                  ))}
                </View>
              </View>
            ) : null
          }
          renderItem={renderMessage}
        />

        {/* Suggestions */}
        {messages.length > 0 && (
          <SuggestionCards
            suggestion={currentSuggestion}
            followUpPrompts={followUpPrompts}
            currentMood={currentMood}
            onSendPrompt={handleSend}
          />
        )}

        {/* Input */}
        <View style={styles.inputArea}>
          {/* Live mood */}
          {liveMood && (
            <View style={styles.liveMoodRow}>
              <View
                style={[styles.liveDot, { backgroundColor: MOOD_COLORS[liveMood] }]}
              />
              <Text style={[styles.liveMoodText, { color: MOOD_COLORS[liveMood] }]}>
                sensing {liveMood}
              </Text>
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={handleInputChange}
              placeholder="Share what's on your mind…"
              placeholderTextColor="#2e2d35"
              multiline
              maxLength={3000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim() ? '#c8a97e' : '#1a1a1f' },
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isThinking}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.sendBtnText,
                  { color: inputText.trim() ? '#1a1208' : '#3a3840' },
                ]}
              >
                →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#0a0a0f',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerInfo: { gap: 2 },
  headerName: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 17,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#f0ede8',
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  moodDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  syncBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  syncText: {
    fontSize: 11,
    color: '#2e2d35',
  },

  // Messages
  messageList: {
    padding: 16,
    paddingBottom: 10,
    flexGrow: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  welcome: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 20,
  },
  welcomeTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 27,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#f0ede8',
    marginTop: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#3a3840',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 21,
  },
  starters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  starterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  starterText: {
    fontSize: 13,
    color: '#3a3840',
  },

  // Message bubbles
  msgRow: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
  },
  aiRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    flexShrink: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  userAvatar: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 14,
  },
  aiBubble: {
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomRightRadius: 4,
  },
  msgText: {
    color: '#d8d4cd',
    fontSize: 14.5,
    lineHeight: 22,
    fontFamily: 'System',
  },

  // Typing
  typingWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
    marginBottom: 14,
  },
  typingAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    gap: 4,
    padding: 12,
    backgroundColor: '#141417',
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  typingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2e2d35',
  },

  // Input
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0f',
    gap: 8,
  },
  liveMoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  liveMoodText: {
    fontSize: 11,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#d8d4cd',
    fontSize: 14.5,
    backgroundColor: '#141417',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    fontFamily: 'System',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnText: {
    fontSize: 18,
    fontWeight: '400',
  },
});