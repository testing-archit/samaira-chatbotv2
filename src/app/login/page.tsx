import { login, signup } from './actions'
import { Bot, AlertCircle } from 'lucide-react'

export default async function LoginPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error as string | undefined;
  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-avatar">
            <Bot size={28} />
          </div>
          <h3>Welcome to Samaira</h3>
          <p>Sign in or create a new account to secure your family's financial future.</p>
        </div>
        
        <form className="login-form">
          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
            />
          </div>
          
          <div className="login-actions">
            <button formAction={login} className="btn-primary">
              Log in
            </button>
            <button formAction={signup} className="btn-secondary">
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
