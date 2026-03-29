import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoIcon}>🧠</span>
        <span className={styles.logoText}>BRAIN<span className={styles.logoAccent}>BATTLE</span></span>
      </Link>

      <div className={styles.links}>
        <Link to="/" className={`${styles.link} ${isActive('/') ? styles.active : ''}`}><span>⚡</span> Play</Link>
        <Link to="/leaderboard" className={`${styles.link} ${isActive('/leaderboard') ? styles.active : ''}`}><span>🏆</span> Rankings</Link>
        {user && !user.isGuest && (
          <Link to="/admin" className={`${styles.link} ${isActive('/admin') ? styles.active : ''}`}><span>⚙</span> Admin</Link>
        )}
      </div>

      <div className={styles.right}>
        <div className={`${styles.status} ${connected ? styles.online : styles.offline}`}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>{connected ? 'Online' : 'Offline'}</span>
        </div>

        <button className={styles.themeBtn} onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user ? (
          <div className={styles.userMenu} ref={menuRef}>
            <button className={styles.userBtn} onClick={() => setMenuOpen(o => !o)}>
              <div className={styles.userAvatar}>{user.username[0].toUpperCase()}</div>
              <span className={styles.userName}>{user.username}</span>
              {user.isGuest && <span className={styles.guestTag}>GUEST</span>}
              <span className={`${styles.chevron} ${menuOpen ? styles.chevronUp : ''}`}>▾</span>
            </button>

            {menuOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownAvatar}>{user.username[0].toUpperCase()}</div>
                  <div>
                    <div className={styles.dropdownName}>{user.username}</div>
                    <div className={styles.dropdownRole}>{user.isGuest ? 'Guest Player' : 'Registered Player'}</div>
                  </div>
                </div>
                <div className={styles.dropdownDivider} />
                {!user.isGuest && (
                  <>
                    <button className={styles.dropdownItem} onClick={() => { navigate('/profile'); setMenuOpen(false); }}>👤 My Profile</button>
                    <button className={styles.dropdownItem} onClick={() => { navigate('/settings'); setMenuOpen(false); }}>⚙ Settings</button>
                    <div className={styles.dropdownDivider} />
                  </>
                )}
                <button className={styles.dropdownItem} onClick={() => { navigate('/leaderboard'); setMenuOpen(false); }}>🏆 Leaderboard</button>
                <button className={styles.dropdownItem} onClick={() => { toggleTheme(); setMenuOpen(false); }}>
                  {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
                <div className={styles.dropdownDivider} />
                <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={handleLogout}>
                  🚪 {user.isGuest ? 'Exit Guest' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/auth" className={styles.signInBtn}>Sign In</Link>
        )}
      </div>
    </nav>
  );
}
