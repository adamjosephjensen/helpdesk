import { useState } from 'react'
import { supabase } from '../supabase'

type AuthMode = 'email-password' | 'otp'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<AuthMode>('email-password')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailPasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) throw error
      setMessage('Check your email for the confirmation link')
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) throw error
      setMessage('Check your email for the magic link')
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-mode-toggle">
        <button
          onClick={() => setAuthMode('email-password')}
          className={authMode === 'email-password' ? 'active' : ''}
          type="button"
        >
          Email + Password
        </button>
        <button
          onClick={() => setAuthMode('otp')}
          className={authMode === 'otp' ? 'active' : ''}
          type="button"
        >
          Magic Link
        </button>
      </div>

      <form onSubmit={authMode === 'otp' ? handleOTPSignIn : handleEmailPasswordSignIn}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {authMode === 'email-password' && (
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}

        {message && <div className="message">{message}</div>}

        <div className="auth-buttons">
          {authMode === 'email-password' ? (
            <>
              <button type="submit" disabled={loading}>
                Sign In
              </button>
              <button type="button" onClick={handleEmailPasswordSignUp} disabled={loading}>
                Sign Up
              </button>
            </>
          ) : (
            <button type="submit" disabled={loading}>
              Send Magic Link
            </button>
          )}
        </div>
      </form>
    </div>
  )
} 