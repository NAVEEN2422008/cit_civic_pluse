import React, { useState, useEffect } from 'react';
import {
  ArrowRight, ShieldCheck, Sparkles, MapPin, Mic, Camera,
  Users, Building2, Zap, CheckCircle2, ChevronDown, Globe2,
  Activity, TrendingUp, Clock, BarChart3, Satellite, Radio,
  FileCheck, Languages, Heart, Eye, Phone
} from 'lucide-react';

/* ============================================================
   CIVICPULSE — EDITORIAL LANDING PAGE
   Magazine-quality, persona-aware, scannable, trustworthy.
   ============================================================ */

const KolamSVG = ({ size = 80, opacity = 0.12 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
    <g stroke="currentColor" strokeWidth="0.8" fill="none">
      <circle cx="40" cy="40" r="36" />
      <circle cx="40" cy="40" r="28" />
      <circle cx="40" cy="40" r="20" />
      <circle cx="40" cy="40" r="12" />
      <circle cx="40" cy="40" r="4" fill="currentColor" />
      <path d="M40 4 L40 76 M4 40 L76 40 M14 14 L66 66 M14 66 L66 14" />
      <circle cx="40" cy="4" r="2" fill="currentColor" />
      <circle cx="40" cy="76" r="2" fill="currentColor" />
      <circle cx="4" cy="40" r="2" fill="currentColor" />
      <circle cx="76" cy="40" r="2" fill="currentColor" />
      <circle cx="14" cy="14" r="2" fill="currentColor" />
      <circle cx="66" cy="66" r="2" fill="currentColor" />
      <circle cx="14" cy="66" r="2" fill="currentColor" />
      <circle cx="66" cy="14" r="2" fill="currentColor" />
    </g>
  </svg>
);

const CrestLogo = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="crest" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0c7a5e"/>
        <stop offset="1" stopColor="#064430"/>
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#crest)" />
    <circle cx="32" cy="32" r="30" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="1" />
    {/* Temple tower silhouette */}
    <path d="M22 42 L22 30 L25 30 L25 26 L28 26 L28 23 L32 19 L36 23 L36 26 L39 26 L39 30 L42 30 L42 42 Z" fill="#fbd77a" />
    <rect x="20" y="42" width="24" height="4" fill="#fbd77a" />
    <rect x="18" y="46" width="28" height="2" fill="#fbd77a" opacity="0.7" />
    <circle cx="32" cy="22" r="1.2" fill="#fff" />
  </svg>
);

