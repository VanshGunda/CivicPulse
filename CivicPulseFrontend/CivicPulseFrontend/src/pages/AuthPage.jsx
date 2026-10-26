import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, HeartHandshake, Leaf, LockKeyhole, Mail, MapPinned, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/client.js';
import { Button, Field, Alert } from '../components/UI.jsx';

const benefits = [
  'Track reports from submission to resolution',
  'See what is happening in your neighborhood',
  'Help local teams prioritize what matters',
];

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { signIn, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isRegister) await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      else await signIn({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, isRegister ? 'Unable to create your account.' : 'Email or password was not accepted.'));
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-page">
    <aside className="auth-story-panel">
      <div className="auth-story-inner">
        <Link to="/login" className="brand brand-light"><span className="brand-mark"><Leaf size={20} /></span><span>Civic<span>Pulse</span></span></Link>
        <div className="story-content">
          <div className="story-pill"><span className="pulse-dot" /> COMMUNITY · TRANSPARENCY · ACTION</div>
          <h1>Good neighborhoods<br /><em>happen together.</em></h1>
          <p className="story-lede">A clearer way to report local issues, follow progress, and make your corner of the world work better.</p>
          <div className="story-map-art" aria-label="Illustration of connected neighborhoods">
            <div className="map-blob blob-one" /><div className="map-blob blob-two" /><div className="map-blob blob-three" />
            <svg viewBox="0 0 520 286" role="img" aria-hidden="true"><path d="M22 171 C96 145 105 54 180 76 S277 191 336 142 S410 76 500 96" fill="none" stroke="rgba(213,239,222,.45)" strokeWidth="2" strokeDasharray="5 7"/><path d="M72 240 C125 190 197 211 234 153 S326 41 420 52" fill="none" stroke="rgba(213,239,222,.28)" strokeWidth="2" strokeDasharray="4 8"/><path d="M26 58 C101 95 100 176 184 185 S305 251 374 208 S455 185 497 224" fill="none" stroke="rgba(213,239,222,.28)" strokeWidth="2" strokeDasharray="4 8"/></svg>
            <span className="map-pin pin-a"><MapPinned size={18} /></span><span className="map-pin pin-b"><HeartHandshake size={17} /></span><span className="map-pin pin-c"><Check size={18} /></span>
            <div className="map-float-card"><span className="float-check"><Check size={14} /></span><div><strong>Streetlight fixed</strong><small>Resolved · 2 hours ago</small></div><span className="float-spark"><Sparkles size={17} /></span></div>
            <div className="map-float-stat"><Users size={16} /><strong>2.4k+</strong><small>neighbors involved</small></div>
          </div>
          <ul className="story-benefits">{benefits.map((item) => <li key={item}><span><Check size={13} /></span>{item}</li>)}</ul>
        </div>
        <div className="auth-story-foot"><span>Designed for real-world impact.</span><span>© 2026 CivicPulse</span></div>
      </div>
    </aside>
    <main className="auth-form-panel">
      <div className="auth-form-top"><span className="auth-mobile-brand"><span className="brand-mark"><Leaf size={18} /></span>Civic<span>Pulse</span></span><span className="security-note"><ShieldCheck size={15} /> Secure community access</span></div>
      <div className="auth-form-wrap">
        <div className="auth-welcome-icon">{isRegister ? <Users size={22} /> : <LockKeyhole size={22} />}</div>
        <div className="eyebrow">YOUR COMMUNITY, CONNECTED</div>
        <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
        <p className="auth-subtitle">{isRegister ? 'Join your neighbors and help create better public spaces.' : 'Sign in to see what’s changing in your neighborhood.'}</p>
        {error && <Alert type="error">{error}</Alert>}
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && <Field label="Full name"><div className="input-wrap"><Users size={17} /><input autoComplete="name" value={form.name} onChange={update('name')} placeholder="e.g. Asha Patil" required maxLength={80} /></div></Field>}
          <Field label="Email address"><div className="input-wrap"><Mail size={17} /><input type="email" autoComplete="email" value={form.email} onChange={update('email')} placeholder="you@example.com" required /></div></Field>
          <Field label="Password" hint={isRegister ? 'Use at least 8 characters.' : null}><div className="input-wrap"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={update('password')} placeholder={isRegister ? 'Create a strong password' : 'Enter your password'} required minLength={isRegister ? 8 : 1} maxLength={72} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></Field>
          <Button type="submit" className="auth-submit" size="lg" loading={busy}>{isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></Button>
        </form>
        <div className="auth-switch">{isRegister ? 'Already part of CivicPulse?' : 'New to your community hub?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></div>
        <div className="auth-privacy"><ShieldCheck size={15} /> Your information is protected and never displayed publicly.</div>
      </div>
      <div className="auth-form-footer"><span>Made for the places we call home.</span><Link to="/login">CivicPulse <span>↗</span></Link></div>
    </main>
  </div>;
}
