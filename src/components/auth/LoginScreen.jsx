import React, { useState } from 'react';
import {
  ArrowRight, ShieldCheck, Sparkles, Mail, KeyRound, Eye, EyeOff,
  Building2, Users, ChevronRight, Lock, CheckCircle2, Globe2,
  FileCheck, Languages, Activity, TrendingUp, Radio
} from 'lucide-react';
import { apiService } from '../../utils/apiService';

const CrestLogo = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="crest-login" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0c7a5e"/>
        <stop offset="1" stopColor="#064430"/>
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#crest-login)" />
    <path d="M22 42 L22 30 L25 30 L25 26 L28 26 L28 23 L32 19 L36 23 L36 26 L39 26 L39 30 L42 30 L42 42 Z" fill="#fbd77a" />
    <rect x="20" y="42" width="24" height="4" fill="#fbd77a" />
    <rect x="18" y="46" width="28" height="2" fill="#fbd77a" opacity="0.7" />
  </svg>
);

const KolamSVG = ({ size = 200, opacity = 0.08 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
    <g stroke="#fbd77a" strokeWidth="0.8" fill="none">
      <circle cx="100" cy="100" r="90" />
      <circle cx="100" cy="100" r="70" />
      <circle cx="100" cy="100" r="50" />
      <circle cx="100" cy="100" r="30" />
      <circle cx="100" cy="100" r="10" fill="#fbd77a" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30) * Math.PI / 180;
        return <circle key={i} cx={100 + 90 * Math.cos(a)} cy={100 + 90 * Math.sin(a)} r="3" fill="#fbd77a" />;
      })}
    </g>
  </svg>
);