export default function SplashScreen({ onStart, lang = 'English' }) {
  const [scrolled, setScrolled] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const liveFeed = [
    { id: 'TN-9921', text: 'Streetlight repaired, Ward 64, Coimbatore', time: '2m ago', status: 'resolved' },
    { id: 'TN-9920', text: 'Garbage overflow flagged, T. Nagar, Chennai', time: '5m ago', status: 'open' },
    { id: 'TN-9919', text: 'Pothole fixed, GST Road, Tambaram', time: '11m ago', status: 'resolved' },
    { id: 'TN-9918', text: 'Water supply restored, Madurai East', time: '17m ago', status: 'resolved' },
    { id: 'TN-9917', text: 'Drainage cleared, RS Puram, Coimbatore', time: '24m ago', status: 'resolved' },
  ];

  useEffect(() => {
    const t = setInterval(() => setTickerIndex(i => (i + 1) % liveFeed.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="app-shell" style={{ background: 'var(--bg)' }}>

      {/* === TOP NAVIGATION === */}
      <header className="cp-header" style={{
        background: scrolled ? 'rgba(250,247,242,.95)' : 'rgba(250,247,242,.7)',
      }}>
        <div className="cp-header-brand">
          <CrestLogo size={40} />
          <div className="cp-header-title">
            <h1 style={{ fontFamily: 'var(--font-display)' }}>CivicPulse</h1>
            <p>Government of Tamil Nadu · AI Civic Platform</p>
          </div>
        </div>
        <div className="cp-header-actions">
          <a href="#how" className="btn btn-ghost btn-sm hide-mobile">How it works</a>
          <a href="#stats" className="btn btn-ghost btn-sm hide-mobile">Impact</a>
          <a href="#officers" className="btn btn-ghost btn-sm hide-mobile">For officers</a>
          <button onClick={onStart} className="btn btn-primary btn-sm">
            Sign in <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* === HERO === */}
      <section className="container" style={{ paddingTop: 'var(--sp-12)', paddingBottom: 'var(--sp-16)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 'var(--sp-12)',
          alignItems: 'center',
        }} className="hero-grid">

          {/* LEFT: Editorial copy */}
          <div>
            <div className="section-label reveal d-0">
              <span>{lang === 'Tamil' ? 'இதழ் 01 · நிறுவப்பட்டது 2025' : 'Issue 01 · Est. 2025'}</span>
            </div>

            <h1 className="display-xl reveal d-1" style={{ marginBottom: 'var(--sp-5)' }}>
              {lang === 'Tamil' ? (<>உங்கள் தெரு.<br /><span className="editorial grad-text-dark">உங்கள் குரல்.</span></>) : (<>Your street.<br /><span className="editorial grad-text-dark">Your say.</span></>)}
            </h1>

            <p className="body-lg reveal d-2" style={{
              color: 'var(--ink-2)', maxWidth: '540px', marginBottom: 'var(--sp-8)',
            }}>
              {lang === 'Tamil' ? (
                <>தெரு விளக்கு, வடிகால், குழி ஆகியவற்றை <strong>ஒரு நிமிடத்திற்குள்</strong> புகாரளிக்கவும் — தமிழ் மற்றும் ஆங்கிலத்தில் குரல், புகைப்படம் அல்லது உரை வழியாக.</>
              ) : (
                <>Report broken streetlights, overflowing drains, potholes and broken
                roads in <strong>under a minute</strong> — by voice, photo, or text in
                Tamil and English. Watch your report move from filing to fixing,
                in real time, on a live map.</>
              )}
            </p>

            <div className="reveal d-3" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: 'var(--sp-8)' }}>
              <button onClick={onStart} className="btn btn-primary btn-lg">
                <Sparkles size={16} /> {lang === 'Tamil' ? 'புகாரளி' : 'Report an issue'}
                <ArrowRight size={16} />
              </button>
              <a href="#how" className="btn btn-secondary btn-lg">
                <Eye size={16} /> {lang === 'Tamil' ? 'எப்படி வேலை செய்கிறது' : 'See how it works'}
              </a>
            </div>

            {/* Trust strip */}
            <div className="reveal d-4" style={{
              display: 'flex', gap: 'var(--sp-6)', alignItems: 'center',
              paddingTop: 'var(--sp-5)', borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}>
              <div className="flex items-center gap-2" style={{ color: 'var(--ink-3)' }}>
                <ShieldCheck size={16} color="var(--green-500)" />
                <span className="body-xs bold">{lang === 'Tamil' ? 'தமிழ்நாடு அரசு' : 'Govt. of Tamil Nadu'}</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: 'var(--ink-3)' }}>
                <Languages size={16} color="var(--green-500)" />
                <span className="body-xs bold">தமிழ் + English</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: 'var(--ink-3)' }}>
                <FileCheck size={16} color="var(--green-500)" />
                <span className="body-xs bold">RTI-compliant</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Hero card — Live pulse */}
          <div className="reveal d-2" style={{ position: 'relative' }}>
            <div style={{
              background: 'var(--ink)', color: 'var(--ink-inverse)',
              borderRadius: 'var(--r-2xl)', padding: 'var(--sp-8)',
              boxShadow: 'var(--shadow-xl)', position: 'relative', overflow: 'hidden',
            }}>
              <KolamSVG size={180} opacity={0.06} />
              <div style={{ position: 'absolute', top: 0, right: 0 }}>
                <div className="live-badge" style={{ padding: '8px 14px', color: '#fecaca' }}>
                  <span className="live-dot" style={{ background: '#fecaca' }}></span>
                  <span style={{ color: '#fecaca' }}>Live now</span>
                </div>
              </div>

              <div className="label-sm" style={{ color: 'var(--ink-faint)', marginBottom: 'var(--sp-3)' }}>
                Statewide · Real-time
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem, 4vw, 3.4rem)',
                fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em',
                marginBottom: 'var(--sp-3)', color: '#fbd77a',
              }}>
                {liveFeed[tickerIndex].id}
              </div>
              <p className="body-sm" style={{ color: 'rgba(253,252,249,.7)', minHeight: '44px', marginBottom: 'var(--sp-5)' }}>
                {liveFeed[tickerIndex].text}
              </p>

              <div className="flex gap-4" style={{ paddingTop: 'var(--sp-4)', borderTop: '1px solid rgba(253,252,249,.1)' }}>
                <div>
                  <div className="mono" style={{ color: 'var(--ink-faint)', fontSize: '.65rem' }}>STATUS</div>
                  <div className="bold body-sm" style={{ color: liveFeed[tickerIndex].status === 'resolved' ? '#86efac' : '#fbbf24' }}>
                    {liveFeed[tickerIndex].status === 'resolved' ? 'RESOLVED' : 'IN PROGRESS'}
                  </div>
                </div>
                <div>
                  <div className="mono" style={{ color: 'var(--ink-faint)', fontSize: '.65rem' }}>UPDATED</div>
                  <div className="bold body-sm">{liveFeed[tickerIndex].time}</div>
                </div>
              </div>
            </div>

            {/* Mini floating stat card */}
            <div style={{
              position: 'absolute', bottom: '-20px', left: '-20px',
              background: 'var(--surface)', borderRadius: 'var(--r-lg)',
              padding: 'var(--sp-4)', boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center',
              maxWidth: '220px',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--r-md)',
                background: 'var(--green-50)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <TrendingUp size={20} color="var(--green-500)" />
              </div>
              <div>
                <div className="display-sm" style={{ color: 'var(--green-600)', fontSize: '1.4rem' }}>94.2%</div>
                <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>resolved within 7 days</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === IMPACT BAND === */}
      <section id="stats" className="section" style={{ background: 'var(--ink)', color: 'var(--ink-inverse)' }}>
        <div className="container">
          <div className="section-label reveal d-0" style={{ color: '#fbd77a' }}>
            Impact across Tamil Nadu
          </div>
          <h2 className="display-md reveal d-1" style={{ color: 'var(--ink-inverse)', marginBottom: 'var(--sp-12)' }}>
            By the numbers, <span className="editorial" style={{ color: 'var(--ink-faint)' }}>honestly.</span>
          </h2>

          <div className="grid-4">
            {[
              { v: '2,84,512', l: 'Reports filed', s: 'Across all 38 districts' },
              { v: '94.2%', l: 'Resolution rate', s: 'Within 7 days' },
              { v: '38', l: 'Districts active', s: 'From Chennai to Kanyakumari' },
              { v: '12,400', l: 'Officers on duty', s: 'Corporation + municipality + rural' },
            ].map((s, i) => (
              <div key={i} className={`reveal d-${i + 2}`} style={{
                borderTop: '1px solid rgba(253,252,249,.15)',
                paddingTop: 'var(--sp-5)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                  fontWeight: 800, letterSpacing: '-.03em', color: '#fbd77a', lineHeight: 1,
                }}>{s.v}</div>
                <div className="bold body-sm" style={{ color: 'var(--ink-inverse)', marginTop: '8px' }}>{s.l}</div>
                <div className="body-xs" style={{ color: 'var(--ink-faint)', marginTop: '4px' }}>{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section id="how" className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 'var(--sp-12)' }} className="how-grid">
            <div>
              <div className="section-label reveal d-0">The Process</div>
              <h2 className="display-md reveal d-1" style={{ marginBottom: 'var(--sp-4)' }}>
                From <span className="editorial">broken</span>
                <br />to <span className="grad-text-dark">fixed</span>, in 4 steps.
              </h2>
              <p className="body-lg reveal d-2" style={{ color: 'var(--ink-3)' }}>
                Built for citizens who don't have time, and officers who don't
                have patience for junk data.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-5)' }}>
              {[
                { n: '01', icon: Mic, t: 'Speak or type', d: 'Tell us what\'s broken in Tamil or English. Voice-to-text auto-translates.', color: 'var(--green-500)' },
                { n: '02', icon: MapPin, t: 'Pin the spot', d: 'GPS auto-detects location. Drop a pin or pick from map.', color: 'var(--terra-400)' },
                { n: '03', icon: Activity, t: 'Track live', d: 'Get a unique complaint ID. Watch it move through the system in real time.', color: 'var(--amber-500)' },
                { n: '04', icon: CheckCircle2, t: 'Confirm the fix', d: 'When the work is done, you verify with a photo. We close the loop.', color: 'var(--green-700)' },
              ].map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className={`card card-hover reveal d-${i + 2}`} style={{ padding: 'var(--sp-6)' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--sp-4)' }}>
                      <span className="mono bold" style={{ fontSize: '.7rem', color: 'var(--ink-muted)' }}>STEP {step.n}</span>
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--r-md)',
                        background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={18} color={step.color} />
                      </div>
                    </div>
                    <h3 className="display-sm" style={{ marginBottom: '8px', fontSize: '1.15rem' }}>{step.t}</h3>
                    <p className="body-sm" style={{ color: 'var(--ink-3)' }}>{step.d}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* === FOR CITIZENS vs OFFICERS === */}
      <section className="section" style={{ background: 'var(--bg-alt)' }}>
        <div className="container">
          <div className="section-label reveal d-0">For Everyone</div>
          <h2 className="display-md reveal d-1" style={{ marginBottom: 'var(--sp-12)', maxWidth: '700px' }}>
            Two sides. <span className="editorial">One mission.</span>
          </h2>

          <div className="grid-2" style={{ gap: 'var(--sp-6)' }}>
            {/* Citizen card */}
            <div className="card reveal d-2" style={{
              padding: 'var(--sp-8)', background: 'var(--surface)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'var(--green-50)', color: 'var(--green-600)',
                padding: '4px 10px', borderRadius: 'var(--r-full)',
                fontSize: '.68rem', fontWeight: 700, letterSpacing: '.06em',
                textTransform: 'uppercase', marginBottom: 'var(--sp-5)',
              }}>
                <Users size={11} /> For citizens
              </div>
              <h3 className="display-md" style={{ fontSize: '1.8rem', marginBottom: 'var(--sp-3)' }}>
                The fastest way to get your <span className="grad-text-dark">street fixed</span>.
              </h3>
              <p className="body-sm" style={{ color: 'var(--ink-3)', marginBottom: 'var(--sp-5)' }}>
                No paperwork. No waiting in line. No wondering if anyone read it.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--sp-6)' }}>
                {[
                  'Voice + photo + GPS in under 60 seconds',
                  'Tamil, English, and 8 more regional languages',
                  'Real-time tracking with SMS + push alerts',
                  'Verify the work yourself before it closes',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 body-sm">
                    <CheckCircle2 size={16} color="var(--green-500)" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onStart} className="btn btn-primary">
                File your first report <ArrowRight size={14} />
              </button>
            </div>

            {/* Officer card */}
            <div id="officers" className="card reveal d-3" style={{
              padding: 'var(--sp-8)', background: 'var(--ink)', color: 'var(--ink-inverse)',
              border: 'none', position: 'relative', overflow: 'hidden',
            }}>
              <KolamSVG size={200} opacity={0.05} />
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(251,215,122,.15)', color: '#fbd77a',
                padding: '4px 10px', borderRadius: 'var(--r-full)',
                fontSize: '.68rem', fontWeight: 700, letterSpacing: '.06em',
                textTransform: 'uppercase', marginBottom: 'var(--sp-5)',
              }}>
                <Building2 size={11} /> For officers
              </div>
              <h3 className="display-md" style={{ fontSize: '1.8rem', marginBottom: 'var(--sp-3)', color: 'var(--ink-inverse)' }}>
                A control room <span className="editorial" style={{ color: '#fbd77a' }}>that actually</span> helps.
              </h3>
              <p className="body-sm" style={{ color: 'var(--ink-faint)', marginBottom: 'var(--sp-5)' }}>
                Triage 200 complaints an hour. See the city from space.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--sp-6)' }}>
                {[
                  'Live satellite view of every issue, geo-clustered',
                  'One-tap severity tagging, AI auto-categorization',
                  'Bulk assign, escalate, or close with a single click',
                  'SLA timers, departmental performance, RTI exports',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 body-sm" style={{ color: 'var(--ink-inverse)' }}>
                    <Satellite size={16} color="#fbd77a" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onStart} className="btn btn-amber">
                Open officer portal <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* === VOICES (testimonial-style) === */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto var(--sp-12)' }}>
            <div className="section-label reveal d-0" style={{ justifyContent: 'center' }}>From the field</div>
            <h2 className="display-md reveal d-1">
              People across Tamil Nadu, <span className="editorial">talking.</span>
            </h2>
          </div>

          <div className="grid-3">
            {[
              { q: '"I reported a broken streetlight at 9 PM. By 6 AM the next day, the ward officer had marked it resolved. I got an SMS asking me to verify."', n: 'Lakshmi', p: 'Coimbatore · Citizen', i: Users },
              { q: '"We used to lose 40% of complaints in paper. Now every report is on the map. Field officers know exactly where to go."', n: 'Ramesh K.', p: 'Madurai Corp · Zonal Officer', i: Building2 },
              { q: '"My mother filed a complaint in Tamil by voice. Got an English acknowledgment back. She was so happy she called her whole street."', n: 'Vikram', p: 'Chennai · College student', i: Heart },
            ].map((t, i) => {
              const Icon = t.i;
              return (
                <div key={i} className={`card reveal d-${i + 2}`} style={{ padding: 'var(--sp-6)' }}>
                  <div className="editorial display-md" style={{
                    color: 'var(--green-500)', fontSize: '2rem', lineHeight: 1, marginBottom: 'var(--sp-3)',
                  }}>"</div>
                  <p className="body-sm" style={{ color: 'var(--ink-2)', marginBottom: 'var(--sp-5)', minHeight: '100px' }}>
                    {t.q}
                  </p>
                  <div className="flex items-center gap-3" style={{ paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--border)' }}>
                    <div className="avatar avatar-sm" style={{ background: 'var(--bg-alt)', color: 'var(--green-500)' }}>
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="bold body-sm">{t.n}</div>
                      <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>{t.p}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="section" style={{ background: 'var(--ink)', color: 'var(--ink-inverse)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="live-badge reveal d-0" style={{ justifyContent: 'center', color: '#86efac' }}>
            <span className="live-dot" style={{ background: '#86efac' }}></span>
            <span style={{ color: '#86efac' }}>1,247 reports resolved this week</span>
          </div>
          <h2 className="display-lg reveal d-1" style={{ color: 'var(--ink-inverse)', margin: 'var(--sp-5) auto var(--sp-6)', maxWidth: '800px' }}>
            Your city, <span className="editorial" style={{ color: '#fbd77a' }}>working as one.</span>
          </h2>
          <p className="body-lg reveal d-2" style={{ color: 'var(--ink-faint)', maxWidth: '600px', margin: '0 auto var(--sp-8)' }}>
            Join 2.8 lakh citizens and 12,400 officers who have made Tamil Nadu's
            civic services faster, fairer, and more transparent.
          </p>
          <div className="reveal d-3" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onStart} className="btn btn-amber btn-lg">
              <Sparkles size={16} /> Get started — it's free
              <ArrowRight size={16} />
            </button>
            <a href="#how" className="btn btn-white btn-lg">
              <Phone size={16} /> Talk to support
            </a>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer style={{ background: 'var(--bg-alt)', borderTop: '1px solid var(--border)', padding: 'var(--sp-8) 0' }}>
        <div className="container">
          <div className="grid-4">
            <div>
              <div className="flex items-center gap-3" style={{ marginBottom: 'var(--sp-3)' }}>
                <CrestLogo size={32} />
                <span className="display-sm" style={{ fontSize: '1.1rem' }}>CivicPulse</span>
              </div>
              <p className="body-xs" style={{ color: 'var(--ink-muted)', maxWidth: '240px' }}>
                An AI-native civic platform by the Government of Tamil Nadu.
              </p>
            </div>
            <div>
              <div className="label-sm" style={{ marginBottom: 'var(--sp-3)' }}>Platform</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a className="body-sm" style={{ color: 'var(--ink-2)' }} href="#how">How it works</a>
                <a className="body-sm" style={{ color: 'var(--ink-2)' }} href="#stats">Impact</a>
                <a className="body-sm" style={{ color: 'var(--ink-2)' }}>Languages</a>
                <a className="body-sm" style={{ color: 'var(--ink-2)' }}>API & Data</a>
              </div>
            </div>
            <div>
              <div className="label-sm" style={{ marginBottom: 'var(--sp-3)' }}>For Government</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a className="body-sm" style={{ color: 'var(--ink-2)' }}>Officer login</a>
                <a className="body-sm" style={{ color: 'var(--ink-2)' }}>RTI & Transparency</a>
                <a className="body-sm" style={{ color: 'var(--ink-2)' }}>District dashboards</a>
                <a className="body-sm" style={{ color: 'var(--ink-2)' }}>Vendor onboarding</a>
              </div>
            </div>
            <div>
              <div className="label-sm" style={{ marginBottom: 'var(--sp-3)' }}>Help</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a className="body-sm" style={{ color: 'var(--ink-2)' }}>Contact</a>
                <a className="body-sm" style={{ color: 'var(--ink-2)' }}>Privacy</a>
                <a className="body-sm" style={{ color: 'var(--ink-2)' }}>Accessibility</a>
                <a className="body-sm" style={{ color: 'var(--ink-2)' }}>Status</a>
              </div>
            </div>
          </div>
          <div className="divider"></div>
          <div className="flex justify-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>
              © 2026 Government of Tamil Nadu · e-Governance IT Department
            </div>
            <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>
              Built with civic intent, by the people, for the people.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}