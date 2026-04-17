import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

const OFFLINE_QUEUE_KEY = 'aura_offline_queue';

interface QueuedMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  text: string;
  mood?: string;
  timestamp: number;
  conversationId: string;
}
export function initSync() {
  console.log("Sync disabled temporarily");
  return;
}

export async function saveMessage(
  userId: string,
  conversationId: string,
  message: {
    id?: string;
    role: 'user' | 'assistant';
    text: string;
    mood?: string;
    timestamp: number;
  }
): Promise<string> {
  const msgId = message.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ref = doc(db, `users/${userId}/conversations/${conversationId}/messages/${msgId}`);

  try {
    await setDoc(ref, {
      role: message.role,
      text: message.text,
      mood: message.mood || null,
      timestamp: serverTimestamp(),
      clientTimestamp: message.timestamp,
      synced: true,
    });
    return msgId;
  } catch {
    await queueOfflineMessage({ id: msgId, userId, conversationId, ...message });
    return msgId;
  }
}

export function listenMessages(
  userId: string,
  conversationId: string,
  onUpdate: (messages: DocumentData[]) => void
): () => void {
  const q = query(
    collection(db, `users/${userId}/conversations/${conversationId}/messages`),
    orderBy('clientTimestamp', 'asc'),
    limit(200)
  );

  return onSnapshot(
    q,
    (snap) => onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => console.error('Mobile sync error:', err)
  );
}

export async function saveMoodEntry(
  userId: string,
  mood: string,
  conversationId: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const ref = doc(db, `users/${userId}/moodHistory/${today}`);
  await setDoc(ref, { mood, conversationId, timestamp: serverTimestamp() }, { merge: true });
}

export function listenMoodHistory(
  userId: string,
  onUpdate: (history: DocumentData[]) => void
): () => void {
  const q = query(
    collection(db, `users/${userId}/moodHistory`),
    orderBy('__name__', 'desc'),
    limit(30)
  );
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function saveConversationMeta(
  userId: string,
  conversationId: string,
  meta: { title: string; lastMood?: string; updatedAt: number }
): Promise<void> {
  const ref = doc(db, `users/${userId}/conversations/${conversationId}`);
  await setDoc(ref, { ...meta, updatedAt: serverTimestamp() }, { merge: true });
}

// ✅ SIMPLE WEB STORAGE
async function queueOfflineMessage(msg: QueuedMessage): Promise<void> {
  const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
  const queue: QueuedMessage[] = raw ? JSON.parse(raw) : [];
  queue.push(msg);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function flushOfflineQueue(userId: string): Promise<void> {
  const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) return;

  const queue: QueuedMessage[] = JSON.parse(raw);

  const batch = writeBatch(db);

  for (const msg of queue) {
    const ref = doc(
      db,
      `users/${userId}/conversations/${msg.conversationId}/messages/${msg.id}`
    );

    batch.set(ref, {
      role: msg.role,
      text: msg.text,
      mood: msg.mood || null,
      timestamp: serverTimestamp(),
      clientTimestamp: msg.timestamp,
      synced: true,
    });
  }

  await batch.commit();
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}
export function listenConversations(userId: string, callback: any) {
  console.log("Listening conversations (mock)");
  return () => {};
}

export function setupConnectivityWatcher(
  userId: string,
  onOnline: () => void,
  onOffline: () => void
) {
  function handleOnline() {
    console.log("Online");
    onOnline();
  }

  function handleOffline() {
    console.log("Offline");
    onOffline();
  }

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}