export default function LoginScreen({ onLogin, onBack, onCreateAccount, onForgotPassword }) {
  const [role, setRole] = useState('citizen');
  const [authMode, setAuthMode] = useState('otp');
  const [email, setEmail] = useState('naveen.citizen@test.in');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Officer fields
  const [officerId, setOfficerId] = useState('OFF001');
  const [officerPass, setOfficerPass] = useState('Demo@123');

  const sendOtp = async () => {
    setError(null); setLoading(true);
    try {
      const r = await apiService.sendCitizenOtp(email);
      setOtpSent(true);
      if (r && r.dev_otp) setDemoOtp(r.dev_otp);
    } catch (e) {
      // In offline mode, generate a fake demo OTP
      setOtpSent(true);
      setDemoOtp('114110');
    } finally { setLoading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      if (role === 'citizen') {
        if (authMode === 'otp') {
          await onLogin({ role: 'citizen', method: 'otp', email, otp });
        } else {
          await onLogin({ role: 'citizen', method: 'password', email, password });
        }
      } else {
        await onLogin({ role: 'officer', officer_id: officerId, password: officerPass });
      }
    } catch (err) {
      setError(err?.message || 'Sign-in failed. Check your credentials and try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>

      {/* === LEFT: Editorial brand panel === */}
      <aside className="login-brand-panel" style={{
        flex: '0 0 46%', maxWidth: '46%',
        background: 'var(--ink)', color: 'var(--ink-inverse)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 'var(--sp-10)',
      }}>
        <KolamSVG size={600} opacity={0.04} />
        <div style={{ position: 'absolute', bottom: '-100px', right: '-100px' }}>
          <KolamSVG size={500} opacity={0.05} />
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 'var(--sp-12)' }}>
            <CrestLogo size={44} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800 }}>
                CivicPulse
              </div>
              <div style={{ fontSize: '.7rem', color: 'var(--ink-faint)' }}>
                Government of Tamil Nadu
              </div>
            </div>
          </div>

          <div className="section-label" style={{ color: '#fbd77a' }}>
            Welcome back
          </div>
          <h1 className="display-lg" style={{ color: 'var(--ink-inverse)', marginBottom: 'var(--sp-5)' }}>
            Sign in to <span className="editorial" style={{ color: '#fbd77a' }}>continue</span>
            <br />your civic work.
          </h1>
          <p className="body-lg" style={{ color: 'var(--ink-faint)', maxWidth: '420px' }}>
            File a report, track it to resolution, or join 12,400 officers
            making Tamil Nadu's cities work better, every day.
          </p>
        </div>

        {/* Mini impact stat block */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 'var(--sp-8)', paddingTop: 'var(--sp-8)', borderTop: '1px solid rgba(253,252,249,.1)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: '#fbd77a', lineHeight: 1 }}>2.8L</div>
            <div className="body-xs" style={{ color: 'var(--ink-faint)', marginTop: '4px' }}>citizens served</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: '#fbd77a', lineHeight: 1 }}>94.2%</div>
            <div className="body-xs" style={{ color: 'var(--ink-faint)', marginTop: '4px' }}>resolved in 7 days</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: '#fbd77a', lineHeight: 1 }}>38</div>
            <div className="body-xs" style={{ color: 'var(--ink-faint)', marginTop: '4px' }}>districts active</div>
          </div>
        </div>
      </aside>

      {/* === RIGHT: Auth form === */}
      <main className="login-form-panel" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: 'var(--sp-10)', background: 'var(--bg)',
      }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-10)' }}>
          <button onClick={onBack} className="btn btn-ghost btn-sm">
            ← Back to home
          </button>
          <div className="flex items-center gap-2 body-xs" style={{ color: 'var(--ink-muted)' }}>
            <ShieldCheck size={13} color="var(--green-500)" />
            <span>Encrypted · RTI-compliant</span>
          </div>
        </div>

        <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>

          <div className="section-label">Step 01 / 02</div>
          <h2 className="display-md" style={{ fontSize: '2rem', marginBottom: '8px' }}>
            Choose your <span className="editorial">portal.</span>
          </h2>
          <p className="body-sm" style={{ color: 'var(--ink-3)', marginBottom: 'var(--sp-6)' }}>
            Two entrances, one mission. Pick where you belong.
          </p>

          {/* Role selector */}
          <div className="grid-2" style={{ gap: '12px', marginBottom: 'var(--sp-6)' }}>
            <button type="button" onClick={() => setRole('citizen')}
              className="card"
              style={{
                cursor: 'pointer', textAlign: 'left', padding: 'var(--sp-4)',
                borderColor: role === 'citizen' ? 'var(--green-500)' : 'var(--border)',
                background: role === 'citizen' ? 'var(--green-50)' : 'var(--surface)',
                boxShadow: role === 'citizen' ? '0 0 0 3px rgba(12,74,62,.1)' : 'var(--shadow-sm)',
              }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 'var(--r-md)',
                  background: 'var(--green-500)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Users size={16} color="#fff" />
                </div>
                {role === 'citizen' && <CheckCircle2 size={16} color="var(--green-500)" />}
              </div>
              <div className="bold body-sm">Citizen</div>
              <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>File & track reports</div>
            </button>

            <button type="button" onClick={() => setRole('officer')}
              className="card"
              style={{
                cursor: 'pointer', textAlign: 'left', padding: 'var(--sp-4)',
                borderColor: role === 'officer' ? 'var(--amber-400)' : 'var(--border)',
                background: role === 'officer' ? 'var(--amber-50)' : 'var(--surface)',
                boxShadow: role === 'officer' ? '0 0 0 3px rgba(224,143,0,.12)' : 'var(--shadow-sm)',
              }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 'var(--r-md)',
                  background: 'var(--amber-400)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={16} color="var(--ink)" />
                </div>
                {role === 'officer' && <CheckCircle2 size={16} color="var(--amber-500)" />}
              </div>
              <div className="bold body-sm">Officer / Admin</div>
              <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>Resolve & manage</div>
            </button>
          </div>

          {/* Auth form */}
          {role === 'citizen' ? (
            <form onSubmit={submit} className="card" style={{ padding: 'var(--sp-6)' }}>
              {/* OTP / Password tabs */}
              <div className="tabs" style={{ marginBottom: 'var(--sp-5)' }}>
                <button type="button" onClick={() => setAuthMode('otp')}
                  className={`tab ${authMode === 'otp' ? 'active' : ''}`} style={{ flex: 1 }}>
                  <Mail size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Email OTP
                </button>
                <button type="button" onClick={() => setAuthMode('password')}
                  className={`tab ${authMode === 'password' ? 'active' : ''}`} style={{ flex: 1 }}>
                  <Lock size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Password
                </button>
              </div>

              <div className="field">
                <label className="label">Email address</label>
                <input className="input" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              {authMode === 'otp' ? (
                <div className="field">
                  <label className="label">One-time passcode</label>
                  <div className="flex gap-2">
                    <input className="input mono" type="text" inputMode="numeric" maxLength={6}
                      placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                    <button type="button" onClick={sendOtp} disabled={loading || !email}
                      className="btn btn-secondary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {otpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  </div>
                  {demoOtp && (
                    <div className="badge badge-amber" style={{ marginTop: '10px', width: '100%', justifyContent: 'flex-start' }}>
                      <Sparkles size={11} /> Demo Test OTP: <strong style={{ marginLeft: 4, fontFamily: 'var(--font-mono)' }}>{demoOtp}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="field">
                  <label className="label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input" type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--ink-muted)', padding: 4,
                      }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '6px' }}>
                    <a onClick={onForgotPassword} style={{ color: 'var(--ink-muted)', fontWeight: 500, cursor: 'pointer' }}>
                      Forgot password?
                    </a>
                  </div>
                </div>
              )}

              {error && (
                <div className="badge badge-red" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                  ⚠ {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-3)' }}>
                {loading ? 'Signing you in…' : <>Sign in as citizen <ArrowRight size={14} /></>}
              </button>

              <div className="body-xs" style={{ textAlign: 'center', color: 'var(--ink-muted)', marginTop: 'var(--sp-4)' }}>
                New to CivicPulse?{' '}
                <a onClick={onCreateAccount} style={{ color: 'var(--green-500)', fontWeight: 600, cursor: 'pointer' }}>Create an account</a>
              </div>
            </form>
          ) : (
            <form onSubmit={submit} className="card" style={{ padding: 'var(--sp-6)' }}>
              <div className="field">
                <label className="label">Officer ID</label>
                <input className="input mono" type="text" placeholder="OFF001"
                  value={officerId} onChange={(e) => setOfficerId(e.target.value)} required />
              </div>
              <div className="field">
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password" value={officerPass} onChange={(e) => setOfficerPass(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--ink-muted)', padding: 4,
                    }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="badge badge-red" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                  ⚠ {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-amber" style={{ width: '100%', marginTop: 'var(--sp-3)' }}>
                {loading ? 'Authenticating…' : <>Open officer portal <ArrowRight size={14} /></>}
              </button>

              <div className="body-xs" style={{ textAlign: 'center', color: 'var(--ink-muted)', marginTop: 'var(--sp-4)' }}>
                Demo: <span className="mono" style={{ color: 'var(--ink-2)' }}>OFF001 / Demo@123</span>
              </div>
            </form>
          )}

          {/* Trust row */}
          <div className="flex gap-3" style={{ marginTop: 'var(--sp-6)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div className="flex items-center gap-2 body-xs" style={{ color: 'var(--ink-muted)' }}>
              <Globe2 size={12} color="var(--green-500)" /> தமிழ் + English
            </div>
            <div className="flex items-center gap-2 body-xs" style={{ color: 'var(--ink-muted)' }}>
              <FileCheck size={12} color="var(--green-500)" /> RTI compliant
            </div>
            <div className="flex items-center gap-2 body-xs" style={{ color: 'var(--ink-muted)' }}>
              <Activity size={12} color="var(--green-500)" /> 99.9% uptime
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @media(max-width:900px){
          .login-brand-panel{flex:0 0 0 !important;max-width:0 !important;padding:0 !important;overflow:hidden;}
          .login-form-panel{padding:24px 20px !important;}
        }
      `}</style>
    </div>
  );
}