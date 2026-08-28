import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Key, UserCheck, Shield, User, Send, ArrowRight, CheckCircle2 } from 'lucide-react';
import { apiService } from '../../utils/apiService';

export default function LoginScreen({ onLoginSuccess, onNavigateSignUp, onNavigateForgot }) {
  const [role, setRole] = useState('CITIZEN'); // 'CITIZEN' | 'OFFICER'
  
  // Citizen Form State
  const [email, setEmail] = useState('');
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' | 'password'
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');

  // Officer Form State
  const [officerId, setOfficerId] = useState('OFF001');
  const [officerPassword, setOfficerPassword] = useState('Demo@123');

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
      setDemoOtp(res.data?.demo_otp || '123456');
    } catch (err) {
      setError(err.message || 'Failed to request login OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleCitizenSubmit = async (e) => {
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
      setError(err.message || 'Citizen login failed. Please check your credentials or register if new.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const res = await apiService.officerLogin({
        officer_id: officerId,
        password: officerPassword
      });

      onLoginSuccess(res);
    } catch (err) {
      setError(err.message || 'Officer login failed. Check Officer ID and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '460px',
      margin: '30px auto',
      padding: '32px 28px',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
    }} className="glass-panel">
      
      {/* Header Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(56, 189, 248, 0.35)',
          marginBottom: '12px'
        }}>
          <LogIn size={26} color="#041122" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
          CivicPulse Authentication
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Access Citizen Services or Governance Authority Portal
        </p>
      </div>

      {/* Role Switcher Pills */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px',
        background: 'rgba(5, 8, 17, 0.8)',
        padding: '5px',
        borderRadius: '12px',
        marginBottom: '22px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          type="button"
          onClick={() => { setRole('CITIZEN'); setError(''); }}
          style={{
            padding: '10px 12px',
            borderRadius: '9px',
            border: 'none',
            background: role === 'CITIZEN' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'transparent',
            color: role === 'CITIZEN' ? '#041122' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <User size={15} />
          <span>Citizen Hub</span>
        </button>

        <button
          type="button"
          onClick={() => { setRole('OFFICER'); setError(''); }}
          style={{
            padding: '10px 12px',
            borderRadius: '9px',
            border: 'none',
            background: role === 'OFFICER' ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : 'transparent',
            color: role === 'OFFICER' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Shield size={15} />
          <span>Officer / Admin</span>
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px 14px',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '10px',
          color: '#fda4af',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '18px'
        }}>
          <AlertCircle size={16} color="#f43f5e" />
          <span>{error}</span>
        </div>
      )}

      {/* Citizen Flow */}
      {role === 'CITIZEN' ? (
        <form onSubmit={handleCitizenSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Method Tabs */}
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setLoginMethod('otp')}
              style={{
                background: 'none',
                border: 'none',
                color: loginMethod === 'otp' ? '#38bdf8' : 'var(--text-muted)',
                fontWeight: loginMethod === 'otp' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                borderBottom: loginMethod === 'otp' ? '2px solid #38bdf8' : '2px solid transparent',
                paddingBottom: '4px'
              }}
            >
              Email OTP Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('password')}
              style={{
                background: 'none',
                border: 'none',
                color: loginMethod === 'password' ? '#38bdf8' : 'var(--text-muted)',
                fontWeight: loginMethod === 'password' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                borderBottom: loginMethod === 'password' ? '2px solid #38bdf8' : '2px solid transparent',
                paddingBottom: '4px'
              }}
            >
              Password Login
            </button>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="citizen@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '40px' }}
              />
              <Mail size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
            </div>
          </div>

          {loginMethod === 'otp' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={handleRequestLoginOtp}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="glass-input"
                  style={{ paddingLeft: '40px', letterSpacing: '4px', fontWeight: 700 }}
                />
                <Key size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              </div>

              {demoOtp && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  color: '#6ee7b7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>Demo Test OTP: <strong style={{ color: '#ffffff', letterSpacing: '2px' }}>{demoOtp}</strong></span>
                </div>
              )}
            </div>
          )}

          {loginMethod === 'password' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateForgot}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Forgot?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input"
                  style={{ paddingLeft: '40px' }}
                />
                <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glass-btn glass-btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '0.92rem', borderRadius: '12px', marginTop: '6px' }}
          >
            <span>{loading ? 'Authenticating...' : 'Log In to Citizen Hub'}</span>
            <ArrowRight size={16} />
          </button>

          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>New citizen? </span>
            <button
              type="button"
              onClick={onNavigateSignUp}
              style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Create Account & Verify Identity
            </button>
          </div>
        </form>
      ) : (
        /* Officer & Admin Flow */
        <form onSubmit={handleOfficerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Officer or Admin ID
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                placeholder="OFF001 or ADMIN01"
                value={officerId}
                onChange={(e) => setOfficerId(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '40px', fontWeight: 700 }}
              />
              <Shield size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                placeholder="Demo@123"
                value={officerPassword}
                onChange={(e) => setOfficerPassword(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '40px' }}
              />
              <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
            </div>
          </div>

          <div style={{
            padding: '10px 12px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: '#c4b5fd'
          }}>
            Demo credentials: <strong>OFF001</strong> / <strong>ADMIN01</strong> with password <strong>Demo@123</strong>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glass-btn"
            style={{ 
              width: '100%', 
              padding: '14px', 
              fontSize: '0.92rem', 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: '#ffffff',
              fontWeight: 700,
              border: 'none',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
            }}
          >
            <span>{loading ? 'Verifying Credentials...' : 'Access Authority Portal'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      )}

    </div>
  );
}
