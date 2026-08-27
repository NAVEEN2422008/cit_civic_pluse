import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Key, ArrowRight } from 'lucide-react';
import { apiService } from '../../utils/apiService';

export default function LoginScreen({ onLoginSuccess, onNavigateSignUp, onNavigateForgot }) {
  const [email, setEmail] = useState('');
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestLoginOtp = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    try {
      setError('');
      setLoading(true);
      const res = await apiService.requestOtp(email);
      setOtpSent(true);
      setDemoOtp(res.data?.demo_otp);
    } catch (err) {
      setError(err.message || 'Failed to request login OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const res = await apiService.login({
        email,
        password: loginMethod === 'password' ? password : null,
        otp_code: loginMethod === 'otp' ? otpCode : null
      });

      onLoginSuccess(res);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '440px',
      margin: '20px auto',
      padding: '28px 24px'
    }} className="glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '14px' }}>
        <LogIn size={24} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Citizen Login</h2>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
        Welcome back! Log in to CivicPulse using Email & Password or OTP.
      </p>

      {/* Login Method Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <button
          type="button"
          onClick={() => setLoginMethod('password')}
          className={`glass-btn ${loginMethod === 'password' ? 'glass-btn-primary' : ''}`}
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', border: 'none' }}
        >
          Password Login
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod('otp')}
          className={`glass-btn ${loginMethod === 'otp' ? 'glass-btn-primary' : ''}`}
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', border: 'none' }}
        >
          OTP Login
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {demoOtp && (
        <div style={{ padding: '10px 14px', background: 'rgba(14, 165, 233, 0.12)', border: '1px solid rgba(14, 165, 233, 0.3)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', color: '#38bdf8' }}>
          💡 <strong>Demo Login OTP:</strong> Use <strong>{demoOtp}</strong> to log in.
        </div>
      )}

      <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
            Email Address:
          </label>
          <input
            type="email"
            required
            className="glass-input"
            placeholder="citizen@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {loginMethod === 'password' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Password:
              </label>
              <button
                type="button"
                onClick={onNavigateForgot}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              required
              className="glass-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
              Enter Login OTP:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                maxLength={6}
                className="glass-input"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />
              <button
                type="button"
                onClick={handleRequestLoginOtp}
                disabled={loading}
                className="glass-btn"
                style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                {otpSent ? 'Resend' : 'Send OTP'}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="glass-btn glass-btn-primary"
          style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '1rem', marginTop: '6px' }}
        >
          <span>{loading ? 'Authenticating...' : 'Log In to CivicPulse'}</span>
          <ArrowRight size={18} />
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        New citizen?{' '}
        <button onClick={onNavigateSignUp} style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>
          Create an Account
        </button>
      </div>
    </div>
  );
}
