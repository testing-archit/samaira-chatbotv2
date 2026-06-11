"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, SendHorizontal, Bot, User, RefreshCw, Check, LogOut, Plus, Trash, Users, Menu, X } from 'lucide-react';
import { addProfile, deleteProfile } from './actions';
import { logout } from './login/actions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations: Array<{ toolCallId: string; toolName: string; args: any }>;
}

const suggestions = [
  "Plan for my family 👨‍👩‍👧",
  "Why Octaraa over Groww?",
  "SIP vs Lumpsum investing?",
  "FD vs Mutual Fund?",
  "How much term insurance do I need?",
];

const toolLabels: Record<string, string> = {
  search_octaraa_knowledge: '🔍 Searching Octaraa knowledge base...',
  search_finance_education: '📚 Searching finance education base...',
  compare_competitor: '⚔️ Comparing platforms...',
  request_profiling_consent: '🔐 Securing your consent...',
  get_profile: '👤 Reading your profile...',
  update_profile: '📝 Updating your profile...',
  generate_strategy: '📊 Generating your financial strategy...',
  financial_calculator: '🧮 Calculating the numbers...',
};

const toolLabelsDone: Record<string, string> = {
  search_octaraa_knowledge: '✓ Searched Octaraa knowledge base',
  search_finance_education: '✓ Searched finance education base',
  compare_competitor: '✓ Analyzed competitor',
  request_profiling_consent: '✓ Secured consent',
  get_profile: '✓ Read your profile',
  update_profile: '✓ Updated your profile',
  generate_strategy: '✓ Generated personalized strategy',
  financial_calculator: '✓ Calculated mathematically',
};

