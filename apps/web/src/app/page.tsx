'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { ChatArea } from '../components/Chat/ChatArea';
import { listenConversations } from '../lib/syncManager';

export default function Home() {
  const { userId, setConversationId, addConversation, setMessages, conversations } = useAppStore();

  // Subscribe to conversation list from Firestore
  useEffect(() => {
    if (!userId) return;
    const unsub = listenConversations(userId, (convData) => {
      convData.forEach((c) => {
        const exists = conversations.find((e) => e.id === c.id);
        if (!exists) {
          addConversation({
            id: c.id,
            title: c.title || 'Conversation',
            lastMood: c.lastMood,
            updatedAt: c.updatedAt?.seconds ? c.updatedAt.seconds * 1000 : c.updatedAt || Date.now(),
            messageCount: c.messageCount || 0,
          });
        }
      });
    });
    return () => unsub();
  }, [userId]);

  const handleSelectConversation = (id: string) => {
    setConversationId(id);
    setMessages([]);
  };

  const handleNewConversation = () => {
    setConversationId('default');
    setMessages([]);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: '#0d0d10',
      }}
    >
      <Sidebar
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
      <ChatArea />
    </div>
  );
}