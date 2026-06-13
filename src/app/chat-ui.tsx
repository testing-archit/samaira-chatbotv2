"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Loader2, SendHorizontal, Bot, User, RefreshCw, Check, LogOut, Plus, Trash, Users, Menu, X, ThumbsUp, ThumbsDown, Flag, Star } from 'lucide-react';
import { addProfile, deleteProfile } from './actions';
import { logout } from './login/actions';

import MarkdownRenderer from './markdown-renderer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: Array<{ toolCallId: string; toolName: string; args: any }>;
  created_at?: string;
  feedbackRating?: number;
  feedbackText?: string | null;
  requiresDisclaimer?: boolean;
}

const suggestions = [
  { label: "FD vs mutual fund", prompt: "Explain FD vs mutual fund for a young family" },
  { label: "What is the family tree?", prompt: "What is the Family Tree feature?" },
  { label: "Plan my family goals", prompt: "Help me plan for my family's financial goals" },
  { label: "Octaraa vs Groww", prompt: "How does Octaraa compare to Groww for family wealth?" },
  { label: "Retirement planning", prompt: "How much should I save for retirement?" }
];

const getToolLabel = (tool: any) => {
  if (tool?.toolName === 'compare_competitor' && tool?.args?.competitor) {
    return `⚔️ Comparing against ${tool.args.competitor}...`;
  }
  if (tool?.toolName === 'search_finance_education' && tool?.args?.query) {
    return `📚 Searching: "${tool.args.query}"...`;
  }
  if (tool?.toolName === 'search_octaraa_knowledge' && tool?.args?.query) {
    return `🔍 Searching Octaraa: "${tool.args.query}"...`;
  }
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
  return toolLabels[tool?.toolName] || `⚙️ Running ${tool?.toolName || 'tool'}...`;
};

const getToolLabelDone = (tool: any) => {
  if (tool?.toolName === 'compare_competitor' && tool?.args?.competitor) {
    return `✓ Compared against ${tool.args.competitor}`;
  }
  if (tool?.toolName === 'search_finance_education' && tool?.args?.query) {
    return `✓ Searched: "${tool.args.query}"`;
  }
  if (tool?.toolName === 'search_octaraa_knowledge' && tool?.args?.query) {
    return `✓ Searched Octaraa: "${tool.args.query}"`;
  }
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
  return toolLabelsDone[tool?.toolName] || `⚙️ Used ${tool?.toolName || 'tool'}`;
};

const REPORT_OPTIONS = [
  "Inaccurate information",
  "Unhelpful or irrelevant",
  "Inappropriate content",
  "Other"
];

const POSITIVE_TAGS = [
  "Accurate",
  "Helpful",
  "Fast",
  "Friendly",
  "Easy to understand"
];