// ─── Chat Instance Component (one per profile) ───
function ChatInstance({ profile, user, isActive, onMenuClick }: { profile: any, user: any, isActive: boolean, onMenuClick: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isActive]);

  useEffect(() => {
    const { sessionId } = getProfileSessionId();
    fetch(`/api/messages?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          // If we are currently fetching the stream for this profile, keep the dummy message
          setMessages(prev => {
            const aiMsg = prev.find(m => m.id.startsWith('msg_') && m.role === 'assistant' && !m.content);
            if (isLoading && aiMsg && !data.messages.some((m: any) => m.id === aiMsg.id)) {
              return [...data.messages, aiMsg];
            }
            return data.messages;
          });
        } else {
          setMessages(prev => {
            const aiMsg = prev.find(m => m.id.startsWith('msg_') && m.role === 'assistant' && !m.content);
            if (isLoading && aiMsg) return [aiMsg];
            return [];
          });
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, profile.id]);

  const getProfileSessionId = () => {
    if (typeof window === 'undefined') return { userId: 'ssr', sessionId: 'ssr' };
    const userId = user?.id || 'unknown';
    const sessionId = profile.id; // Deterministic session ID
    return { userId, sessionId };
  };

  const handleReset = async () => {
    // Optionally delete messages from DB or just clear local state
    setMessages([]);
    setInput('');
  };

  const append = useCallback(async (message: Message) => {
    const { userId, sessionId } = getProfileSessionId();
    const newMessages = [...messages, message];
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.statusText}`);
      }

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
      setTimeout(() => {
        if (isActive) inputRef.current?.focus();
      }, 100);
    }
  }, [messages, profile, user, isActive]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage: Message = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: input.trim(),
      toolInvocations: [],
    };
    setInput('');
    append(userMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="chat-container" style={{ display: isActive ? 'flex' : 'none' }}>
      <div className="header">
        <div className="header-title-row">
          <button className="mobile-menu-btn" onClick={onMenuClick}>
            <Menu size={20} />
          </button>
          <div className="header-avatar">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1>Samaira for {profile.name}</h1>
            <p>Your Family Wealth Assistant by Octaraa</p>
          </div>
          <button
            onClick={handleReset}
            className="reset-btn"
            title="Start a new conversation"
            aria-label="Reset conversation"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="messages">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <div className="welcome-icon">
              <Bot size={48} />
            </div>
            <h2>Welcome to Octaraa</h2>
            <p>How can I help {profile.name} secure their financial future today?</p>
            <div className="suggestions">
              {suggestions.map((text, i) => (
                <button
                  key={i}
                  className="suggestion-btn"
                  onClick={() =>
                    append({
                      id: 'msg_' + Math.random().toString(36).substring(2, 9),
                      role: 'user',
                      content: text,
                      toolInvocations: [],
                    })
                  }
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`message-wrapper ${m.role === 'user' ? 'user' : 'ai'}`}
            >
              <div className="message-label">
                {m.role === 'user' ? (
                  <User size={14} />
                ) : (
                  <Bot size={14} className="accent-icon" />
                )}
                <span>{m.role === 'user' ? 'You' : 'Samaira'}</span>
              </div>
              <div className={`message ${m.role === 'user' ? 'user' : 'ai'}`}>
                {m.toolInvocations && m.toolInvocations.length > 0 && (
                  <div className="tool-invocations-list">
                    {m.toolInvocations
                      .filter((tool) => tool.toolName !== 'update_profile' || Object.keys(tool.args || {}).length > 0)
                      .map((tool, idx) => (
                      <div key={idx} className={`tool-invocation ${m.content ? 'done' : ''}`}>
                        {m.content ? (
                          <Check size={13} strokeWidth={3} />
                        ) : (
                          <Loader2 size={13} className="spinning" />
                        )}
                        <span>
                          {m.content 
                            ? (toolLabelsDone[tool?.toolName] || `⚙️ Used ${tool?.toolName || 'tool'}`)
                            : (toolLabels[tool?.toolName] || `⚙️ Running ${tool?.toolName || 'tool'}...`)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {m.content ? (
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  isLoading && m.role === 'assistant' && (!m.toolInvocations || m.toolInvocations.length === 0) ? (
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : !isLoading && m.role === 'assistant' && (
                    <span className="text-secondary">...</span>
                  )
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <form onSubmit={handleSubmit} className="input-form">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about family wealth, FD vs MF, or plan your goals..."
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input?.trim()}
            aria-label="Send message"
          >
            {isLoading ? <Loader2 size={20} className="spinning" /> : <SendHorizontal size={20} />}
          </button>
        </form>
        <p className="input-disclaimer">
          Samaira provides educational insights only, not financial advice.
        </p>
      </div>
    </div>
  );
}

// ─── Main Chat UI (Layout Container) ───
export default function ChatUI({ user, profiles }: { user: any, profiles: any[] }) {
  const [activeProfile, setActiveProfile] = useState(profiles[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState('spouse');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleProfileSwitch = (p: any) => {
    setActiveProfile(p);
    setSidebarOpen(false);
  };

  return (
    <div className="layout-container">
      
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <Users size={20} />
            <h2>Family Tree</h2>
          </div>
        </div>
        
        <div className="sidebar-menu">
          {profiles.map(p => (
            <div 
              key={p.id} 
              onClick={() => handleProfileSwitch(p)}
              className={`profile-item ${activeProfile?.id === p.id ? 'active' : ''}`}
            >
              <div>
                <div className="profile-name">{p.name}</div>
                <div className="profile-relation">{p.relation}</div>
              </div>
              {p.relation !== 'self' && (
                <form action={deleteProfile}>
                  <input type="hidden" name="profileId" value={p.id} />
                  <button type="submit" className="delete-profile-btn">
                    <Trash size={14} />
                  </button>
                </form>
              )}
            </div>
          ))}

          <button 
            onClick={() => setShowAddModal(true)}
            className="add-member-btn"
          >
            <Plus size={16} /> Add Member
          </button>
        </div>

        <div className="sidebar-footer">
          <p>Logged in as</p>
          <span className="user-email">{user.email}</span>
          <form action={logout} className="logout-form">
            <button type="submit" className="logout-btn">
              <LogOut size={12} /> Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main-area">
        {/* Add Profile Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Add Family Member</h3>
              <form action={async (fd) => { await addProfile(fd); setShowAddModal(false); }} className="modal-form">
                <div className="input-group">
                  <label>Name</label>
                  <input name="name" required placeholder="e.g. Rahul" />
                </div>
                <div className="input-group">
                  <label>Relationship</label>
                  <select 
                    name={selectedRelation !== 'custom' ? "relation" : "relation_type"} 
                    required 
                    value={selectedRelation} 
                    onChange={(e) => setSelectedRelation(e.target.value)}
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
                  <div className="input-group">
                    <label>Custom Relationship</label>
                    <input name="relation" required placeholder="e.g. Uncle, Nephew, Friend" autoFocus />
                  </div>
                )}
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Add Profile</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Render a ChatInstance for EVERY profile, but only display the active one */}
        {profiles.map((p) => (
          <ChatInstance 
            key={p.id} 
            profile={p} 
            user={user} 
            isActive={p.id === activeProfile?.id} 
            onMenuClick={() => setSidebarOpen(true)}
          />
        ))}

      </div>
    </div>
  );
}
