import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { playSound } from '../utils/sounds.js';
import toast from 'react-hot-toast';
import {
  Users, Settings, Crown, Copy, ArrowLeft, Send,
  Zap, Skull, Clock, BarChart3, Layers,
} from 'lucide-react';
import styles from './LobbyPage.module.css';

export default function LobbyPage() {
  const { roomCode } = useParams();
  const { socket }   = useSocket();
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();

  const [room, setRoom]         = useState(null);
  const [players, setPlayers]   = useState([]);
  const [isHost, setIsHost]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef(null);

  // Initial state sync from navigation
  useEffect(() => {
    if (location.state?.room) {
      const r = location.state.room;
      setRoom(r);
      setPlayers(r.players || []);
      setIsHost(location.state.isHost || false);
    }
  }, [location.state]);

  useEffect(() => {
    if (!socket || !user) return;

    const cleanup = () => {
      const events = [
        'room_joined', 'room_created', 'player_joined', 'player_left',
        'new_message', 'settings_updated', 'host_transferred', 
        'kicked', 'game_started', 'error'
      ];
      events.forEach(event => socket.off(event));
    };

    cleanup();

    socket.on('room_joined', ({ room }) => {
      setRoom(room);
      setPlayers(room.players);
      // Verify host status via ID or Username
      setIsHost(room.host === socket.id || room.hostId === user._id);
    });

    socket.on('player_joined', ({ players }) => {
      setPlayers(players);
      playSound('playerJoined');
    });

    socket.on('player_left', ({ username, players }) => {
      setPlayers(players);
      toast(`${username} left the room`);
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('host_transferred', () => {
      setIsHost(true);
      toast('You are now the host!');
    });

    socket.on('kicked', () => {
      toast.error('You were kicked from the room');
      navigate('/');
    });

    // CHANGE: Pass isHost state through navigation
    socket.on('game_started', () => {
      playSound('gameStart');
      navigate(`/game/${roomCode}`, { state: { isHost } });
    });

    socket.on('error', ({ message }) => toast.error(message));

    return cleanup;
  }, [socket, navigate, roomCode, user, isHost]); // Added isHost to dependency array

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    socket.emit('send_message', { roomCode, username: user.username, message: chatInput });
    setChatInput('');
  };

  const kickPlayer = (username) => {
    if (!isHost) return;
    socket.emit('kick_player', { roomCode, username });
  };

  const startGame = () => {
    if (!isHost) return;
    socket.emit('start_game', { roomCode });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  const diffColor = { easy: 'var(--green)', medium: 'var(--gold)', hard: 'var(--red)' };

  const modeLabel = (mode) =>
    mode === 'sudden_death'
      ? <><Skull size={13} /> Sudden Death</>
      : <><Zap size={13} /> Classic</>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')} data-testid="leave-lobby">
          <ArrowLeft size={14} /> LEAVE
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.logoText}>BRAIN<span>BATTLE</span></span>
        </div>
        <div className={styles.roomInfo}>
          <span className={styles.roomLabel}>ROOM CODE</span>
          <button className={styles.roomCode} onClick={copyCode} data-testid="room-code">
            {roomCode} <Copy size={14} />
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><Settings size={13} /> ROOM SETTINGS</h3>
            {room && (
              <div className={styles.settingsList} data-testid="lobby-settings">
                <div className={styles.settingRow}>
                  <span>Mode</span>
                  <span className={styles.settingVal} style={{ color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {modeLabel(room.mode)}
                  </span>
                </div>
                <div className={styles.settingRow}>
                  <span><Layers size={12} /> Category</span>
                  <span className={styles.settingVal}>{room.category}</span>
                </div>
                <div className={styles.settingRow}>
                  <span><BarChart3 size={12} /> Difficulty</span>
                  <span className={styles.settingVal} style={{ color: diffColor[room.difficulty] }}>
                    {room.difficulty?.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}><Users size={13} /> PLAYERS ({players.length}/20)</h3>
            <div className={styles.playerList} data-testid="player-list">
              {players.map((p, i) => (
                <div key={p.id} className={`${styles.playerRow} ${p.disconnected ? styles.playerDisconnected : ''}`} data-testid={`player-${p.username}`}>
                  <span className={styles.playerRank}>#{i + 1}</span>
                  <span className={styles.playerName}>
                    {p.username}
                    {p.id === socket?.id && <span className={styles.youBadge}>YOU</span>}
                    {(room?.host === p.id || room?.hostId === p.id) && <Crown size={12} className={styles.hostBadge} />}
                  </span>
                  {isHost && p.username !== user?.username && (
                    <button className={styles.kickBtn} onClick={() => kickPlayer(p.username)} data-testid={`kick-${p.username}`}>KICK</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isHost && (
            <div className={styles.startSection}>
              <button className={styles.startBtn} onClick={startGame} data-testid="start-game-btn">
                <Zap size={18} /> START BATTLE
              </button>
            </div>
          )}
        </aside>

        <main className={styles.chatArea}>
          <div className={styles.card} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 className={styles.cardTitle}>BATTLE CHAT</h3>
            <div className={styles.messages} ref={chatRef} data-testid="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`${styles.message} ${msg.username === user?.username ? styles.myMessage : ''}`}>
                  <span className={styles.msgUser}>{msg.username}</span>
                  <span className={styles.msgText}>{msg.message}</span>
                </div>
              ))}
            </div>
            <div className={styles.chatInput}>
              <input
                className={styles.chatInputField}
                placeholder="Type a message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                data-testid="chat-input"
              />
              <button className={styles.sendBtn} onClick={sendMessage} data-testid="send-chat-btn">
                <Send size={15} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}