function MessageFeedback({ messageId, initialRating, initialText }: { messageId: string, initialRating?: number, initialText?: string | null }) {
  const [rating, setRating] = useState(initialRating || 0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  
  const [showPositiveModal, setShowPositiveModal] = useState(false);
  const [positiveRating, setPositiveRating] = useState<number>(5);
  const [selectedPositiveTags, setSelectedPositiveTags] = useState<string[]>([]);
  
  const [customText, setCustomText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setRating(initialRating || 0);
  }, [initialRating, initialText]);

  const submitFeedback = async (newRating: number, fullText: string) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/messages/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating: newRating, text: fullText })
      });
      setRating(newRating);
      if (newRating > 0) {
        setSuccessMessage("Thanks for the feedback!");
      } else if (newRating === -1) {
        setSuccessMessage("Thanks for the feedback, we will investigate this.");
      }
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (e) { console.error(e); } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbsUp = () => {
    if (rating > 0) return; // Already gave positive feedback
    setShowPositiveModal(true);
  };

  const openReportModal = () => {
    if (rating === -1) return; // Already reported
    setShowReportModal(true);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalReason = selectedReason;
    if (selectedReason === 'Other' && customText) {
      finalReason = `Other: ${customText}`;
    } else if (customText) {
      finalReason = selectedReason ? `${selectedReason}. ${customText}` : customText;
    }
    submitFeedback(-1, finalReason);
    setShowReportModal(false);
    setCustomText('');
  };

  const handlePositiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalReason = selectedPositiveTags.length > 0 ? `Liked: ${selectedPositiveTags.join(', ')}` : '';
    if (customText) {
      finalReason = finalReason ? `${finalReason}. ${customText}` : customText;
    }
    submitFeedback(positiveRating, finalReason);
    setShowPositiveModal(false);
    setCustomText('');
  };

  return (
    <>
      <div className="message-feedback">
        <div className="feedback-buttons">
          <button 
            onClick={handleThumbsUp} 
            className={`feedback-btn ${rating > 0 ? 'active' : ''}`}
            title="Helpful"
            disabled={isSubmitting || rating > 0}
          >
            <ThumbsUp size={14} />
          </button>
          <button 
            onClick={openReportModal} 
            className={`feedback-btn ${rating === -1 ? 'active-report' : ''}`}
            title="Report an issue"
            disabled={isSubmitting || rating === -1}
          >
            <Flag size={14} />
            {rating === -1 && <span style={{ marginLeft: 4, fontSize: '0.75rem' }}>Reported</span>}
          </button>
        </div>
        {successMessage && (
          <div className="feedback-success-msg" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {successMessage}
          </div>
        )}
      </div>

      {showReportModal && (
        <div className="modal-overlay">
          <div className="modal-content report-modal">
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Report an issue</h3>
              <button type="button" className="close-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setShowReportModal(false)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ marginTop: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              What went wrong? Select a reason or tell us below.
            </p>
            <form onSubmit={handleReportSubmit}>
              <div className="report-options" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {REPORT_OPTIONS.map(opt => (
                  <label key={opt} className="report-radio" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="reportReason" 
                      value={opt} 
                      checked={selectedReason === opt}
                      onChange={(e) => setSelectedReason(e.target.value)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              
              <textarea 
                className="report-textarea" 
                placeholder="Additional details (optional)..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text)', resize: 'vertical' }}
              />

              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowReportModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ backgroundColor: 'var(--error, #ef4444)', borderColor: 'var(--error, #ef4444)' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <><Loader2 size={16} className="spinning" /> Submitting...</> : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPositiveModal && (
        <div className="modal-overlay">
          <div className="modal-content positive-modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Rate this response</h3>
              <button type="button" className="close-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setShowPositiveModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handlePositiveSubmit}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '1.5rem 0' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPositiveRating(star)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: star <= positiveRating ? '#eab308' : 'var(--border)'
                    }}
                  >
                    <Star size={32} fill={star <= positiveRating ? '#eab308' : 'none'} />
                  </button>
                ))}
              </div>

              <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                What did you like? (Optional)
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {POSITIVE_TAGS.map(tag => {
                  const isSelected = selectedPositiveTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPositiveTags(prev => prev.filter(t => t !== tag));
                        } else {
                          setSelectedPositiveTags(prev => [...prev, tag]);
                        }
                      }}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--text-primary)' : 'transparent',
                        color: isSelected ? 'var(--bg-primary)' : 'var(--text-primary)',
                        border: `1px solid ${isSelected ? 'var(--text-primary)' : 'var(--border)'}`,
                        transition: 'all 0.2s'
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              
              <textarea 
                className="report-textarea" 
                placeholder="Tell us more (optional)..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text)', resize: 'vertical' }}
              />

              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowPositiveModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <><Loader2 size={16} className="spinning" /> Submitting...</> : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Generative UI Chart Component ───
function CalculatorChart({ args }: { args: any }) {
  if (!args || !args.type || !args.principal || !args.rate || !args.years) return null;
  const { type, principal, rate, years } = args;

  const data = [];
  const r = (rate / 100);
  
  if (type === 'sip') {
    const monthlyRate = r / 12;
    for (let i = 0; i <= years; i++) {
      const months = i * 12;
      const invested = principal * months;
      const futureValue = monthlyRate > 0 ? principal * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate) : invested;
      data.push({ year: i, Invested: Math.round(invested), Value: Math.round(futureValue) });
    }
  } else if (type === 'lumpsum') {
    for (let i = 0; i <= years; i++) {
      const futureValue = principal * Math.pow(1 + r, i);
      data.push({ year: i, Invested: Math.round(principal), Value: Math.round(futureValue) });
    }
  } else if (type === 'emi') {
    const monthlyRate = r / 12;
    const totalMonths = years * 12;
    const emi = monthlyRate > 0 ? principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1) : principal / totalMonths;
    let balance = principal;
    data.push({ year: 0, Balance: Math.round(balance) });
    for (let i = 1; i <= years; i++) {
      for(let m = 0; m < 12; m++) {
        const interest = balance * monthlyRate;
        const pPayment = emi - interest;
        balance -= pPayment;
      }
      data.push({ year: i, Balance: Math.max(0, Math.round(balance)) });
    }
  }

  return (
    <div style={{ width: '100%', height: 250, marginTop: '1rem', marginBottom: '1rem', background: 'var(--bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        {type === 'sip' ? 'SIP Compounding Curve' : type === 'lumpsum' ? 'Lumpsum Growth' : 'EMI Balance Over Time'}
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="year" stroke="#888" fontSize={12} tickFormatter={(val) => \`Yr \${val}\`} />
          <YAxis stroke="#888" fontSize={12} tickFormatter={(val) => \`₹\${(val/100000).toFixed(1)}L\`} />
          <Tooltip 
            formatter={(value: number) => \`₹\${value.toLocaleString('en-IN')}\`}
            labelFormatter={(label) => \`Year \${label}\`}
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '4px' }}
          />
          {type !== 'emi' && <Line type="monotone" dataKey="Invested" stroke="#64748b" strokeWidth={2} dot={false} />}
          {type !== 'emi' && <Line type="monotone" dataKey="Value" stroke="#3b82f6" strokeWidth={2} dot={false} />}
          {type === 'emi' && <Line type="monotone" dataKey="Balance" stroke="#ef4444" strokeWidth={2} dot={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Chat Instance Component (one per profile) ───
function ChatInstance({ profile, user, isActive, onMenuClick }: { profile: any, user: any, isActive: boolean, onMenuClick: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom only when near the bottom or switching active states
  useEffect(() => {
    if (isActive && !isLoadingMore) {
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom || messages.length <= 20) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      // Only focus if we are not scrolling back up
      inputRef.current?.focus();
    }
  }, [messages, isActive, isLoadingMore]);

  useEffect(() => {
    const { sessionId } = getProfileSessionId();
    fetch(`/api/messages?session_id=${sessionId}&limit=20`)
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          setMessages(prev => {
            const localOnlyMessages = prev.filter(pm => !data.messages.some((dm: any) => dm.id === pm.id));
            return [...data.messages, ...localOnlyMessages];
          });
          setHasMore(data.hasMore);
        } else {
          setHasMore(false);
        }
      })
      .catch(console.error);
  }, [profile.id]);

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;
    
    const oldestMessage = messages[0];
    if (!oldestMessage.created_at) {
      setHasMore(false);
      return;
    }
    
    setIsLoadingMore(true);
    const { sessionId } = getProfileSessionId();
    const beforeParam = encodeURIComponent(oldestMessage.created_at);
    
    try {
      const res = await fetch(`/api/messages?session_id=${sessionId}&limit=20&before=${beforeParam}`);
      const data = await res.json();
      
      if (data.messages && data.messages.length > 0) {
        const container = messagesContainerRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;
        const previousScrollTop = container?.scrollTop || 0;

        setMessages(prev => {
          const newMessages = data.messages.filter((newMsg: any) => 
            !prev.some((existingMsg) => existingMsg.id === newMsg.id)
          );
          return [...newMessages, ...prev];
        });
        setHasMore(data.hasMore);

        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight + previousScrollTop;
          }
        });
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error('Failed to load more messages', e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [messages, hasMore, isLoadingMore]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    // Load more when reaching the top
    if (target.scrollTop <= 10 && hasMore && !isLoadingMore) {
      loadMoreMessages();
    }
  };

  function getProfileSessionId() {
    if (typeof window === 'undefined') return { userId: 'ssr', sessionId: 'ssr' };
    const userId = user?.id || 'unknown';
    const sessionId = profile.id; // Deterministic session ID
    return { userId, sessionId };
  }

  const handleDeleteChat = async () => {
    const { sessionId } = getProfileSessionId();
    setIsDeleting(true);
    
    try {
      await fetch(`/api/messages?session_id=${sessionId}`, { method: 'DELETE' });
      setMessages([]);
      setInput('');
      setShowDeleteModal(false);
    } catch (e) {
      console.error('Failed to clear chat', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const append = useCallback(async (message: Message) => {
    const { userId, sessionId } = getProfileSessionId();
    const newMessages = [...messages, message];
    setMessages(newMessages);
    setIsLoading(true);

    let aiMessageId = 'msg_' + Math.random().toString(36).substring(2, 9);
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

                if (data.type === 'message_id') {
                  const targetId = aiMessageId;
                  setMessages((prev) => {
                    const index = prev.findIndex(m => m.id === targetId);
                    if (index === -1) return prev;
                    const newArr = [...prev];
                    const last = { ...newArr[index] };
                    last.id = data.data;
                    newArr[index] = last;
                    return newArr;
                  });
                  aiMessageId = data.data;
                } else if (data.type === 'requires_disclaimer') {
                  setMessages(prev => {
                    const newArr = [...prev];
                    const last = { ...newArr[newArr.length - 1] };
                    last.requiresDisclaimer = data.data;
                    newArr[newArr.length - 1] = last;
                    return newArr;
                  });
                } else if (data.type === 'tool_call') {
                  const targetId = aiMessageId;
                  setMessages((prev) => {
                    const index = prev.findIndex(m => m.id === targetId);
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
                  const targetId = aiMessageId;
                  setMessages((prev) => {
                    const index = prev.findIndex(m => m.id === targetId);
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
            <h1>Samaira &mdash; for {profile.name} {profile.relation && profile.relation !== 'self' ? `(${profile.relation})` : ''}</h1>
            <p>Your Family Wealth Assistant by Octaraa</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="reset-btn"
            title="Delete conversation"
            aria-label="Delete conversation"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>

      <div className="messages" ref={messagesContainerRef} onScroll={handleScroll}>
        {isLoadingMore && (
          <div className="loading-more" style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', opacity: 0.6 }}>
            <Loader2 size={16} className="spinning" />
          </div>
        )}
        {messages.length === 0 ? (
          <div className="message bot-message">
            <div className="message-avatar">
              <div className="avatar-icon">
                <Image src="/samaira-avatar.png" alt="Samaira" width={28} height={28} priority />
              </div>
            </div>
            <div className="message-content">
              <div className="message-header">
                <strong>Samaira</strong>
              </div>
              <div className="markdown-body">
                <p>Hi! I&apos;m Samaira, your family wealth assistant. What would you like to explore?</p>
              </div>
              
              <div className="quick-reply-chips" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="chip-btn"
                    onClick={() =>
                      append({
                        id: 'msg_' + Math.random().toString(36).substring(2, 9),
                        role: 'user',
                        content: s.prompt,
                        toolInvocations: [],
                      })
                    }
                  >
                    {s.label}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                ))}
              </div>
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
                  <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', marginRight: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                    <Image src="/samaira-avatar.png" alt="Samaira" width={32} height={32} />
                  </div>
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
                            ? getToolLabelDone(tool)
                            : getToolLabel(tool)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {m.content ? (
                  <>
                    <div className="markdown-body">
                      <MarkdownRenderer content={m.content} />
                    </div>
                    {m.toolInvocations?.map((tool: any, idx: number) => {
                      if (tool.toolName === 'financial_calculator') {
                        return <CalculatorChart key={`chart-${idx}`} args={tool.args} />;
                      }
                      return null;
                    })}
                    {m.requiresDisclaimer && (
                      <div className="disclaimer-compact">
                        Educational only, not financial advice &middot; connect@octaraa.com
                      </div>
                    )}
                    {m.role === 'assistant' && (
                      <MessageFeedback messageId={m.id} initialRating={m.feedbackRating} initialText={m.feedbackText} />
                    )}
                  </>
                ) : (
                  isLoading && m.role === 'assistant' && (!m.toolInvocations || m.toolInvocations.length === 0) ? (
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : !isLoading && m.role === 'assistant' && (
                    <span className="text-secondary">...</span>
                  ) || null
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

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Chat History</h3>
            <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to permanently delete all messages for <strong>{profile.name}</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                style={{ backgroundColor: 'var(--error, #ef4444)' }}
                onClick={handleDeleteChat}
                disabled={isDeleting}
              >
                {isDeleting ? <><Loader2 size={16} className="spinning" /> Deleting...</> : 'Delete Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Chat UI (Layout Container) ───
export default function ChatUI({ user, profiles }: { user: any, profiles: any[] }) {
  const [activeProfile, setActiveProfile] = useState(profiles[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState('spouse');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [profileToDelete, setProfileToDelete] = useState<any>(null);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

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
          <div style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Image src="/octaraa-logo.png" alt="Octaraa" width={160} height={50} style={{ objectFit: 'contain' }} priority />
          </div>
          <div className="sidebar-title" style={{ marginTop: '1rem' }}>
            <Users size={20} />
            <h2>Family Tree</h2>
          </div>
        </div>
        
        <div className="sidebar-menu">
          {profiles.map(p => (
            <div 
              key={p.id} 
              className={`profile-item ${activeProfile?.id === p.id ? 'active' : ''} ${p.relation === 'self' ? 'is-self' : ''}`}
              onClick={() => handleProfileSwitch(p)}
            >
              <div className="profile-info">
                <span className="profile-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {p.name}
                  {p.relation === 'self' && (
                    <span className="self-badge">you</span>
                  )}
                </span>
                <span className="profile-relation">{p.relation}</span>
              </div>
              {p.relation !== 'self' && (
                <button 
                  type="button" 
                  className="delete-profile-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileToDelete(p);
                  }}
                >
                  <Trash size={14} />
                </button>
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
              <form action={async (fd) => { 
                if (isSubmittingRef.current) return;
                isSubmittingRef.current = true;
                setIsSubmitting(true);
                try {
                  await addProfile(fd); 
                  setShowAddModal(false); 
                } finally {
                  isSubmittingRef.current = false;
                  setIsSubmitting(false);
                }
              }} className="modal-form">
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
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 size={16} className="spinning" /> Adding...</> : 'Add Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Profile Modal */}
        {profileToDelete && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Delete Family Member</h3>
              <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Are you sure you want to permanently delete <strong>{profileToDelete.name}</strong> from your family tree? Their chat history will also be removed.
              </p>
              <form 
                action={async (fd) => {
                  setIsDeletingProfile(true);
                  try {
                    await deleteProfile(fd);
                    setProfileToDelete(null);
                  } finally {
                    setIsDeletingProfile(false);
                  }
                }} 
                className="modal-form"
              >
                <input type="hidden" name="profileId" value={profileToDelete.id} />
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setProfileToDelete(null)}
                    disabled={isDeletingProfile}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ backgroundColor: 'var(--error, #ef4444)' }}
                    disabled={isDeletingProfile}
                  >
                    {isDeletingProfile ? <><Loader2 size={16} className="spinning" /> Deleting...</> : 'Delete Member'}
                  </button>
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
