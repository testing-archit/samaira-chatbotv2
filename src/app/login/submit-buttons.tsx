"use client";

import { useFormStatus } from 'react-dom';
import { login, signup } from './actions';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export function SubmitButtons() {
  const { pending } = useFormStatus();
  const [activeAction, setActiveAction] = useState<'login' | 'signup' | null>(null);

  // Reset when the form is done submitting
  useEffect(() => {
    if (!pending) setActiveAction(null);
  }, [pending]);

  return (
    <div className="login-actions">
      <button
        formAction={login}
        className="btn-primary"
        disabled={pending}
        onClick={() => setActiveAction('login')}
      >
        {pending && activeAction === 'login'
          ? <><Loader2 size={16} className="spinning btn-icon" /> Logging in...</>
          : 'Log in'}
      </button>
      <button
        formAction={signup}
        className="btn-secondary"
        disabled={pending}
        onClick={() => setActiveAction('signup')}
      >
        {pending && activeAction === 'signup'
          ? <><Loader2 size={16} className="spinning btn-icon" /> Signing up...</>
          : 'Sign up'}
      </button>
    </div>
  );
}
