import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { playSound } from '../utils/sounds.js';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar.jsx';
import styles from './HomePage.module.css';

const CATEGORIES = [
  'General Knowledge', 'Science & Nature', 'History & Geography',
  'Pop Culture & Entertainment', 'Sports', 'Technology',
];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const MODES = [
  { id: 'classic', label: 'Classic', icon: '⚡', desc: '10 questions, timed answers, speed scoring' },
  { id: 'sudden_death', label: 'Sudden Death', icon: '💀', desc: 'One wrong answer and you\'re out' },
];

export default function HomePage() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [tab, setTab] = useState('home'); // home | create | join
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState('classic');
  const [category, setCategory] = useState('General Knowledge');
  const [difficulty, setDifficulty] = useState('medium');
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [questionCount, setQuestionCount] = useState(10);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate background particles
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 4,
      delay: Math.random() * 5,
    })));
  }, []);

  useEffect(() => {
    if (!socket) return;


    // Clear stale listeners
    socket.off('room_created');
    socket.off('room_joined');
    socket.off('error');

    socket.on('room_created', ({ roomCode, room }) => {
      playSound('gameStart');
      navigate(`/lobby/${roomCode}`, { state: { room, isHost: true } });
    });

    socket.on('room_joined', ({ roomCode, room }) => {
      playSound('playerJoined');
      navigate(`/lobby/${roomCode}`, { state: { room, isHost: room.host === socket.id } });
    });

    socket.on('error', ({ message }) => toast.error(message));

    return () => {
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('error');
    };
  }, [socket, navigate]);

  const handleCreate = () => {
    if (!user) return navigate('/auth');
    socket.emit('create_room', {
      username: user.username,
      userId: user.isGuest ? null : user.id,
      mode, category, difficulty,
      timerSeconds: parseInt(timerSeconds),
      questionCount: parseInt(questionCount),
    });
  };

  const handleJoin = () => {
    if (!user) return navigate('/auth');
    if (!joinCode.trim()) return toast.error('Enter a room code');
    socket.emit('join_room', {
      roomCode: joinCode.toUpperCase().trim(),
      username: user.username,
      userId: user.isGuest ? null : user.id,
    });
  };

  return (
    <div className={styles.container}>
      {/* Particles */}
      <div className={styles.particles}>
        {particles.map(p => (
          <div key={p.id} className={styles.particle} style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }} />
        ))}
      </div>

      {/* Grid overlay */}
      <div className={styles.grid} />

      <Navbar />

      {/* Main content */}
      <main className={styles.main}>
        {tab === 'home' && (
          <div className={styles.hero}>
            <div className={styles.heroTag}>MULTIPLAYER TRIVIA SHOWDOWN</div>
            <h1 className={styles.heroTitle}>
              TEST YOUR<br />
              <span className={styles.heroAccent}>KNOWLEDGE</span>
            </h1>
            <p className={styles.heroSub}>
              Up to 20 players. Real-time battles. No mercy.
            </p>
            <div className={styles.heroBtns}>
              <button className={styles.btnPrimary} onClick={() => { setTab('create'); playSound('tick'); }}>
                <span>⚡</span> CREATE ROOM
              </button>
              <button className={styles.btnSecondary} onClick={() => { setTab('join'); playSound('tick'); }}>
                <span>🎯</span> JOIN ROOM
              </button>
            </div>
            <div className={styles.stats}>
              <div className={styles.statItem}><span>20</span><label>MAX PLAYERS</label></div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}><span>6</span><label>CATEGORIES</label></div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}><span>2</span><label>GAME MODES</label></div>
            </div>
          </div>
        )}

        {tab === 'create' && (
          <div className={styles.panel}>
            <button className={styles.back} onClick={() => setTab('home')}>← BACK</button>
            <h2 className={styles.panelTitle}>⚡ CREATE ROOM</h2>

            {/* Mode selection */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>GAME MODE</label>
              <div className={styles.modeGrid}>
                {MODES.map(m => (
                  <button
                    key={m.id}
                    className={`${styles.modeCard} ${mode === m.id ? styles.modeActive : ''}`}
                    onClick={() => setMode(m.id)}
                  >
                    <span className={styles.modeIcon}>{m.icon}</span>
                    <span className={styles.modeLabel}>{m.label}</span>
                    <span className={styles.modeDesc}>{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>CATEGORY</label>
              <div className={styles.chipGrid}>
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    className={`${styles.chip} ${category === c ? styles.chipActive : ''}`}
                    onClick={() => setCategory(c)}
                  >{c}</button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>DIFFICULTY</label>
              <div className={styles.diffGrid}>
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    className={`${styles.diffBtn} ${styles[d]} ${difficulty === d ? styles.diffActive : ''}`}
                    onClick={() => setDifficulty(d)}
                  >{d.toUpperCase()}</button>
                ))}
              </div>
            </div>

            {/* Timer & Questions */}
            <div className={styles.sliderRow}>
              <div className={styles.sliderGroup}>
                <label className={styles.sectionLabel}>TIMER: <span className={styles.sliderVal}>{timerSeconds}s</span></label>
                <input type="range" min="5" max="30" step="5" value={timerSeconds}
                  onChange={e => setTimerSeconds(e.target.value)} className={styles.slider} />
                <div className={styles.sliderTicks}>
                  {[5, 10, 15, 20, 25, 30].map(v => <span key={v}>{v}s</span>)}
                </div>
              </div>
              <div className={styles.sliderGroup}>
                <label className={styles.sectionLabel}>QUESTIONS: <span className={styles.sliderVal}>{questionCount}</span></label>
                <input type="range" min="5" max="20" step="5" value={questionCount}
                  onChange={e => setQuestionCount(e.target.value)} className={styles.slider} />
                <div className={styles.sliderTicks}>
                  {[5, 10, 15, 20].map(v => <span key={v}>{v}</span>)}
                </div>
              </div>
            </div>

            <button className={styles.btnPrimary} onClick={handleCreate} style={{ width: '100%', marginTop: '8px' }}>
              ⚡ CREATE ROOM
            </button>
          </div>
        )}

        {tab === 'join' && (
          <div className={styles.panel}>
            <button className={styles.back} onClick={() => setTab('home')}>← BACK</button>
            <h2 className={styles.panelTitle}>🎯 JOIN ROOM</h2>
            <p className={styles.joinSub}>Enter the 6-character room code from your host</p>
            <input
              className={styles.codeInput}
              placeholder="ENTER CODE"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={6}
              autoFocus
            />
            <button className={styles.btnPrimary} onClick={handleJoin} style={{ width: '100%' }}>
              🎯 JOIN BATTLE
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
