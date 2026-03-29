import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { playSound } from '../utils/sounds.js';
import toast from 'react-hot-toast';
import styles from './GamePage.module.css';

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

export default function GamePage() {
  const { roomCode } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion]         = useState(null);
  const [answers, setAnswers]           = useState([]);
  const [selected, setSelected]         = useState(null);
  const [revealed, setRevealed]         = useState(null);
  const [timeLeft, setTimeLeft]         = useState(0);
  const [totalTime, setTotalTime]       = useState(15);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [score, setScore]               = useState(0);
  const [streak, setStreak]             = useState(0);
  const [leaderboard, setLeaderboard]   = useState([]);
  const [showResults, setShowResults]   = useState(false);
  const [lastPoints, setLastPoints]     = useState(null);
  const [isHost, setIsHost]             = useState(false);
  const [messages, setMessages]         = useState([]);
  const [chatInput, setChatInput]       = useState('');

  // Use a REF for elimination so it persists across question resets and never gets wiped
  const eliminatedRef = useRef(false);
  const [isEliminated, setIsEliminated] = useState(false);

  const chatRef  = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Remove any existing listeners first to prevent duplicates (React StrictMode / remounts)
    socket.off('question');
    socket.off('answer_result');
    socket.off('eliminated');
    socket.off('player_eliminated');
    socket.off('question_results');
    socket.off('game_over');
    socket.off('host_transferred');
    socket.off('kicked');
    socket.off('new_message');

    socket.on('question', (data) => {
      // Only reset question UI — never reset elimination state
      setQuestion(data.question);
      setAnswers(data.answers);
      setTotalTime(data.timerSeconds);
      setTimeLeft(data.timerSeconds);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setSelected(null);
      setRevealed(null);
      setLastPoints(null);
      setShowResults(false);
      playSound('questionReveal');
      startTimer(data.timerSeconds);
    });

    socket.on('answer_result', ({ correct, points, timeBonus, streakBonus, streak: s, correctAnswer }) => {
      clearInterval(timerRef.current);
      if (correct) {
        setScore(prev => prev + points);
        setStreak(s);
        setLastPoints(points);
        playSound('correct');
      } else {
        setStreak(0);
        setLastPoints(0);
        setRevealed(correctAnswer);
        playSound('wrong');
      }
    });

    // Only fires when the server explicitly decides this player is eliminated (wrong answer in SD)
    socket.on('eliminated', ({ correctAnswer }) => {
      eliminatedRef.current = true;
      setIsEliminated(true);
      setRevealed(correctAnswer);
      playSound('eliminated');
      toast.error('💀 ELIMINATED! Wrong answer in Sudden Death.', { duration: 4000 });
    });

    socket.on('player_eliminated', ({ username }) => {
      if (username !== user?.username) {
        toast(`💀 ${username} was eliminated!`, { duration: 2500 });
      }
    });

    socket.on('question_results', ({ correctAnswer, leaderboard: lb }) => {
      setRevealed(correctAnswer);
      setLeaderboard(lb);
      setShowResults(true);
      clearInterval(timerRef.current);
    });

    socket.on('game_over', ({ finalRanking }) => {
      clearInterval(timerRef.current);
      navigate(`/results/${roomCode}`, { state: { finalRanking } });
    });

    socket.on('host_transferred', () => setIsHost(true));

    socket.on('kicked', () => {
      toast.error('You were kicked from the room');
      navigate('/');
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev.slice(-50), msg]);
    });

    return () => {
      socket.off('question');
      socket.off('answer_result');
      socket.off('eliminated');
      socket.off('player_eliminated');
      socket.off('question_results');
      socket.off('game_over');
      socket.off('host_transferred');
      socket.off('kicked');
      socket.off('new_message');
      clearInterval(timerRef.current);
    };
  }, [socket, navigate, roomCode, user]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const startTimer = (seconds) => {
    clearInterval(timerRef.current);
    let t = seconds;
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 3 && t > 0) playSound(t === 1 ? 'urgentTick' : 'tick');
      if (t <= 0) clearInterval(timerRef.current);
    }, 1000);
  };

  const selectAnswer = (answer) => {
    // Block if already answered OR if eliminated
    if (selected || eliminatedRef.current) return;
    setSelected(answer);
    socket.emit('submit_answer', { roomCode, answer });
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    socket.emit('send_message', { roomCode, username: user.username, message: chatInput });
    setChatInput('');
  };

  const timerPercent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const timerColor   = timeLeft <= 3 ? 'var(--red)' : timeLeft <= 7 ? 'var(--gold)' : 'var(--cyan)';
  const progress     = totalQuestions > 0 ? (questionIndex / totalQuestions) * 100 : 0;

  const getAnswerState = (ans) => {
    if (revealed) {
      if (ans === revealed)                return 'correct';
      if (ans === selected && ans !== revealed) return 'wrong';
      return 'dimmed';
    }
    if (!selected)           return 'default';
    if (ans === selected)    return 'pending';
    return 'dimmed';
  };

  return (
    <div className={styles.container}>
      {/* Top bar */}
      <header className={styles.topBar}>
        <div className={styles.progress}>
          <div className={styles.progressLabel}>Q{questionIndex + 1} / {totalQuestions}</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className={styles.timerWrap}>
          <svg className={styles.timerRing} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" className={styles.timerBg} />
            <circle
              cx="50" cy="50" r="45"
              className={styles.timerArc}
              style={{
                strokeDasharray: '283',
                strokeDashoffset: `${283 - (283 * timerPercent) / 100}`,
                stroke: timerColor,
              }}
            />
          </svg>
          <span className={styles.timerNum} style={{ color: timerColor }}>{Math.max(0, timeLeft)}</span>
        </div>

        <div className={styles.scoreBox}>
          <span className={styles.scoreLabel}>SCORE</span>
          <span className={styles.scoreVal}>{score.toLocaleString()}</span>
          {streak > 1 && <span className={styles.streakBadge}>🔥 {streak}x</span>}
        </div>
      </header>

      <div className={styles.layout}>
        <main className={styles.gameArea}>

          {/* Eliminated banner — shown above questions, doesn't hide the game */}
          {isEliminated && (
            <div className={styles.eliminatedBanner}>
              <span className={styles.eliminatedIcon}>💀</span>
              <div>
                <div className={styles.eliminatedTitle}>YOU'VE BEEN ELIMINATED</div>
                <div className={styles.eliminatedSub}>Wrong answer in Sudden Death — watch the rest of the battle!</div>
              </div>
              <div className={styles.eliminatedScore}>{score.toLocaleString()} pts</div>
            </div>
          )}

          {/* Question card */}
          {question && (
            <div className={styles.questionCard} key={questionIndex}>
              <div className={styles.questionMeta}>
                <span className={styles.questionCat}>{question.category || 'Trivia'}</span>
                {lastPoints !== null && (
                  <div className={`${styles.pointsFlash} ${lastPoints > 0 ? styles.pointsPos : styles.pointsNeg}`}>
                    {lastPoints > 0 ? `+${lastPoints}` : '✗ WRONG'}
                  </div>
                )}
              </div>
              <h2 className={styles.questionText}>{question}</h2>
            </div>
          )}

          {/* Answer buttons */}
          <div className={styles.answersGrid}>
            {answers.map((ans, i) => {
              const state = getAnswerState(ans);
              return (
                <button
                  key={ans}
                  className={`${styles.answerBtn} ${styles[`ans_${state}`]}`}
                  onClick={() => selectAnswer(ans)}
                  disabled={!!selected || isEliminated}
                >
                  <span className={styles.answerLabel}>{ANSWER_LABELS[i]}</span>
                  <span className={styles.answerText}>{ans}</span>
                  {state === 'correct' && <span className={styles.answerIcon}>✓</span>}
                  {state === 'wrong'   && <span className={styles.answerIcon}>✗</span>}
                </button>
              );
            })}
          </div>

          {/* Mini leaderboard after question */}
          {showResults && leaderboard.length > 0 && (
            <div className={styles.miniLB}>
              <h3 className={styles.miniLBTitle}>⚡ STANDINGS</h3>
              <div className={styles.miniLBList}>
                {leaderboard.slice(0, 5).map((p, i) => (
                  <div key={p.username} className={`${styles.miniLBRow} ${p.username === user?.username ? styles.myRow : ''}`}>
                    <span className={styles.miniLBRank}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <span className={styles.miniLBName}>{p.username}</span>
                    <span className={styles.miniLBScore}>{p.score.toLocaleString()}</span>
                    {p.eliminated && <span>💀</span>}
                  </div>
                ))}
              </div>
              <p className={styles.nextHint}>Next question coming up…</p>
            </div>
          )}

          {/* Host controls */}
          {isHost && (
            <div className={styles.hostControls}>
              <button className={styles.hostBtn} onClick={() => socket.emit('skip_question', { roomCode })}>⏭ Skip</button>
              <button className={`${styles.hostBtn} ${styles.hostBtnDanger}`} onClick={() => socket.emit('end_game', { roomCode })}>🔴 End Game</button>
            </div>
          )}
        </main>

        {/* Chat */}
        <aside className={styles.chatSidebar}>
          <div className={styles.chatCard}>
            <h3 className={styles.chatTitle}>💬 LIVE CHAT</h3>
            <div className={styles.chatMessages} ref={chatRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`${styles.chatMsg} ${msg.username === user?.username ? styles.myMsg : ''}`}>
                  <span className={styles.chatUser}>{msg.username}</span>
                  <span className={styles.chatText}>{msg.message}</span>
                </div>
              ))}
              {messages.length === 0 && <div className={styles.chatEmpty}>No messages yet</div>}
            </div>
            <div className={styles.chatInputRow}>
              <input
                className={styles.chatInput}
                placeholder="Message…"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                maxLength={80}
              />
              <button className={styles.chatSend} onClick={sendMessage}>→</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
