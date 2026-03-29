import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const { login, register, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login'); // login | register | guest
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    if (!form.username || !form.password) return toast.error('Fill all fields');
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password) return toast.error('Fill all fields');
    if (form.password.length < 6) return toast.error('Password must be 6+ characters');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      toast.success('Account created!');
      navigate('/');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleGuest = async () => {
    if (!form.username) return toast.error('Enter a username');
    setLoading(true);
    try {
      await loginAsGuest(form.username);
      toast.success(`Playing as guest: ${form.username}`);
      navigate('/');
    } catch (e) {
      toast.error('Failed to continue as guest');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.container}>
      <div className={styles.bg} />
      <button className={styles.back} onClick={() => navigate('/')}>← BACK TO HOME</button>

      <div className={styles.card}>
        <div className={styles.logoRow}>
          <span>🧠</span>
          <span className={styles.logoText}>BRAIN<span>BATTLE</span></span>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`} onClick={() => setTab('login')}>LOGIN</button>
          <button className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`} onClick={() => setTab('register')}>REGISTER</button>
          <button className={`${styles.tab} ${tab === 'guest' ? styles.tabActive : ''}`} onClick={() => setTab('guest')}>GUEST</button>
        </div>

        {tab === 'login' && (
          <div className={styles.form}>
            <p className={styles.formSub}>Welcome back, warrior.</p>
            <input className={styles.input} placeholder="Username" value={form.username}
              onChange={e => set('username', e.target.value)} autoFocus />
            <input className={styles.input} type="password" placeholder="Password" value={form.password}
              onChange={e => set('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <button className={styles.btn} onClick={handleLogin} disabled={loading}>
              {loading ? 'LOGGING IN...' : '⚡ LOGIN'}
            </button>
          </div>
        )}

        {tab === 'register' && (
          <div className={styles.form}>
            <p className={styles.formSub}>Create your battle identity.</p>
            <input className={styles.input} placeholder="Username (2-20 chars)" value={form.username}
              onChange={e => set('username', e.target.value)} autoFocus />
            <input className={styles.input} type="email" placeholder="Email" value={form.email}
              onChange={e => set('email', e.target.value)} />
            <input className={styles.input} type="password" placeholder="Password (6+ chars)" value={form.password}
              onChange={e => set('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()} />
            <button className={styles.btn} onClick={handleRegister} disabled={loading}>
              {loading ? 'CREATING...' : '🔥 CREATE ACCOUNT'}
            </button>
          </div>
        )}

        {tab === 'guest' && (
          <div className={styles.form}>
            <p className={styles.formSub}>Jump in without an account. Stats won't be saved.</p>
            <input className={styles.input} placeholder="Pick a username" value={form.username}
              onChange={e => set('username', e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleGuest()} />
            <button className={`${styles.btn} ${styles.btnGuest}`} onClick={handleGuest} disabled={loading}>
              {loading ? 'ENTERING...' : '👤 PLAY AS GUEST'}
            </button>
            <p className={styles.guestNote}>
              Guest stats are not saved to the global leaderboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
