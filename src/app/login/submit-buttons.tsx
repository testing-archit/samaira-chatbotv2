"use client";

import { useFormStatus } from 'react-dom';
import { login, signup } from './actions';
import { Loader2 } from 'lucide-react';

export function SubmitButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="login-actions">
      <button formAction={login} className="btn-primary" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin mr-2 inline" /> : null}
        {pending ? 'Logging in...' : 'Log in'}
      </button>
      <button formAction={signup} className="btn-secondary" disabled={pending}>
        {pending ? 'Signing up...' : 'Sign up'}
      </button>
    </div>
  );
}
