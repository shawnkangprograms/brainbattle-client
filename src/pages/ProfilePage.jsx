import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import Navbar from '../components/Navbar.jsx';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalRank, setGlobalRank] = useState(null);

  useEffect(() => {
    if (!user || user.isGuest) { navigate('/auth'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('bb_token');
      const [meRes, lbRes, gamesRes] = await Promise.all([
        api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/leaderboard/global'),
        api.get('/api/leaderboard/recent'),
      ]);

      setStats(meRes.data.user.stats);

      const lb = lbRes.data.leaderboard;
      const myRank = lb.find(p => p.username === user.username);
      setGlobalRank(myRank?.rank || null);

      const myGames = gamesRes.data.games
        .filter(g => g.players.some(p => p.username === user.username))
        .slice(0, 10);
      setRecentGames(myGames);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const accuracy = stats?.totalAnswers > 0
    ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100) : 0;
  const winRate = stats?.totalGames > 0
    ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0;

  const achievements = [
    { id: 'first_game', icon: '🎮', label: 'First Battle', desc: 'Played your first game', earned: stats?.totalGames >= 1 },
    { id: 'winner', icon: '🏆', label: 'Victory!', desc: 'Won your first game', earned: stats?.totalWins >= 1 },
    { id: 'streak5', icon: '🔥', label: 'On Fire', desc: 'Got a 5x answer streak', earned: stats?.bestStreak >= 5 },
    { id: 'streak10', icon: '⚡', label: 'Lightning', desc: 'Got a 10x answer streak', earned: stats?.bestStreak >= 10 },
    { id: 'games10', icon: '🎯', label: 'Veteran', desc: 'Played 10 games', earned: stats?.totalGames >= 10 },
    { id: 'games50', icon: '💀', label: 'Obsessed', desc: 'Played 50 games', earned: stats?.totalGames >= 50 },
    { id: 'score10k', icon: '💰', label: 'High Scorer', desc: 'Earned 10,000 total points', earned: stats?.totalScore >= 10000 },
    { id: 'accuracy80', icon: '🎓', label: 'Sharp Mind', desc: '80%+ accuracy overall', earned: accuracy >= 80 },
  ];

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            Loading profile...
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className={styles.hero}>
              <div className={styles.avatar}>{user.username[0].toUpperCase()}</div>
              <div className={styles.heroInfo}>
                <h1 className={styles.username}>{user.username}</h1>
                <div className={styles.heroBadges}>
                  <span className={styles.badge}>{user.email}</span>
                  {globalRank && <span className={`${styles.badge} ${styles.rankBadge}`}>🏆 Global Rank #{globalRank}</span>}
                  <span className={`${styles.badge} ${styles.memberBadge}`}>Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className={styles.statsGrid}>
              {[
                { label: 'Total Score', value: (stats?.totalScore || 0).toLocaleString(), icon: '💎', color: 'cyan' },
                { label: 'Games Played', value: stats?.totalGames || 0, icon: '🎮', color: 'purple' },
                { label: 'Wins', value: stats?.totalWins || 0, icon: '🏆', color: 'gold' },
                { label: 'Win Rate', value: `${winRate}%`, icon: '📈', color: 'green' },
                { label: 'Accuracy', value: `${accuracy}%`, icon: '🎯', color: 'cyan' },
                { label: 'Best Streak', value: stats?.bestStreak || 0, icon: '🔥', color: 'red' },
                { label: 'Correct Answers', value: stats?.correctAnswers || 0, icon: '✅', color: 'green' },
                { label: 'Global Rank', value: globalRank ? `#${globalRank}` : 'Unranked', icon: '🌍', color: 'gold' },
              ].map(s => (
                <div key={s.label} className={`${styles.statCard} ${styles[`stat_${s.color}`]}`}>
                  <span className={styles.statIcon}>{s.icon}</span>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Achievements */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>🏅 Achievements</h2>
              <div className={styles.achievementsGrid}>
                {achievements.map(a => (
                  <div key={a.id} className={`${styles.achievement} ${a.earned ? styles.earned : styles.locked}`}>
                    <span className={styles.achIcon}>{a.earned ? a.icon : '🔒'}</span>
                    <div>
                      <div className={styles.achLabel}>{a.label}</div>
                      <div className={styles.achDesc}>{a.desc}</div>
                    </div>
                    {a.earned && <span className={styles.earnedCheck}>✓</span>}
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Games */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>📜 Recent Games</h2>
              {recentGames.length === 0 ? (
                <div className={styles.empty}>
                  <p>No games yet. <button className={styles.playLink} onClick={() => navigate('/')}>Play your first battle!</button></p>
                </div>
              ) : (
                <div className={styles.gamesTable}>
                  <div className={styles.gamesHeader}>
                    <span>Mode</span><span>Category</span><span>Rank</span>
                    <span>Score</span><span>Accuracy</span><span>Date</span>
                  </div>
                  {recentGames.map((g, i) => {
                    const me = g.players.find(p => p.username === user.username);
                    return (
                      <div key={i} className={styles.gameRow}>
                        <span className={`${styles.modeTag} ${g.mode === 'sudden_death' ? styles.sdMode : styles.classicMode}`}>
                          {g.mode === 'sudden_death' ? '💀 SD' : '⚡ Classic'}
                        </span>
                        <span className={styles.gameCategory}>{g.category || 'Mixed'}</span>
                        <span className={`${styles.rankNum} ${me?.rank === 1 ? styles.rank1 : ''}`}>
                          {me?.rank === 1 ? '🥇' : me?.rank === 2 ? '🥈' : me?.rank === 3 ? '🥉' : `#${me?.rank}`}
                        </span>
                        <span className={styles.gameScore}>{(me?.score || 0).toLocaleString()}</span>
                        <span>{me?.totalAnswers > 0 ? Math.round((me.correctAnswers / me.totalAnswers) * 100) : 0}%</span>
                        <span className={styles.gameDate}>{new Date(g.playedAt).toLocaleDateString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
