import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { playSound } from '../utils/sounds.js';
import toast from 'react-hot-toast';
import {
  Skull, CheckCircle, XCircle, Zap, SkipForward, Square,
  MessageCircle, ChevronDown, Flame, Send, Trophy,
} from 'lucide-react';
import styles from './GamePage.module.css';

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

export default function GamePage() {
  const { roomCode } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [question, setQuestion]           = useState(null);
  const [answers, setAnswers]             = useState([]);
  const [selected, setSelected]           = useState(null);
  const [revealed, setRevealed]           = useState(null);
  const [timeLeft, setTimeLeft]           = useState(0);
  const [totalTime, setTotalTime]         = useState(15);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [score, setScore]                 = useState(0);
  const [streak, setStreak]               = useState(0);
  const [leaderboard, setLeaderboard]     = useState([]);
  const [showResults, setShowResults]     = useState(false);
  const [lastPoints, setLastPoints]       = useState(null);
  const [isHost, setIsHost]               = useState(location.state?.isHost || false);
  const [messages, setMessages]           = useState([]);
  const [chatInput, setChatInput]         = useState('');
  const [chatOpen, setChatOpen]           = useState(false);

  const eliminatedRef = useRef(false);
  const [isEliminated, setIsEliminated]   = useState(false);
  const currentQuestionIndexRef = useRef(0);

  const chatRef  = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Clean up old listeners to prevent duplicates
    const events = [
      'question', 'answer_result', 'eliminated', 'player_eliminated',
      'question_results', 'game_over', 'host_transferred', 'kicked',
      'new_message', 'reconnect_to_game', 'room_state'
    ];
    events.forEach(event => socket.off(event));

    socket.on('question', (data) => {
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
      currentQuestionIndexRef.current = data.questionIndex;
      playSound('questionReveal');
      startTimer(data.timerSeconds);
    });

    socket.on('answer_result', ({ correct, points, streak: s, correctAnswer }) => {
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

    socket.on('eliminated', ({ correctAnswer }) => {
      eliminatedRef.current = true;
      setIsEliminated(true);
      setRevealed(correctAnswer);
      playSound('eliminated');
      toast.error('ELIMINATED!', { duration: 4000 });
    });

    socket.on('player_eliminated', ({ username }) => {
      if (username !== user?.username) {
        toast(`${username} was eliminated!`, { duration: 2500 });
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

    socket.on('room_state', (data) => {
      if (user && (data.hostId === user._id || data.hostUsername === user.username)) {
        setIsHost(true);
      }
    });

    socket.on('kicked', () => {
      toast.error('You were kicked');
      navigate('/');
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev.slice(-50), msg]);
    });

    // Request current status to ensure host synchronization
    socket.emit('get_room_status', { roomCode }, (res) => {
      if (res && user && (res.hostId === user._id || res.host === user.username)) {
        setIsHost(true);
      }
    });

    return () => {
      events.forEach(event => socket.off(event));
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
    if (selected || eliminatedRef.current) return;
    setSelected(answer);
    socket.emit('submit_answer', { roomCode, answer, questionIndex: currentQuestionIndexRef.current });
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
      if (ans === revealed) return 'correct';
      if (ans === selected) return 'wrong';
      return 'dimmed';
    }
    if (!selected) return 'default';
    if (ans === selected) return 'pending';
    return 'dimmed';
  };

  const getRankLabel = (rank) => {
    if (rank === 1) return '1ST';
    if (rank === 2) return '2ND';
    if (rank === 3) return '3RD';
    return `#${rank}`;
  };

  return (
    <div className={styles.container}>
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
          <span className={styles.timerNum} style={{ color: timerColor }} data-testid="timer-display">
            {Math.max(0, timeLeft)}
          </span>
        </div>

        <div className={styles.scoreBox}>
          <span className={styles.scoreLabel}>SCORE</span>
          <span className={styles.scoreVal} data-testid="score-display">{score.toLocaleString()}</span>
          {streak > 1 && (
            <span className={styles.streakBadge}><Flame size={11} /> {streak}x</span>
          )}
        </div>

        <button className={`${styles.chatToggle} ${chatOpen ? styles.chatToggleActive : ''}`} onClick={() => setChatOpen(!chatOpen)}>
          <MessageCircle size={18} />
        </button>
      </header>

      <div className={styles.layout}>
        <main className={styles.gameArea}>
          {isEliminated && (
            <div className={styles.eliminatedBanner} data-testid="eliminated-banner">
              <Skull size={28} className={styles.eliminatedIcon} />
              <div>
                <div className={styles.eliminatedTitle}>YOU'VE BEEN ELIMINATED</div>
                <div className={styles.eliminatedSub}>Wrong answer in Sudden Death!</div>
              </div>
            </div>
          )}

          {question && (
            <div className={styles.questionCard} key={questionIndex}>
              <div className={styles.questionMeta}>
                <span className={styles.questionCat}>{question.category || 'Trivia'}</span>
                {lastPoints !== null && (
                  <div className={`${styles.pointsFlash} ${lastPoints > 0 ? styles.pointsPos : styles.pointsNeg}`}>
                    {lastPoints > 0 ? `+${lastPoints}` : <><XCircle size={16} /> WRONG</>}
                  </div>
                )}
              </div>
              <h2 className={styles.questionText} data-testid="question-text">{question}</h2>
            </div>
          )}

          <div className={styles.answersGrid}>
            {answers.map((ans, i) => {
              const state = getAnswerState(ans);
              return (
                <button
                  key={ans}
                  className={`${styles.answerBtn} ${styles[`ans_${state}`]}`}
                  onClick={() => selectAnswer(ans)}
                  disabled={!!selected || isEliminated}
                  data-testid={`answer-btn-${i}`}
                >
                  <span className={styles.answerLabel}>{ANSWER_LABELS[i]}</span>
                  <span className={styles.answerText}>{ans}</span>
                  {state === 'correct' && <CheckCircle size={18} className={styles.answerIcon} />}
                  {state === 'wrong' && <XCircle size={18} className={styles.answerIcon} />}
                </button>
              );
            })}
          </div>

          {showResults && leaderboard.length > 0 && (
            <div className={styles.miniLB}>
              <h3 className={styles.miniLBTitle}><Trophy size={13} /> STANDINGS</h3>
              <div className={styles.miniLBList}>
                {leaderboard.slice(0, 5).map((p, i) => (
                  <div key={p.username} className={`${styles.miniLBRow} ${p.username === user?.username ? styles.myRow : ''}`}>
                    <span className={styles.miniLBRank}>{getRankLabel(i + 1)}</span>
                    <span className={styles.miniLBName}>{p.username}</span>
                    <span className={styles.miniLBScore}>{p.score.toLocaleString()}</span>
                    {p.eliminated && <Skull size={14} style={{ color: 'var(--red)' }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isHost && (
            <div className={styles.hostControls}>
              <button className={styles.hostBtn} onClick={() => socket.emit('skip_question', { roomCode })} data-testid="skip-btn">
                <SkipForward size={14} /> Skip
              </button>
              <button className={`${styles.hostBtn} ${styles.hostBtnDanger}`} onClick={() => socket.emit('end_game', { roomCode })} data-testid="end-game-btn">
                <Square size={14} /> End Game
              </button>
            </div>
          )}
        </main>

        <aside className={`${styles.chatSidebar} ${chatOpen ? styles.chatOpen : ''}`}>
          <div className={styles.chatCard}>
            <h3 className={styles.chatTitle}><MessageCircle size={13} /> LIVE CHAT</h3>
            <div className={styles.chatMessages} ref={chatRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`${styles.chatMsg} ${msg.username === user?.username ? styles.myMsg : ''}`}>
                  <span className={styles.chatUser}>{msg.username}</span>
                  <span className={styles.chatText}>{msg.message}</span>
                </div>
              ))}
            </div>
            <div className={styles.chatInputRow}>
              <input className={styles.chatInput} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Message..." />
              <button className={styles.chatSend} onClick={sendMessage}><Send size={15} /></button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}