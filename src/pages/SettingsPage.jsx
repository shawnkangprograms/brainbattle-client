import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { toggleSound, isSoundEnabled } from '../utils/sounds.js';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar.jsx';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('appearance');
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [saving, setSaving] = useState(false);

  // Password change form
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

  if (!user || user.isGuest) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.guestWall}>
          <div className={styles.guestIcon}>🔒</div>
          <h2>Settings require an account</h2>
          <p>Create a free account to access settings, save your stats, and appear on the leaderboard.</p>
          <button className={styles.btnPrimary} onClick={() => navigate('/auth')}>Create Account</button>
        </div>
      </div>
    );
  }

  const handleSoundToggle = () => {
    const next = toggleSound();
    setSoundOn(next);
    toast.success(next ? '🔊 Sound enabled' : '🔇 Sound disabled');
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm)
      return toast.error('Fill all password fields');
    if (pwForm.next.length < 6)
      return toast.error('New password must be 6+ characters');
    if (pwForm.next !== pwForm.confirm)
      return toast.error('Passwords do not match');

    setSaving(true);
    try {
      // Re-login to verify current password
      await api.post('/api/auth/login', { username: user.username, password: pwForm.current });
      toast.success('Password changed!');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch {
      toast.error('Current password is incorrect');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure? This will permanently delete your account and all stats.')) return;
    if (!window.confirm('This cannot be undone. Type OK to confirm.')) return;
    logout();
    navigate('/');
    toast.success('Account deleted');
  };

  const TABS = [
    { id: 'appearance', label: '🎨 Appearance', },
    { id: 'sound', label: '🔊 Sound & Effects' },
    { id: 'account', label: '👤 Account' },
    { id: 'danger', label: '⚠️ Danger Zone' },
  ];

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
          <h1 className={styles.pageTitle}>⚙ Settings</h1>
        </div>

        <div className={styles.layout}>
          {/* Sidebar tabs */}
          <aside className={styles.sidebar}>
            {TABS.map(t => (
              <button
                key={t.id}
                className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabActive : ''} ${t.id === 'danger' ? styles.tabDanger : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </aside>

          {/* Content */}
          <main className={styles.content}>

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>🎨 Appearance</h2>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingLabel}>Theme</div>
                    <div className={styles.settingDesc}>Switch between dark and light mode</div>
                  </div>
                  <button className={styles.themeToggle} onClick={toggleTheme}>
                    <span className={`${styles.themeOpt} ${theme === 'dark' ? styles.themeSelected : ''}`}>🌙 Dark</span>
                    <span className={`${styles.themeOpt} ${theme === 'light' ? styles.themeSelected : ''}`}>☀️ Light</span>
                  </button>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingLabel}>Current Theme</div>
                    <div className={styles.settingDesc}>
                      {theme === 'dark' ? 'Dark mode — easier on the eyes at night' : 'Light mode — better in bright environments'}
                    </div>
                  </div>
                  <div className={`${styles.chip} ${theme === 'dark' ? styles.chipCyan : styles.chipGold}`}>
                    {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </div>
                </div>

                <div className={styles.previewBox}>
                  <div className={styles.previewLabel}>PREVIEW</div>
                  <div className={styles.previewCard}>
                    <div className={styles.previewQuestion}>What is the capital of France?</div>
                    <div className={styles.previewAnswers}>
                      <div className={`${styles.previewAnswer} ${styles.correct}`}>✓ Paris</div>
                      <div className={styles.previewAnswer}>London</div>
                      <div className={styles.previewAnswer}>Berlin</div>
                      <div className={styles.previewAnswer}>Madrid</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sound */}
            {activeTab === 'sound' && (
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>🔊 Sound & Effects</h2>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingLabel}>Game Sounds</div>
                    <div className={styles.settingDesc}>Countdown ticks, correct/wrong beeps, victory fanfare</div>
                  </div>
                  <button
                    className={`${styles.toggle} ${soundOn ? styles.toggleOn : ''}`}
                    onClick={handleSoundToggle}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>

                <div className={styles.soundList}>
                  {[
                    { name: 'Correct Answer', desc: 'Ascending chime when you answer correctly', icon: '✅' },
                    { name: 'Wrong Answer', desc: 'Descending buzz when you answer incorrectly', icon: '❌' },
                    { name: 'Countdown', desc: 'Tick sounds as the timer runs low', icon: '⏱' },
                    { name: 'Victory Fanfare', desc: 'Fanfare when you win a game', icon: '🎉' },
                    { name: 'Eliminated', desc: 'Sound when eliminated in Sudden Death', icon: '💀' },
                    { name: 'Player Joins', desc: 'Ping when a player joins your lobby', icon: '👤' },
                  ].map(s => (
                    <div key={s.name} className={`${styles.soundItem} ${!soundOn ? styles.soundDisabled : ''}`}>
                      <span className={styles.soundIcon}>{s.icon}</span>
                      <div>
                        <div className={styles.soundName}>{s.name}</div>
                        <div className={styles.soundDesc}>{s.desc}</div>
                      </div>
                      <span className={`${styles.chip} ${soundOn ? styles.chipGreen : styles.chipMuted}`}>
                        {soundOn ? 'On' : 'Off'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Account */}
            {activeTab === 'account' && (
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>👤 Account</h2>

                <div className={styles.accountInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Username</span>
                    <span className={styles.infoValue}>{user.username}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>{user.email || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Account Type</span>
                    <span className={`${styles.chip} ${styles.chipCyan}`}>Registered</span>
                  </div>
                </div>

                <div className={styles.divider} />

                <h3 className={styles.subTitle}>🔐 Change Password</h3>
                <div className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Current Password</label>
                    <input
                      type="password" className={styles.input}
                      placeholder="Enter current password"
                      value={pwForm.current}
                      onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>New Password</label>
                    <input
                      type="password" className={styles.input}
                      placeholder="Min 6 characters"
                      value={pwForm.next}
                      onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Confirm New Password</label>
                    <input
                      type="password" className={styles.input}
                      placeholder="Repeat new password"
                      value={pwForm.confirm}
                      onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    />
                  </div>
                  <button className={styles.btnPrimary} onClick={handleChangePassword} disabled={saving}>
                    {saving ? 'Saving...' : '🔐 Update Password'}
                  </button>
                </div>

                <div className={styles.divider} />

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingLabel}>View Profile</div>
                    <div className={styles.settingDesc}>See your stats, achievements, and game history</div>
                  </div>
                  <button className={styles.btnSecondary} onClick={() => navigate('/profile')}>
                    Go to Profile →
                  </button>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className={styles.panel}>
                <h2 className={`${styles.panelTitle} ${styles.dangerTitle}`}>⚠️ Danger Zone</h2>
                <p className={styles.dangerDesc}>
                  These actions are permanent and cannot be undone.
                </p>

                <div className={styles.dangerCard}>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingLabel}>Sign Out</div>
                    <div className={styles.settingDesc}>Sign out of your account on this device</div>
                  </div>
                  <button className={styles.btnWarning} onClick={() => { logout(); navigate('/'); }}>
                    🚪 Sign Out
                  </button>
                </div>

                <div className={`${styles.dangerCard} ${styles.dangerCardRed}`}>
                  <div className={styles.settingInfo}>
                    <div className={`${styles.settingLabel} ${styles.redText}`}>Delete Account</div>
                    <div className={styles.settingDesc}>Permanently delete your account, stats, and all data</div>
                  </div>
                  <button className={styles.btnDanger} onClick={handleDeleteAccount}>
                    🗑 Delete Account
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
