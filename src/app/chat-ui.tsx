"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from '../components/layout/Sidebar';
import RightRail from '../components/layout/RightRail';
import ChatPanel from '../components/chat/ChatPanel';
import { addProfile } from './actions';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: Array<{ toolCallId: string; toolName: string; args: any }>;
}

function ChatInstanceWrapper({ profile, user, isActive, onMenuOpen }: { profile: any, user: any, isActive: boolean, onMenuOpen: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    const { sessionId } = getProfileSessionId();
    fetch(`/api/messages?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          setMessages(prev => {
            const aiMsg = prev.find(m => m.id.startsWith('msg_') && m.role === 'assistant' && !m.content);
            if (isLoading && aiMsg && !data.messages.some((m: any) => m.id === aiMsg.id)) {
              return [...data.messages, aiMsg];
            }
            return data.messages;
          });
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, profile.id]);

  const getProfileSessionId = () => {
    if (typeof window === 'undefined') return { userId: 'ssr', sessionId: 'ssr' };
    const userId = user?.id || 'unknown';
    const sessionId = profile.id;
    return { userId, sessionId };
  };

  const append = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const { userId, sessionId } = getProfileSessionId();
    
    const userMessage: Message = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: text,
      toolInvocations: [],
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    const aiMessageId = 'msg_' + Math.random().toString(36).substring(2, 9);
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      toolInvocations: [],
    };

    setMessages((prev) => [...prev, aiMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          user_id: user.id,
          profile_id: profile.id,
          profile_name: profile.name,
          profile_relation: profile.relation,
          session_id: sessionId,
        }),
      });

      if (!response.ok) throw new Error(await response.text() || `Error: ${response.statusText}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));

                if (data.type === 'tool_call') {
                  setMessages((prev) => {
                    const index = prev.findIndex(m => m.id === aiMessageId);
                    if (index === -1) return prev;
                    const newArr = [...prev];
                    const last = { ...newArr[index] };
                    const currentInvocations = last.toolInvocations || [];
                    const alreadyExists = currentInvocations.some(
                      (t: any) => t?.toolCallId === data.data?.toolCallId
                    );
                    if (!alreadyExists) {
                      last.toolInvocations = [...currentInvocations, data.data];
                      newArr[index] = last;
                    }
                    return newArr;
                  });
                } else if (data.type === 'text') {
                  setMessages((prev) => {
                    const index = prev.findIndex(m => m.id === aiMessageId);
                    if (index === -1) return prev;
                    const newArr = [...prev];
                    const last = { ...newArr[index] };
                    last.content = last.content + data.data;
                    newArr[index] = last;
                    return newArr;
                  });
                }
              } catch (e) {
                console.error('Error parsing SSE data', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => {
        const newArr = [...prev];
        newArr[newArr.length - 1] = {
          id: aiMessageId,
          role: 'assistant',
          content: '⚠️ Sorry, I encountered an error. Please try again.',
          toolInvocations: [],
        };
        return newArr;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, profile, user, isLoading]);

  if (!isActive) return null;

  return (
    <ChatPanel 
      messages={messages} 
      isStreaming={isLoading} 
      onSend={append} 
      onMenuOpen={onMenuOpen}
      profile={profile}
    />
  );
}

export default function ChatUI({ user, profiles }: { user: any, profiles: any[] }) {
  const [activeProfile, setActiveProfile] = useState(profiles[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState('spouse');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const profileName = params.get('profile');
      if (profileName) {
        const p = profiles.find(x => x.name.toLowerCase() === profileName.toLowerCase());
        if (p) setActiveProfile(p);
      }
    }
  }, [profiles]);

  const handleProfileSwitch = (p: any) => {
    setActiveProfile(p);
    setSidebarOpen(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('profile', p.name.toLowerCase());
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <div style={{
      display: "flex",
      height: "100dvh",
      background: "var(--bg-page)",
      overflow: "hidden",
    }}>
      {/* Desktop sidebar */}
      <div style={{ display: "var(--sidebar-display, flex)" }} className="sidebar-desktop">
        <Sidebar 
          profiles={profiles} 
          activeProfileId={activeProfile?.id} 
          onProfileSwitch={handleProfileSwitch} 
          user={user}
          onAddMember={() => setShowAddModal(true)}
        />
      </div>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(11,61,46,0.4)",
              backdropFilter: "blur(2px)",
            }}
          />
          <div style={{ position: "relative", width: 240, zIndex: 51, height: "100%" }}>
            <Sidebar 
              onMobileClose={() => setSidebarOpen(false)} 
              profiles={profiles} 
              activeProfileId={activeProfile?.id} 
              onProfileSwitch={handleProfileSwitch} 
              user={user}
              onAddMember={() => setShowAddModal(true)}
            />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: "flex",
        gap: 12,
        padding: "12px",
        overflow: "hidden",
        minWidth: 0,
      }}>
        {profiles.map(p => (
          <ChatInstanceWrapper 
            key={p.id} 
            profile={p} 
            user={user} 
            isActive={p.id === activeProfile?.id} 
            onMenuOpen={() => setSidebarOpen(true)} 
          />
        ))}

        {/* Right rail */}
        <div className="rail-desktop" style={{ display: "var(--rail-display, flex)" }}>
          <RightRail profile={activeProfile} />
        </div>
      </div>

      {/* Add Profile Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowAddModal(false)} />
          <div style={{
            position: "relative", background: "var(--bg-card)", padding: 24, borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "var(--shadow-float)"
          }}>
            <h3 style={{ marginBottom: 16, fontSize: 18 }}>Add Family Member</h3>
            <form action={async (fd) => { await addProfile(fd); setShowAddModal(false); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Name</label>
                <input name="name" required placeholder="e.g. Rahul" style={{ padding: "8px 12px", border: "1px solid var(--border-mid)", borderRadius: 8, background: "var(--bg-input)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Relationship</label>
                <select 
                  name={selectedRelation !== 'custom' ? "relation" : "relation_type"} 
                  required 
                  value={selectedRelation} 
                  onChange={(e) => setSelectedRelation(e.target.value)}
                  style={{ padding: "8px 12px", border: "1px solid var(--border-mid)", borderRadius: 8, background: "var(--bg-input)" }}
                >
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                  <option value="brother">Brother</option>
                  <option value="sister">Sister</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="custom">Custom...</option>
                </select>
              </div>
              {selectedRelation === 'custom' && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 500 }}>Custom Relationship</label>
                  <input name="relation" required placeholder="e.g. Uncle, Nephew, Friend" autoFocus style={{ padding: "8px 12px", border: "1px solid var(--border-mid)", borderRadius: 8, background: "var(--bg-input)" }} />
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-mid)", background: "transparent", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", borderRadius: 8, background: "var(--brand-leaf)", color: "#fff", border: "none", cursor: "pointer" }}>Add Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Responsive CSS */}
      <style>{`
        .sidebar-desktop { display: flex !important; }
        .rail-desktop     { display: flex !important; }
        @media (max-width: 1023px) {
          .sidebar-desktop { display: none !important; }
        }
        @media (max-width: 860px) {
          .rail-desktop { display: none !important; }
        }
        .sr-only {
          position: absolute; width: 1px; height: 1px;
          padding: 0; margin: -1px; overflow: hidden;
          clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }
      `}</style>
    </div>
  );
}
