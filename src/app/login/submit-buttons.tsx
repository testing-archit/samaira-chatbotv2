"use client";

import { useFormStatus } from 'react-dom';
import { login, signup } from './actions';
import { Loader2 } from 'lucide-react';

export function SubmitButtons({ isSignUp }: { isSignUp?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <div className="login-actions">
      {isSignUp ? (
        <button
          formAction={signup}
          className="btn-primary"
          disabled={pending}
        >
          {pending ? <><Loader2 size={16} className="spinning btn-icon" /> Signing up...</> : 'Sign up'}
        </button>
      ) : (
        <button
          formAction={login}
          className="btn-primary"
          disabled={pending}
        >
          {pending ? <><Loader2 size={16} className="spinning btn-icon" /> Logging in...</> : 'Log in'}
        </button>
      )}
    </div>
  );
}
