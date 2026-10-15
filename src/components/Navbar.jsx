import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  Brain, Zap, Trophy, Settings, Sun, Moon, User,
  LogOut, Menu, X, ChevronDown,
} from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout }          = useAuth();
  const { connected }             = useSocket();
  const { theme, toggleTheme }    = useTheme();
  const navigate                  = useNavigate();
  const location                  = useLocation();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef                   = useRef(null);
  const mobileRef                 = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <nav className={styles.nav}>
      {/* Logo */}
      <Link to="/" className={styles.logo}>
        <Brain size={22} className={styles.logoIcon} />
        <span className={styles.logoText}>BRAIN<span className={styles.logoAccent}>BATTLE</span></span>
      </Link>

      {/* Desktop nav links */}
      <div className={styles.links}>
        <Link to="/" className={`${styles.link} ${isActive('/') ? styles.active : ''}`}>
          <Zap size={14} /> Play
        </Link>
        <Link to="/leaderboard" className={`${styles.link} ${isActive('/leaderboard') ? styles.active : ''}`}>
          <Trophy size={14} /> Rankings
        </Link>
        {user && !user.isGuest && (
          <Link to="/admin" className={`${styles.link} ${isActive('/admin') ? styles.active : ''}`}>
            <Settings size={14} /> Admin
          </Link>
        )}
      </div>

      {/* Right section */}
      <div className={styles.right}>
        {/* Connection status */}
        <div className={`${styles.status} ${connected ? styles.online : styles.offline}`}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>{connected ? 'Online' : 'Offline'}</span>
        </div>

        {/* Theme toggle */}
        <button className={styles.themeBtn} onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User menu (desktop) */}
        {user ? (
          <div className={styles.userMenu} ref={menuRef}>
            {/* Added data-testid="user-menu-btn" to the main user button */}
            <button 
              className={styles.userBtn} 
              onClick={() => setMenuOpen(o => !o)}
              data-testid="user-menu-btn"
            >
              <div className={styles.userAvatar}>{user.username[0].toUpperCase()}</div>
              {/* Added data-testid="nav-username" to the name span */}
              <span className={styles.userName} data-testid="nav-username">{user.username}</span>
              {user.isGuest && <span className={styles.guestTag}>GUEST</span>}
              <ChevronDown size={12} className={`${styles.chevron} ${menuOpen ? styles.chevronUp : ''}`} />
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
                    <button className={styles.dropdownItem} onClick={() => { navigate('/profile'); setMenuOpen(false); }}>
                      <User size={14} /> My Profile
                    </button>
                    <button className={styles.dropdownItem} onClick={() => { navigate('/settings'); setMenuOpen(false); }}>
                      <Settings size={14} /> Settings
                    </button>
                    <div className={styles.dropdownDivider} />
                  </>
                )}
                <button className={styles.dropdownItem} onClick={() => { navigate('/leaderboard'); setMenuOpen(false); }}>
                  <Trophy size={14} /> Leaderboard
                </button>
                <button className={styles.dropdownItem} onClick={() => { toggleTheme(); setMenuOpen(false); }}>
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <div className={styles.dropdownDivider} />
                {/* Added data-testid="logout-btn" here */}
                <button 
                  className={`${styles.dropdownItem} ${styles.dropdownLogout}`} 
                  onClick={handleLogout}
                  data-testid="logout-btn"
                >
                  <LogOut size={14} /> {user.isGuest ? 'Exit Guest' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/auth" className={styles.signInBtn}>Sign In</Link>
        )}

        {/* Mobile hamburger */}
        <div className={styles.mobileMenuWrap} ref={mobileRef}>
          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Open menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {mobileOpen && (
            <div className={styles.mobileMenu}>
              <Link to="/" className={`${styles.mobileLink} ${isActive('/') ? styles.mobileLinkActive : ''}`}>
                <Zap size={16} /> Play
              </Link>
              <Link to="/leaderboard" className={`${styles.mobileLink} ${isActive('/leaderboard') ? styles.mobileLinkActive : ''}`}>
                <Trophy size={16} /> Rankings
              </Link>
              {user && !user.isGuest && (
                <Link to="/admin" className={`${styles.mobileLink} ${isActive('/admin') ? styles.mobileLinkActive : ''}`}>
                  <Settings size={16} /> Admin
                </Link>
              )}
              {user && !user.isGuest && (
                <>
                  <div className={styles.mobileDivider} />
                  <button className={styles.mobileLink} onClick={() => { navigate('/profile'); setMobileOpen(false); }}>
                    <User size={16} /> My Profile
                  </button>
                  <button className={styles.mobileLink} onClick={() => { navigate('/settings'); setMobileOpen(false); }}>
                    <Settings size={16} /> Settings
                  </button>
                </>
              )}
              <div className={styles.mobileDivider} />
              <button className={styles.mobileLink} onClick={() => { toggleTheme(); setMobileOpen(false); }}>
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              {user ? (
                <button className={`${styles.mobileLink} ${styles.mobileLinkDanger}`} onClick={handleLogout}>
                  <LogOut size={16} /> {user.isGuest ? 'Exit Guest' : 'Sign Out'}
                </button>
              ) : (
                <Link to="/auth" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                  <User size={16} /> Sign In
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
