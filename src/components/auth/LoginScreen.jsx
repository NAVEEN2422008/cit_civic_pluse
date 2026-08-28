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

export default function LoginScreen({ onLogin, onBack, onCreateAccount, onForgotPassword, lang = 'English' }) {
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
                {lang === 'Tamil' ? 'தமிழ்நாடு அரசு' : 'Government of Tamil Nadu'}
              </div>
            </div>
          </div>

          <div className="section-label" style={{ color: '#fbd77a' }}>
            {lang === 'Tamil' ? 'மீண்டும் வருக' : 'Welcome back'}
          </div>
          <h1 className="display-lg" style={{ color: 'var(--ink-inverse)', marginBottom: 'var(--sp-5)' }}>
            {lang === 'Tamil' ? (
              <>உங்கள் குடிமக்கள் பணியைத் <br /><span className="editorial" style={{ color: '#fbd77a' }}>தொடர</span> உள்நுழையவும்.</>
            ) : (
              <>Sign in to <span className="editorial" style={{ color: '#fbd77a' }}>continue</span><br />your civic work.</>
            )}
          </h1>
          <p className="body-lg" style={{ color: 'var(--ink-faint)', maxWidth: '420px' }}>
            {lang === 'Tamil'
              ? 'புகாரைப் பதிவுசெய்யவும், அதன் தீர்வை கண்காணிக்கவும், அல்லது தமிழ்நாட்டின் நகரங்களை மேம்படுத்தும் 12,400 அதிகாரிகளுடன் இணையவும்.'
              : "File a report, track it to resolution, or join 12,400 officers making Tamil Nadu's cities work better, every day."}
          </p>
        </div>

        {/* Mini impact stat block */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 'var(--sp-8)', paddingTop: 'var(--sp-8)', borderTop: '1px solid rgba(253,252,249,.1)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: '#fbd77a', lineHeight: 1 }}>2.8L</div>
            <div className="body-xs" style={{ color: 'var(--ink-faint)', marginTop: '4px' }}>{lang === 'Tamil' ? 'குடிமக்கள் பயன்' : 'citizens served'}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: '#fbd77a', lineHeight: 1 }}>94.2%</div>
            <div className="body-xs" style={{ color: 'var(--ink-faint)', marginTop: '4px' }}>{lang === 'Tamil' ? '7 நாளில் தீர்வு' : 'resolved in 7 days'}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: '#fbd77a', lineHeight: 1 }}>38</div>
            <div className="body-xs" style={{ color: 'var(--ink-faint)', marginTop: '4px' }}>{lang === 'Tamil' ? 'மாவட்டங்கள்' : 'districts active'}</div>
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
            ← {lang === 'Tamil' ? 'முகப்புக்குத் திரும்பு' : 'Back to home'}
          </button>
          <div className="flex items-center gap-2 body-xs" style={{ color: 'var(--ink-muted)' }}>
            <ShieldCheck size={13} color="var(--green-500)" />
            <span>{lang === 'Tamil' ? 'குறியாக்கம் · RTI இணக்கம்' : 'Encrypted · RTI-compliant'}</span>
          </div>
        </div>

        <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>

          <div className="section-label">{lang === 'Tamil' ? 'படி 01 / 02' : 'Step 01 / 02'}</div>
          <h2 className="display-md" style={{ fontSize: '2rem', marginBottom: '8px' }}>
            {lang === 'Tamil' ? (<>உங்கள் <span className="editorial">போர்ட்டலைத்</span> தேர்ந்தெடுக்கவும்.</>) : (<>Choose your <span className="editorial">portal.</span></>)}
          </h2>
          <p className="body-sm" style={{ color: 'var(--ink-3)', marginBottom: 'var(--sp-6)' }}>
            {lang === 'Tamil' ? 'இரு நுழைவாயில்கள், ஒரு நோக்கம். நீங்கள் எங்கு சேர வேண்டும் என்பதைத் தேர்ந்தெடுங்கள்.' : 'Two entrances, one mission. Pick where you belong.'}
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
              <div className="bold body-sm">{lang === 'Tamil' ? 'குடிமக்கள்' : 'Citizen'}</div>
              <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>{lang === 'Tamil' ? 'புகார் பதிவு & கண்காணிப்பு' : 'File & track reports'}</div>
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
              <div className="bold body-sm">{lang === 'Tamil' ? 'அதிகாரி / நிர்வாகம்' : 'Officer / Admin'}</div>
              <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>{lang === 'Tamil' ? 'தீர்க்கவும் & நிர்வகிக்கவும்' : 'Resolve & manage'}</div>
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
                  {lang === 'Tamil' ? 'மின்னஞ்சல் OTP' : 'Email OTP'}
                </button>
                <button type="button" onClick={() => setAuthMode('password')}
                  className={`tab ${authMode === 'password' ? 'active' : ''}`} style={{ flex: 1 }}>
                  <Lock size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {lang === 'Tamil' ? 'கடவுச்சொல்' : 'Password'}
                </button>
              </div>

              <div className="field">
                <label className="label">{lang === 'Tamil' ? 'மின்னஞ்சல் முகவரி' : 'Email address'}</label>
                <input className="input" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              {authMode === 'otp' ? (
                <div className="field">
                  <label className="label">{lang === 'Tamil' ? 'ஒருமுறை கடவுச்சொல் (OTP)' : 'One-time passcode'}</label>
                  <div className="flex gap-2">
                    <input className="input mono" type="text" inputMode="numeric" maxLength={6}
                      placeholder={lang === 'Tamil' ? '6-இலக்க எண்' : '6-digit code'} value={otp} onChange={(e) => setOtp(e.target.value)} required />
                    <button type="button" onClick={sendOtp} disabled={loading || !email}
                      className="btn btn-secondary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {otpSent ? (lang === 'Tamil' ? 'மீண்டும் அனுப்பு' : 'Resend') : (lang === 'Tamil' ? 'OTP அனுப்பு' : 'Send OTP')}
                    </button>
                  </div>
                  {demoOtp && (
                    <div className="badge badge-amber" style={{ marginTop: '10px', width: '100%', justifyContent: 'flex-start' }}>
                      <Sparkles size={11} /> {lang === 'Tamil' ? 'டெமோ சோதனை OTP:' : 'Demo Test OTP:'} <strong style={{ marginLeft: 4, fontFamily: 'var(--font-mono)' }}>{demoOtp}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="field">
                  <label className="label">{lang === 'Tamil' ? 'கடவுச்சொல்' : 'Password'}</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input" type={showPassword ? 'text' : 'password'}
                      placeholder={lang === 'Tamil' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Enter your password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
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
                      {lang === 'Tamil' ? 'கடவுச்சொல் மறந்துவிட்டதா?' : 'Forgot password?'}
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
                {loading ? (lang === 'Tamil' ? 'உள்நுழைகிறது…' : 'Signing you in…') : <>{lang === 'Tamil' ? 'குடிமக்களாக உள்நுழைக' : 'Sign in as citizen'} <ArrowRight size={14} /></>}
              </button>

              <div className="body-xs" style={{ textAlign: 'center', color: 'var(--ink-muted)', marginTop: 'var(--sp-4)' }}>
                {lang === 'Tamil' ? 'CivicPulse-க்கு புதியவரா? ' : 'New to CivicPulse? '}
                <a onClick={onCreateAccount} style={{ color: 'var(--green-500)', fontWeight: 600, cursor: 'pointer' }}>{lang === 'Tamil' ? 'கணக்கு தொடங்கவும்' : 'Create an account'}</a>
              </div>
            </form>
          ) : (
            <form onSubmit={submit} className="card" style={{ padding: 'var(--sp-6)' }}>
              <div className="field">
                <label className="label">{lang === 'Tamil' ? 'அதிகாரி எண் (Officer ID)' : 'Officer ID'}</label>
                <input className="input mono" type="text" placeholder="OFF001"
                  value={officerId} onChange={(e) => setOfficerId(e.target.value)} required />
              </div>
              <div className="field">
                <label className="label">{lang === 'Tamil' ? 'கடவுச்சொல்' : 'Password'}</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPassword ? 'text' : 'password'}
                    placeholder={lang === 'Tamil' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Enter password'} value={officerPass} onChange={(e) => setOfficerPass(e.target.value)} required />
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
                {loading ? (lang === 'Tamil' ? 'சரிபார்க்கப்படுகிறது…' : 'Authenticating…') : <>{lang === 'Tamil' ? 'அதிகாரி போர்ட்டலைத் திறக்க' : 'Open officer portal'} <ArrowRight size={14} /></>}
              </button>

              {/* Quick Preset Selector for Testing All Officer Roles */}
              <div style={{ marginTop: 'var(--sp-4)', padding: '12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px' }}>
                <div className="body-xs bold" style={{ color: 'var(--amber-400)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={12} /> {lang === 'Tamil' ? '1-கிளிக் டெமோ அதிகாரி தேர்வுகள்:' : '1-Click Demo Officer Presets:'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => { setOfficerId('OFF001'); setOfficerPass('Demo@123'); }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'flex-start', border: officerId === 'OFF001' ? '1px solid var(--amber-400)' : undefined }}
                  >
                    👷 {lang === 'Tamil' ? 'வார்டு அதிகாரி' : 'Ward Officer'} (OFF001)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOfficerId('ZONAL_CHENNAI'); setOfficerPass('Demo@123'); }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'flex-start', border: officerId === 'ZONAL_CHENNAI' ? '1px solid var(--amber-400)' : undefined }}
                  >
                    🏢 {lang === 'Tamil' ? 'மண்டல தலைவர்' : 'Zonal Head'} (ZONAL_CHENNAI)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOfficerId('COLLECTOR_CBE'); setOfficerPass('Demo@123'); }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'flex-start', border: officerId === 'COLLECTOR_CBE' ? '1px solid var(--amber-400)' : undefined }}
                  >
                    🏛️ {lang === 'Tamil' ? 'மாவட்ட ஆட்சியர்' : 'Collector'} (COLLECTOR_CBE)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOfficerId('ADMIN_TN'); setOfficerPass('Demo@123'); }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'flex-start', border: officerId === 'ADMIN_TN' ? '1px solid var(--amber-400)' : undefined }}
                  >
                    👑 {lang === 'Tamil' ? 'மாநில நிர்வாகி' : 'State Admin'} (ADMIN_TN)
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Trust row */}
          <div className="flex gap-3" style={{ marginTop: 'var(--sp-6)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div className="flex items-center gap-2 body-xs" style={{ color: 'var(--ink-muted)' }}>
              <Globe2 size={12} color="var(--green-500)" /> {lang === 'Tamil' ? 'தமிழ் + ஆங்கிலம்' : 'தமிழ் + English'}
            </div>
            <div className="flex items-center gap-2 body-xs" style={{ color: 'var(--ink-muted)' }}>
              <FileCheck size={12} color="var(--green-500)" /> {lang === 'Tamil' ? 'RTI இணக்கம்' : 'RTI compliant'}
            </div>
            <div className="flex items-center gap-2 body-xs" style={{ color: 'var(--ink-muted)' }}>
              <Activity size={12} color="var(--green-500)" /> {lang === 'Tamil' ? '99.9% இயக்க நேரம்' : '99.9% uptime'}
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