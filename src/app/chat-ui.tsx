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
  { label: "📊 Open Calculator Menu", type: 'instant_calc' },
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
const formatCurrency = (val: number) => {
  if (!val || isNaN(val)) return '₹0';
  const formatted = `₹${val.toLocaleString('en-IN')}`;
  let word = '';
  if (val >= 10000000) {
    word = ` (${(val / 10000000).toFixed(2).replace(/\.00$/, '')} Cr)`;
  } else if (val >= 100000) {
    word = ` (${(val / 100000).toFixed(2).replace(/\.00$/, '')} L)`;
  }
  return formatted + word;
};

function CalculatorChart({ args, append }: { args: any, append?: any }) {
  const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
  const initialType = parsedArgs?.type || 'sip';
  const [activeCalc, setActiveCalc] = useState(initialType);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveCalc(parsedArgs?.type || 'sip');
  }, [parsedArgs?.type]);

  const [params, setParams] = useState({
    principal: parsedArgs?.principal || (parsedArgs?.type === 'income_tax' ? 1200000 : parsedArgs?.type === 'cagr' ? 1000000 : 100000),
    rate: parsedArgs?.rate || 12,
    years: parsedArgs?.years || (parsedArgs?.type === 'cagr' ? 5 : 10),
    step_up_rate: parsedArgs?.step_up_rate || 10,
    withdrawal_amount: parsedArgs?.withdrawal_amount || 10000,
    inflation_rate: parsedArgs?.inflation_rate || 6,
    target_amount: parsedArgs?.target_amount || 10000000,
    delay_years: parsedArgs?.delay_years || 3,
    final_amount: parsedArgs?.final_amount || 2000000,
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Set appropriate defaults when switching calculator types from the menu
    if (activeCalc === 'income_tax') {
      setParams(prev => ({
        ...prev,
        principal: prev.principal === 100000 ? 1200000 : prev.principal // 12 Lakhs is a much better default for income tax
      }));
    } else if (activeCalc === 'cagr') {
      setParams(prev => ({
        ...prev,
        principal: prev.principal === 100000 ? 1000000 : prev.principal,
        final_amount: prev.final_amount === 2000000 ? 2500000 : prev.final_amount,
        years: prev.years === 10 ? 5 : prev.years
      }));
    } else if (activeCalc === 'target_sip') {
      setParams(prev => ({
        ...prev,
        target_amount: prev.target_amount || 10000000,
        years: prev.years === 5 ? 10 : prev.years,
        rate: prev.rate || 12
      }));
    } else if (activeCalc === 'cost_of_delay') {
      setParams(prev => ({
        ...prev,
        principal: prev.principal === 100000 || prev.principal === 1200000 ? 10000 : prev.principal, // 10k monthly SIP is a better cost of delay default
        delay_years: prev.delay_years || 3,
        years: prev.years || 10,
        rate: prev.rate || 12
      }));
    } else if (activeCalc === 'retirement') {
      setParams(prev => ({
        ...prev,
        principal: prev.principal === 100000 || prev.principal === 1200000 ? 50000 : prev.principal, // 50k monthly expense
        years: prev.years === 10 ? 25 : prev.years, // 25 years to retirement
        delay_years: prev.delay_years || 20, // 20 years post-retirement
        rate: prev.rate || 12,
        inflation_rate: prev.inflation_rate || 6
      }));
    } else if (activeCalc === 'swp') {
      setParams(prev => ({
        ...prev,
        principal: prev.principal === 100000 || prev.principal === 1200000 ? 10000000 : prev.principal, // 1 Crore corpus
        withdrawal_amount: prev.withdrawal_amount || 60000, // 60k withdrawal
        years: prev.years || 15,
        rate: prev.rate || 8
      }));
    } else if (activeCalc === 'sip' || activeCalc === 'rd') {
      setParams(prev => ({
        ...prev,
        principal: prev.principal === 1000000 || prev.principal === 1200000 ? 10000 : prev.principal // reset to 10k monthly if it was set to a tax/cagr default
      }));
    }
  }, [activeCalc]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!parsedArgs || !parsedArgs.type) return null;

  // We only chart time-series data or render interactive results
  const chartableTypes = ['sip', 'lumpsum', 'emi', 'step_up_sip', 'swp', 'ppf', 'ssy', 'fd', 'rd', 'retirement', 'college_cost', 'target_sip', 'cost_of_delay', 'cagr', 'income_tax', 'menu'];
  if (!chartableTypes.includes(activeCalc)) return null;

  if (activeCalc === 'menu') {
    const calculators = [
      { id: 'sip', name: 'SIP Calculator', icon: '📈', desc: 'Calculate returns on your systematic monthly investments.' },
      { id: 'lumpsum', name: 'Lumpsum', icon: '💰', desc: 'Estimate potential returns on one-time investments.' },
      { id: 'step_up_sip', name: 'Step Up SIP', icon: '🪜', desc: 'Project investment growth with yearly increases.' },
      { id: 'target_sip', name: 'Target Amount SIP', icon: '🎯', desc: 'Determine the monthly SIP amount to hit a goal.' },
      { id: 'emi', name: 'Loan EMI', icon: '🏦', desc: 'Calculate monthly EMI payments for loans.' },
      { id: 'college_cost', name: 'College Cost', icon: '🎓', desc: 'Estimate future education expenses.' },
      { id: 'retirement', name: 'Retirement', icon: '🏖️', desc: 'Plan your retirement corpus and savings.' },
      { id: 'cost_of_delay', name: 'Cost of Delay', icon: '⏳', desc: 'Understand the financial impact of delaying investments.' },
      { id: 'swp', name: 'SWP Calculator', icon: '💸', desc: 'Plan systematic withdrawals from your investments.' },
      { id: 'fd', name: 'Fixed Deposits', icon: '🔒', desc: 'Estimate returns on fixed deposits.' },
      { id: 'rd', name: 'Recurring Deposits', icon: '🔄', desc: 'Calculate growth on recurring deposits.' },
      { id: 'ppf', name: 'PPF Scheme', icon: '🏛️', desc: 'Calculate returns on your Public Provident Fund.' },
      { id: 'ssy', name: 'SSY Scheme', icon: '👧', desc: 'Estimate returns on Sukanya Samriddhi Yojana.' },
      { id: 'cagr', name: 'CAGR Calculator', icon: '📊', desc: 'Calculate the Compound Annual Growth Rate.' },
      { id: 'income_tax', name: 'Income Tax', icon: '⚖️', desc: 'Compare Old vs New tax regime.' },
    ];
    return (
      <div style={{ marginTop: '1rem', marginBottom: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Calculator Menu</h4>
        <div 
          className="calculator-grid" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '1rem'
          }}
        >
          {calculators.map(calc => (
            <button 
              key={calc.id}
              onClick={() => setActiveCalc(calc.id)}
              style={{ 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--border)', 
                padding: '1.2rem', 
                borderRadius: '12px', 
                cursor: 'pointer', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start', 
                gap: '0.6rem', 
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <span style={{ fontSize: '1.8rem' }}>{calc.icon}</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{calc.name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{calc.desc}</span>
            </button>
          ))}
        </div>
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    );
  }

  const handleParamChange = (key: string, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const data = [];
  const r = (params.rate / 100);
  
  if (activeCalc === 'sip' || activeCalc === 'rd') {
    const monthlyRate = r / 12;
    for (let i = 0; i <= params.years; i++) {
      const months = i * 12;
      const invested = params.principal * months;
      const futureValue = monthlyRate > 0 ? params.principal * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate) : invested;
      data.push({ year: i, Invested: Math.round(invested), Value: Math.round(futureValue) });
    }
  } else if (activeCalc === 'step_up_sip') {
    const monthlyRate = r / 12;
    let totalInvested = 0;
    let currentMonthlySIP = params.principal;
    let futureValue = 0;
    data.push({ year: 0, Invested: 0, Value: 0 });
    for (let y = 1; y <= params.years; y++) {
      for (let m = 1; m <= 12; m++) {
        totalInvested += currentMonthlySIP;
        futureValue = (futureValue + currentMonthlySIP) * (1 + monthlyRate);
      }
      currentMonthlySIP += currentMonthlySIP * (params.step_up_rate / 100);
      data.push({ year: y, Invested: Math.round(totalInvested), Value: Math.round(futureValue) });
    }
  } else if (activeCalc === 'lumpsum' || activeCalc === 'fd') {
    for (let i = 0; i <= params.years; i++) {
      const futureValue = params.principal * Math.pow(1 + r, i);
      data.push({ year: i, Invested: Math.round(params.principal), Value: Math.round(futureValue) });
    }
  } else if (activeCalc === 'college_cost') {
    const infRate = params.inflation_rate / 100;
    for (let i = 0; i <= params.years; i++) {
      const futureCost = params.principal * Math.pow(1 + infRate, i);
      data.push({ year: i, Cost: Math.round(futureCost) });
    }
  } else if (activeCalc === 'ppf') {
    const ppfRate = 0.071;
    let balance = 0;
    let invested = 0;
    data.push({ year: 0, Invested: 0, Value: 0 });
    for (let y = 1; y <= Math.min(params.years || 15, 15); y++) {
      invested += params.principal;
      balance = (balance + params.principal) * (1 + ppfRate);
      data.push({ year: y, Invested: Math.round(invested), Value: Math.round(balance) });
    }
  } else if (activeCalc === 'ssy') {
    const ssyRate = 0.082;
    let balance = 0;
    let invested = 0;
    data.push({ year: 0, Invested: 0, Value: 0 });
    for (let y = 1; y <= Math.min(params.years || 21, 21); y++) {
      if (y <= 15) { invested += params.principal; balance += params.principal; }
      balance = balance * (1 + ssyRate);
      data.push({ year: y, Invested: Math.round(invested), Value: Math.round(balance) });
    }
  } else if (activeCalc === 'swp') {
    let balance = params.principal;
    const monthlyRate = r / 12;
    data.push({ year: 0, Balance: Math.round(balance) });
    for (let y = 1; y <= params.years; y++) {
      for (let m = 1; m <= 12; m++) {
        balance = balance * (1 + monthlyRate) - params.withdrawal_amount;
      }
      data.push({ year: y, Balance: Math.max(0, Math.round(balance)) });
      if (balance <= 0) break;
    }
  } else if (activeCalc === 'emi') {
    const monthlyRate = r / 12;
    const totalMonths = params.years * 12;
    const emi = monthlyRate > 0 ? params.principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1) : params.principal / totalMonths;
    let balance = params.principal;
    data.push({ year: 0, Balance: Math.round(balance) });
    for (let i = 1; i <= params.years; i++) {
      for(let m = 0; m < 12; m++) {
        const interest = balance * monthlyRate;
        const pPayment = emi - interest;
        balance -= pPayment;
      }
      data.push({ year: i, Balance: Math.max(0, Math.round(balance)) });
    }
  } else if (activeCalc === 'target_sip') {
    const monthlyRate = r / 12;
    const nMonths = params.years * 12;
    const requiredSip = monthlyRate > 0 ? params.target_amount / (((Math.pow(1 + monthlyRate, nMonths) - 1) / monthlyRate) * (1 + monthlyRate)) : params.target_amount / nMonths;
    for (let i = 0; i <= params.years; i++) {
      const months = i * 12;
      const invested = requiredSip * months;
      const futureValue = monthlyRate > 0 ? requiredSip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate) : invested;
      data.push({ year: i, Invested: Math.round(invested), Value: Math.round(futureValue) });
    }
  } else if (activeCalc === 'cost_of_delay') {
    const monthlyRate = r / 12;
    for (let i = 0; i <= params.years; i++) {
      const months = i * 12;
      const valueNow = monthlyRate > 0 ? params.principal * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate) : params.principal * months;
      
      let valueDelayed = 0;
      if (i > params.delay_years) {
        const activeMonths = (i - params.delay_years) * 12;
        valueDelayed = monthlyRate > 0 ? params.principal * ((Math.pow(1 + monthlyRate, activeMonths) - 1) / monthlyRate) * (1 + monthlyRate) : params.principal * activeMonths;
      }
      data.push({ 
        year: i, 
        "Value (Now)": Math.round(valueNow), 
        "Value (Delayed)": Math.round(valueDelayed) 
      });
    }
  } else if (activeCalc === 'cagr') {
    const cagrVal = params.principal > 0 ? Math.pow(params.final_amount / params.principal, 1 / params.years) - 1 : 0;
    for (let i = 0; i <= params.years; i++) {
      const futureValue = params.principal * Math.pow(1 + cagrVal, i);
      data.push({ year: i, Value: Math.round(futureValue) });
    }
  } else if (activeCalc === 'retirement') {
    const infRate = params.inflation_rate / 100;
    const realReturnRate = ((1 + r) / (1 + infRate)) - 1;
    const postYears = params.delay_years || 20;
    for (let i = 0; i <= params.years; i++) {
      const futureExpense = params.principal * Math.pow(1 + infRate, i);
      const annualRetirementExpense = futureExpense * 12;
      const requiredCorpus = realReturnRate > 0 
        ? annualRetirementExpense * ((1 - Math.pow(1 + realReturnRate, -postYears)) / realReturnRate)
        : annualRetirementExpense * postYears;
      data.push({ year: i, "Required Corpus": Math.round(requiredCorpus) });
    }
  }

  const getSummary = () => {
    if (activeCalc === 'sip' || activeCalc === 'rd') {
      const monthlyRate = r / 12;
      const months = params.years * 12;
      const invested = params.principal * months;
      const futureValue = monthlyRate > 0 ? params.principal * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate) : invested;
      return (
        <div style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div>Invested: <strong>₹{Math.round(invested).toLocaleString('en-IN')}</strong></div>
          <div>Wealth Gain: <strong>₹{Math.round(futureValue - invested).toLocaleString('en-IN')}</strong></div>
          <div>Total Value: <strong style={{ color: '#3b82f6' }}>₹{Math.round(futureValue).toLocaleString('en-IN')}</strong></div>
        </div>
      );
    }
    if (activeCalc === 'step_up_sip') {
      let totalInvested = 0;
      let currentMonthlySIP = params.principal;
      let futureValue = 0;
      const monthlyRate = r / 12;
      for (let y = 1; y <= params.years; y++) {
        for (let m = 1; m <= 12; m++) {
          totalInvested += currentMonthlySIP;
          futureValue = (futureValue + currentMonthlySIP) * (1 + monthlyRate);
        }
        currentMonthlySIP += currentMonthlySIP * (params.step_up_rate / 100);
      }
      return (
        <div style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div>Total Invested: <strong>₹{Math.round(totalInvested).toLocaleString('en-IN')}</strong></div>
          <div>Wealth Gain: <strong>₹{Math.round(futureValue - totalInvested).toLocaleString('en-IN')}</strong></div>
          <div>Total Value: <strong style={{ color: '#3b82f6' }}>₹{Math.round(futureValue).toLocaleString('en-IN')}</strong></div>
        </div>
      );
    }
    if (activeCalc === 'lumpsum' || activeCalc === 'fd') {
      const futureValue = params.principal * Math.pow(1 + r, params.years);
      return (
        <div style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div>Invested: <strong>₹{Math.round(params.principal).toLocaleString('en-IN')}</strong></div>
          <div>Wealth Gain: <strong>₹{Math.round(futureValue - params.principal).toLocaleString('en-IN')}</strong></div>
          <div>Total Value: <strong style={{ color: '#3b82f6' }}>₹{Math.round(futureValue).toLocaleString('en-IN')}</strong></div>
        </div>
      );
    }
    if (activeCalc === 'emi') {
      const monthlyRate = r / 12;
      const totalMonths = params.years * 12;
      const emi = monthlyRate > 0 ? params.principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1) : params.principal / totalMonths;
      const totalPayment = emi * totalMonths;
      return (
        <div style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div>Monthly EMI: <strong style={{ color: '#ef4444' }}>₹{Math.round(emi).toLocaleString('en-IN')}</strong></div>
          <div>Total Interest: <strong>₹{Math.round(totalPayment - params.principal).toLocaleString('en-IN')}</strong></div>
          <div>Total Payment: <strong>₹{Math.round(totalPayment).toLocaleString('en-IN')}</strong></div>
        </div>
      );
    }
    if (activeCalc === 'college_cost') {
      const infRate = params.inflation_rate / 100;
      const futureCost = params.principal * Math.pow(1 + infRate, params.years);
      return (
        <div style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div>Current Cost: <strong>₹{params.principal.toLocaleString('en-IN')}</strong></div>
          <div>Future Cost (in {params.years} yrs): <strong style={{ color: '#f59e0b' }}>₹{Math.round(futureCost).toLocaleString('en-IN')}</strong></div>
        </div>
      );
    }
    if (activeCalc === 'retirement') {
      const infRate = params.inflation_rate / 100;
      const realReturnRate = ((1 + r) / (1 + infRate)) - 1;
      const postYears = params.delay_years || 20;
      const futureExpense = params.principal * Math.pow(1 + infRate, params.years);
      const annualRetirementExpense = futureExpense * 12;
      const requiredCorpus = realReturnRate > 0 
        ? annualRetirementExpense * ((1 - Math.pow(1 + realReturnRate, -postYears)) / realReturnRate)
        : annualRetirementExpense * postYears;
      return (
        <div style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div>Future Monthly Expense: <strong>₹{Math.round(futureExpense).toLocaleString('en-IN')}</strong></div>
          <div>Required Corpus: <strong style={{ color: '#a855f7' }}>₹{Math.round(requiredCorpus).toLocaleString('en-IN')}</strong></div>
        </div>
      );
    }
    if (activeCalc === 'swp') {
      let balance = params.principal;
      const monthlyRate = r / 12;
      let totalWithdrawn = 0;
      let depletedMonths = 0;
      for (let m = 1; m <= params.years * 12; m++) {
        balance = balance * (1 + monthlyRate) - params.withdrawal_amount;
        if (balance < 0) {
          totalWithdrawn += (params.withdrawal_amount + balance);
          depletedMonths = m;
          break;
        }
        totalWithdrawn += params.withdrawal_amount;
      }
      return (
        <div style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div>Total Withdrawn: <strong>₹{Math.round(totalWithdrawn).toLocaleString('en-IN')}</strong></div>
          {balance < 0 ? (
            <div style={{ color: '#ef4444' }}>Depleted in: <strong>{Math.floor(depletedMonths / 12)} Yr {depletedMonths % 12} Mo</strong></div>
          ) : (
            <div>Remaining Balance: <strong style={{ color: '#10b981' }}>₹{Math.round(balance).toLocaleString('en-IN')}</strong></div>
          )}
        </div>
      );
    }
    if (activeCalc === 'ppf') {
      const ppfRate = 0.071;
      let balance = 0;
      let invested = 0;
      for (let y = 1; y <= 15; y++) {
        invested += params.principal;
        balance = (balance + params.principal) * (1 + ppfRate);
      }
      return (
        <div style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div>Invested (15 Yrs): <strong>₹{invested.toLocaleString('en-IN')}</strong></div>
          <div>Total PPF Value: <strong style={{ color: '#3b82f6' }}>₹{Math.round(balance).toLocaleString('en-IN')}</strong></div>
        </div>
      );
    }
    if (activeCalc === 'ssy') {
      const ssyRate = 0.082;
      let balance = 0;
      let invested = 0;
      for (let y = 1; y <= 21; y++) {
        if (y <= 15) { invested += params.principal; balance += params.principal; }
        balance = balance * (1 + ssyRate);
      }
      return (
        <div style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div>Invested (15 Yrs): <strong>₹{invested.toLocaleString('en-IN')}</strong></div>
          <div>Total SSY Value: <strong style={{ color: '#3b82f6' }}>₹{Math.round(balance).toLocaleString('en-IN')}</strong></div>
        </div>
      );
    }
    if (activeCalc === 'target_sip') {
      const monthlyRate = r / 12;
      const nMonths = params.years * 12;
      const requiredSip = monthlyRate > 0 ? params.target_amount / (((Math.pow(1 + monthlyRate, nMonths) - 1) / monthlyRate) * (1 + monthlyRate)) : params.target_amount / nMonths;
      return (
        <div style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div>Target Corpus: <strong>₹{params.target_amount.toLocaleString('en-IN')}</strong></div>
          <div>Required Monthly SIP: <strong style={{ color: '#10b981' }}>₹{Math.round(requiredSip).toLocaleString('en-IN')}</strong></div>
        </div>
      );
    }
    if (activeCalc === 'cost_of_delay') {
      const monthlyRate = r / 12;
      const months = params.years * 12;
      const valueNow = monthlyRate > 0 ? params.principal * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate) : params.principal * months;
      const activeMonths = Math.max(0, (params.years - params.delay_years) * 12);
      const valueDelayed = monthlyRate > 0 ? params.principal * ((Math.pow(1 + monthlyRate, activeMonths) - 1) / monthlyRate) * (1 + monthlyRate) : params.principal * activeMonths;
      const costOfDelay = valueNow - valueDelayed;
      return (
        <div style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>Wealth (No Delay): <strong>₹{Math.round(valueNow).toLocaleString('en-IN')}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>Wealth ({params.delay_years} Yr Delay): <strong>₹{Math.round(valueDelayed).toLocaleString('en-IN')}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.4rem' }}>Cost of Delay: <strong style={{ color: '#ef4444' }}>₹{Math.round(costOfDelay).toLocaleString('en-IN')}</strong></div>
        </div>
      );
    }
    if (activeCalc === 'cagr') {
      const cagrVal = params.principal > 0 ? Math.pow(params.final_amount / params.principal, 1 / params.years) - 1 : 0;
      return (
        <div style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div>Initial: <strong>₹{params.principal.toLocaleString('en-IN')}</strong></div>
          <div>Final: <strong>₹{params.final_amount.toLocaleString('en-IN')}</strong></div>
          <div>CAGR: <strong style={{ color: '#10b981' }}>{(cagrVal * 100).toFixed(2)}%</strong></div>
        </div>
      );
    }
    if (activeCalc === 'income_tax') {
      const income = params.principal;
      let oldTax = 0;
      if (income > 250000) {
        if (income <= 500000) oldTax = (income - 250000) * 0.05;
        else if (income <= 1000000) oldTax = 12500 + (income - 500000) * 0.20;
        else oldTax = 112500 + (income - 1000000) * 0.30;
      }
      if (income <= 500000) oldTax = 0; 
      let newTax = 0;
      if (income > 300000) {
        if (income <= 600000) newTax = (income - 300000) * 0.05;
        else if (income <= 900000) newTax = 15000 + (income - 600000) * 0.10;
        else if (income <= 1200000) newTax = 45000 + (income - 900000) * 0.15;
        else if (income <= 1500000) newTax = 90000 + (income - 1200000) * 0.20;
        else newTax = 150000 + (income - 1500000) * 0.30;
      }
      if (income <= 700000) newTax = 0; 
      const diff = oldTax - newTax;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Old Tax Regime</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '0.5rem' }}>₹{Math.round(oldTax).toLocaleString('en-IN')}</div>
            </div>
            <div style={{ flex: 1, padding: '1rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#3b82f6' }}>New Tax Regime</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '0.5rem' }}>₹{Math.round(newTax).toLocaleString('en-IN')}</div>
            </div>
          </div>
          {diff !== 0 && (
            <div style={{ fontSize: '0.85rem', textAlign: 'center', color: diff > 0 ? '#10b981' : '#ef4444' }}>
              {diff > 0 
                ? `Save ₹${Math.round(diff).toLocaleString('en-IN')} under the New regime!` 
                : `Save ₹${Math.round(-diff).toLocaleString('en-IN')} under the Old regime!`}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  let title = 'Projection';
  if (activeCalc === 'sip') title = 'SIP Compounding Curve';
  if (activeCalc === 'step_up_sip') title = 'Step-Up SIP Growth';
  if (activeCalc === 'lumpsum' || activeCalc === 'fd') title = 'Lumpsum Growth';
  if (activeCalc === 'emi') title = 'EMI Balance Over Time';
  if (activeCalc === 'swp') title = 'SWP Balance Depletion';
  if (activeCalc === 'ppf') title = 'PPF Wealth Creation (15 Yr)';
  if (activeCalc === 'ssy') title = 'SSY Wealth Creation (21 Yr)';
  if (activeCalc === 'college_cost') title = 'Inflation-Adjusted College Cost';
  if (activeCalc === 'rd') title = 'Recurring Deposit Growth';
  if (activeCalc === 'target_sip') title = 'Target Amount SIP Growth';
  if (activeCalc === 'cost_of_delay') title = 'Cost of Delay Analysis';
  if (activeCalc === 'cagr') title = 'CAGR Growth Curve';
  if (activeCalc === 'retirement') title = 'Retirement Corpus Accumulation';
  if (activeCalc === 'income_tax') title = 'Income Tax Comparison';

  return (
    <div style={{ width: '100%', marginTop: '1rem', marginBottom: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{title}</h4>
        {parsedArgs?.type === 'menu' && (
          <button onClick={() => setActiveCalc('menu')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>← Back to Menu</button>
        )}
      </div>

      {activeCalc !== 'income_tax' && (
        <div style={{ height: 250, width: '100%', marginBottom: '1.5rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="year" stroke="#888" fontSize={12} tickFormatter={(val) => `Yr ${val}`} />
              <YAxis stroke="#888" fontSize={12} tickFormatter={(val) => `₹${(val/100000).toFixed(1)}L`} />
              <Tooltip 
                formatter={(value: any) => typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : String(value ?? '')}
                labelFormatter={(label) => `Year ${label}`}
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '4px' }}
              />
              {['sip', 'lumpsum', 'step_up_sip', 'ppf', 'ssy', 'fd', 'rd'].includes(activeCalc) && (
                <>
                  <Line type="monotone" dataKey="Invested" stroke="#64748b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </>
              )}
              {activeCalc === 'target_sip' && (
                <>
                  <Line type="monotone" dataKey="Invested" stroke="#64748b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Value" stroke="#10b981" strokeWidth={2} dot={false} />
                </>
              )}
              {activeCalc === 'cost_of_delay' && (
                <>
                  <Line type="monotone" dataKey="Value (Now)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Value (Delayed)" stroke="#ef4444" strokeWidth={2} dot={false} />
                </>
              )}
              {activeCalc === 'cagr' && (
                <Line type="monotone" dataKey="Value" stroke="#10b981" strokeWidth={2} dot={false} />
              )}
              {activeCalc === 'retirement' && (
                <Line type="monotone" dataKey="Required Corpus" stroke="#a855f7" strokeWidth={2} dot={false} />
              )}
              {(activeCalc === 'emi' || activeCalc === 'swp') && (
                <Line type="monotone" dataKey="Balance" stroke="#ef4444" strokeWidth={2} dot={false} />
              )}
              {activeCalc === 'college_cost' && (
                <Line type="monotone" dataKey="Cost" stroke="#f59e0b" strokeWidth={2} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {getSummary()}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        {/* Principal Input */}
        {activeCalc !== 'target_sip' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {activeCalc === 'cagr' ? 'Initial Investment (₹)' : activeCalc === 'income_tax' ? 'Annual Income (₹)' : 'Principal / Monthly (₹)'}
            </label>
            <input 
              type="number" 
              value={params.principal || ''} 
              onChange={(e) => handleParamChange('principal', Number(e.target.value))}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
            {params.principal > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {formatCurrency(params.principal)}
              </span>
            )}
          </div>
        )}
        
        {/* Target Amount Input */}
        {activeCalc === 'target_sip' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target Amount (₹)</label>
            <input 
              type="number" 
              value={params.target_amount || ''} 
              onChange={(e) => handleParamChange('target_amount', Number(e.target.value))}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
            {params.target_amount > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {formatCurrency(params.target_amount)}
              </span>
            )}
          </div>
        )}

        {/* Final Amount Input */}
        {activeCalc === 'cagr' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Final Amount (₹)</label>
            <input 
              type="number" 
              value={params.final_amount || ''} 
              onChange={(e) => handleParamChange('final_amount', Number(e.target.value))}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
            {params.final_amount > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {formatCurrency(params.final_amount)}
              </span>
            )}
          </div>
        )}

        {/* Rate Input */}
        {activeCalc !== 'college_cost' && activeCalc !== 'ppf' && activeCalc !== 'ssy' && activeCalc !== 'income_tax' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rate (%)</label>
            <input 
              type="number" 
              value={params.rate || ''} 
              onChange={(e) => handleParamChange('rate', Number(e.target.value))}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
        )}

        {/* Years Input */}
        {activeCalc !== 'income_tax' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Years</label>
            <input 
              type="number" 
              value={params.years || ''} 
              onChange={(e) => handleParamChange('years', Number(e.target.value))}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
        )}

        {/* Delay Years / Post-retirement Years Input */}
        {(activeCalc === 'cost_of_delay' || activeCalc === 'retirement') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {activeCalc === 'retirement' ? 'Years Post-Retirement' : 'Delay (Years)'}
            </label>
            <input 
              type="number" 
              value={params.delay_years || ''} 
              onChange={(e) => handleParamChange('delay_years', Number(e.target.value))}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
        )}

        {/* Step Up Input */}
        {activeCalc === 'step_up_sip' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Step Up (%)</label>
            <input 
              type="number" 
              value={params.step_up_rate || ''} 
              onChange={(e) => handleParamChange('step_up_rate', Number(e.target.value))}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
        )}

        {/* Withdrawal Input */}
        {activeCalc === 'swp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Withdrawal (₹)</label>
            <input 
              type="number" 
              value={params.withdrawal_amount || ''} 
              onChange={(e) => handleParamChange('withdrawal_amount', Number(e.target.value))}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
            {params.withdrawal_amount > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {formatCurrency(params.withdrawal_amount)}
              </span>
            )}
          </div>
        )}

        {/* Inflation Input */}
        {(activeCalc === 'college_cost' || activeCalc === 'retirement') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Inflation (%)</label>
            <input 
              type="number" 
              value={params.inflation_rate || ''} 
              onChange={(e) => handleParamChange('inflation_rate', Number(e.target.value))}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
        )}
      </div>
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
        const index = prev.findIndex((m) => m.id === aiMessageId);
        if (index === -1) return prev;
        const newArr = [...prev];
        newArr[index] = {
          ...newArr[index],
          content: '⚠️ Sorry, I encountered an error. Please try again.',
          toolInvocations: [],
        };
        return newArr;
      });
    } finally {
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === aiMessageId);
        if (index === -1) return prev;
        const msg = prev[index];
        if (!msg.content && (!msg.toolInvocations || msg.toolInvocations.length === 0)) {
           const newArr = [...prev];
           newArr[index] = {
             ...msg,
             content: '⚠️ The response was interrupted. Please try again.',
           };
           return newArr;
        }
        return prev;
      });
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
              
              <div className="quick-reply-chips" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px' }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="chip-btn"
                    onClick={() => {
                      if (s.type === 'instant_calc') {
                        const mockId = Math.random().toString(36).substring(2, 9);
                        setMessages(prev => [
                          ...prev,
                          { id: 'usr_' + mockId, role: 'user', content: 'Open Calculator Menu' },
                          {
                            id: 'asst_' + mockId,
                            role: 'assistant',
                            content: 'Here is the calculator menu.',
                            toolInvocations: [{
                              toolCallId: 'call_' + mockId,
                              toolName: 'financial_calculator',
                              args: { type: 'menu' },
                              state: 'result',
                              result: 'Here is the calculator menu.'
                            }]
                          }
                        ]);
                        setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
                      } else {
                        append({
                          id: 'msg_' + Math.random().toString(36).substring(2, 9),
                          role: 'user',
                          content: s.prompt ?? '',
                          toolInvocations: [],
                        });
                      }
                    }}
                  >
                    {s.label}
                    {s.type !== 'instant_calc' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
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
                      .map((tool, idx) => {
                        const isToolDone = m.content || (!isLoading && m.id !== messages[messages.length - 1]?.id) || (!isLoading && m.id === messages[messages.length - 1]?.id);
                        const isError = !m.content && !isLoading;
                        
                        return (
                          <div key={idx} className={`tool-invocation ${isToolDone ? 'done' : ''}`}>
                            {isError ? (
                              <X size={13} strokeWidth={3} color="red" />
                            ) : isToolDone ? (
                              <Check size={13} strokeWidth={3} />
                            ) : (
                              <Loader2 size={13} className="spinning" />
                            )}
                            <span style={isError ? { color: 'red' } : {}}>
                              {isToolDone 
                                ? getToolLabelDone(tool)
                                : getToolLabel(tool)}
                              {isError && ' (Failed)'}
                            </span>
                          </div>
                        );
                    })}
                  </div>
                )}

                {m.content ? (
                  <>
                    <div className="markdown-body">
                      <MarkdownRenderer content={m.content} />
                    </div>
                    {m.toolInvocations?.map((tool: any, idx: number) => {
                      if (tool.toolName === 'financial_calculator') {
                        return <CalculatorChart key={`chart-${idx}`} args={tool.args} append={append} />;
                      }
                      return null;
                    })}
                    {m.requiresDisclaimer && (
                      <div className="disclaimer-compact" style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                        <div className="disclaimer-primary">
                          <strong>Educational only, not financial advice.</strong> Samaira is an AI and can make mistakes.
                        </div>
                        <div className="disclaimer-secondary" style={{ justifyContent: 'flex-start' }}>
                          <a href="mailto:connect@octaraa.com">connect@octaraa.com</a>
                          <span className="disclaimer-separator">&bull;</span>
                          <span>+91 9667708843 (9:00 AM - 8:00 PM)</span>
                        </div>
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
        <div className="input-disclaimer">
          <div className="disclaimer-primary">
            <strong>Educational only, not financial advice.</strong> Samaira is an AI and can make mistakes.
          </div>
          <div className="disclaimer-secondary">
            <a href="mailto:connect@octaraa.com">connect@octaraa.com</a>
            <span className="disclaimer-separator">&bull;</span>
            <span>+91 9667708843 (9:00 AM - 8:00 PM)</span>
          </div>
        </div>
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
