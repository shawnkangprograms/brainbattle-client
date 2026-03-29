import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { playSound } from '../utils/sounds.js';
import Navbar from '../components/Navbar.jsx';
import styles from './ResultsPage.module.css';

export default function ResultsPage() {
  const { roomCode } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [revealed, setRevealed] = useState(false);

  const finalRanking = state?.finalRanking || [];
  const myResult = finalRanking.find(p => p.username === user?.username);
  const top3 = finalRanking.slice(0, 3);

  useEffect(() => {
    playSound('win');
    setTimeout(() => setRevealed(true), 300);
  }, []);

  const getRankColor = (rank) => {
    if (rank === 1) return 'var(--gold)';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return 'var(--text-secondary)';
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.bg} />

      <header className={styles.header}>
        <div className={styles.logoText}>🧠 BRAIN<span>BATTLE</span></div>
        <div className={styles.roomCode}>ROOM: {roomCode}</div>
      </header>

      <main className={styles.main}>
        {/* Title */}
        <div className={styles.titleSection}>
          <div className={styles.tag}>BATTLE COMPLETE</div>
          <h1 className={styles.title}>FINAL RESULTS</h1>
          {myResult && (
            <div className={styles.myResult}>
              You finished <span style={{ color: getRankColor(myResult.rank) }}>{getRankEmoji(myResult.rank)}</span>
              {' '}with <span className={styles.highlight}>{myResult.score.toLocaleString()} pts</span>
            </div>
          )}
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <div className={styles.podium}>
            {/* 2nd */}
            {top3[1] && (
              <div className={`${styles.podiumPlace} ${styles.p2} ${revealed ? styles.podiumVisible : ''}`}>
                <div className={styles.podiumAvatar}>🥈</div>
                <div className={styles.podiumName}>{top3[1].username}</div>
                <div className={styles.podiumScore}>{top3[1].score.toLocaleString()}</div>
                <div className={styles.podiumBlock} style={{ height: '80px', background: 'rgba(192,192,192,0.2)', border: '1px solid rgba(192,192,192,0.4)' }}>
                  <span>2ND</span>
                </div>
              </div>
            )}

            {/* 1st */}
            {top3[0] && (
              <div className={`${styles.podiumPlace} ${styles.p1} ${revealed ? styles.podiumVisible : ''}`}>
                <div className={styles.crown}>👑</div>
                <div className={styles.podiumAvatar} style={{ fontSize: '48px' }}>🥇</div>
                <div className={styles.podiumName} style={{ color: 'var(--gold)', fontSize: '20px' }}>{top3[0].username}</div>
                <div className={styles.podiumScore} style={{ fontSize: '28px', color: 'var(--gold)' }}>{top3[0].score.toLocaleString()}</div>
                <div className={styles.podiumBlock} style={{ height: '120px', background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', boxShadow: '0 0 30px rgba(255,215,0,0.3)' }}>
                  <span style={{ color: 'var(--gold)' }}>1ST</span>
                </div>
              </div>
            )}

            {/* 3rd */}
            {top3[2] && (
              <div className={`${styles.podiumPlace} ${styles.p3} ${revealed ? styles.podiumVisible : ''}`}>
                <div className={styles.podiumAvatar}>🥉</div>
                <div className={styles.podiumName}>{top3[2].username}</div>
                <div className={styles.podiumScore}>{top3[2].score.toLocaleString()}</div>
                <div className={styles.podiumBlock} style={{ height: '60px', background: 'rgba(205,127,50,0.2)', border: '1px solid rgba(205,127,50,0.4)' }}>
                  <span>3RD</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full leaderboard */}
        <div className={styles.leaderboard}>
          <h3 className={styles.lbTitle}>📊 FULL RANKINGS</h3>
          <div className={styles.lbTable}>
            <div className={styles.lbHeader}>
              <span>RANK</span><span>PLAYER</span><span>SCORE</span><span>CORRECT</span><span>ACCURACY</span><span>BEST STREAK</span>
            </div>
            {finalRanking.map((p, i) => (
              <div
                key={p.username}
                className={`${styles.lbRow} ${p.username === user?.username ? styles.myLbRow : ''}`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <span style={{ color: getRankColor(p.rank), fontFamily: 'var(--font-display)', fontWeight: 900 }}>
                  {getRankEmoji(p.rank)}
                </span>
                <span className={styles.lbName}>{p.username}</span>
                <span className={styles.lbScore}>{p.score.toLocaleString()}</span>
                <span>{p.correct}/{p.total}</span>
                <span>{p.accuracy}%</span>
                <span>🔥{p.bestStreak}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => navigate('/')}>
            ⚡ NEW BATTLE
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate('/leaderboard')}>
            🏆 GLOBAL LEADERBOARD
          </button>
        </div>
      </main>
    </div>
  );
}
