import { login, signup } from './actions'
import { Bot, AlertCircle } from 'lucide-react'
import { SubmitButtons } from './submit-buttons'

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
          <h3>Welcome back</h3>
          <p>Sign in to access your family&apos;s financial profiles.</p>
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
          
          <SubmitButtons />
        </form>
      </div>
    </div>
  )
}
