import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import Navbar from '../components/Navbar.jsx';
import styles from './LeaderboardPage.module.css';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/leaderboard/global')
      .then(res => setLeaderboard(res.data.leaderboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getRankColor = (rank) => {
    if (rank === 1) return 'var(--gold)';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return 'var(--text-secondary)';
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>← BACK</button>
        <div className={styles.logoText}>🧠 BRAIN<span>BATTLE</span></div>
        <div style={{ width: 80 }} />
      </header>

      <main className={styles.main}>
        <div className={styles.titleRow}>
          <div className={styles.tag}>ALL TIME</div>
          <h1 className={styles.title}>🏆 GLOBAL LEADERBOARD</h1>
          <p className={styles.sub}>Top players across all battles</p>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingDots}><span /><span /><span /></div>
            Loading champions...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className={styles.empty}>
            <div style={{ fontSize: 64 }}>🎮</div>
            <p>No ranked players yet. Play some games to appear here!</p>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>RANK</span>
              <span>PLAYER</span>
              <span>TOTAL SCORE</span>
              <span>WINS</span>
              <span>GAMES</span>
              <span>ACCURACY</span>
              <span>BEST STREAK</span>
            </div>
            {leaderboard.map((p, i) => (
              <div key={p.username} className={styles.tableRow} style={{ animationDelay: `${i * 0.04}s` }}>
                <span style={{ color: getRankColor(p.rank), fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18 }}>
                  {p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : `#${p.rank}`}
                </span>
                <span className={styles.playerName}>{p.username}</span>
                <span className={styles.score}>{p.totalScore.toLocaleString()}</span>
                <span>{p.totalWins}</span>
                <span>{p.totalGames}</span>
                <span>{p.accuracy}%</span>
                <span>🔥 {p.bestStreak}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
