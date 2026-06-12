import { AlertCircle, Sparkles } from 'lucide-react'
import { SubmitButtons } from './submit-buttons'

export default async function LoginPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error as string | undefined;

  return (
    <div className="login-wrapper">
      {/* Background ambient orbs */}
      <div className="login-bg-orb orb-1" />
      <div className="login-bg-orb orb-2" />

      <div className="login-card">
        {/* Brand header */}
        <div className="login-brand">
          <div className="login-logo">
            <Sparkles size={22} />
          </div>
          <span className="login-brand-name">Octaraa</span>
        </div>

        <div className="login-body">
          <div className="login-title-block">
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in to your family wealth dashboard</p>
          </div>

          <form className="login-form">
            {error && (
              <div className="login-error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </div>

            <SubmitButtons />
          </form>

          <p className="login-footer-note">
            New here? Hit <strong>Sign up</strong> — no verification needed.
          </p>
        </div>
      </div>
    </div>
  )
}
