import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { playSound } from '../utils/sounds.js';
import toast from 'react-hot-toast';
import styles from './LobbyPage.module.css';

export default function LobbyPage() {
  const { roomCode } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef(null);

  // Seed room state passed from HomePage via navigation state
  useEffect(() => {
    if (location.state?.room) {
      const r = location.state.room;
      setRoom(r);
      setPlayers(r.players || []);
      setIsHost(location.state.isHost || false);
    }
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    // Clear stale listeners before re-registering
    socket.off('room_joined');
    socket.off('room_created');
    socket.off('player_joined');
    socket.off('player_left');
    socket.off('new_message');
    socket.off('settings_updated');
    socket.off('host_transferred');
    socket.off('kicked');
    socket.off('game_started');
    socket.off('error');

    socket.on('room_joined', ({ room }) => {
      setRoom(room);
      setPlayers(room.players);
      setIsHost(room.host === socket.id);
    });

    socket.on('room_created', ({ room }) => {
      setRoom(room);
      setPlayers(room.players);
      setIsHost(true);
    });

    socket.on('player_joined', ({ players }) => {
      setPlayers(players);
      playSound('playerJoined');
    });

    socket.on('player_left', ({ username, players }) => {
      setPlayers(players);
      toast(`${username} left the room`, { icon: '👋' });
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('settings_updated', ({ settings }) => {
      setRoom(prev => ({ ...prev, ...settings }));
      toast.success('Settings updated');
    });

    socket.on('host_transferred', () => {
      setIsHost(true);
      toast('You are now the host!', { icon: '👑' });
    });

    socket.on('kicked', () => {
      toast.error('You were kicked from the room');
      navigate('/');
    });

    socket.on('game_started', () => {
      playSound('gameStart');
      navigate(`/game/${roomCode}`);
    });

    socket.on('error', ({ message }) => toast.error(message));

    return () => {
      socket.off('room_joined');
      socket.off('room_created');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('new_message');
      socket.off('settings_updated');
      socket.off('host_transferred');
      socket.off('kicked');
      socket.off('game_started');
      socket.off('error');
    };
  }, [socket, navigate, roomCode]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
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
    socket.emit('start_game', { roomCode });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  const diffColor = { easy: 'var(--green)', medium: 'var(--gold)', hard: 'var(--red)' };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>← LEAVE</button>
        <div className={styles.headerCenter}>
          <span className={styles.logoText}>🧠 BRAIN<span>BATTLE</span></span>
        </div>
        <div className={styles.roomInfo}>
          <span className={styles.roomLabel}>ROOM CODE</span>
          <button className={styles.roomCode} onClick={copyCode}>{roomCode} 📋</button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Left: Room settings */}
        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>⚙ ROOM SETTINGS</h3>
            {room && (
              <div className={styles.settingsList}>
                <div className={styles.settingRow}>
                  <span>Mode</span>
                  <span className={styles.settingVal} style={{ color: 'var(--cyan)' }}>
                    {room.mode === 'classic' ? '⚡ Classic' : '💀 Sudden Death'}
                  </span>
                </div>
                <div className={styles.settingRow}>
                  <span>Category</span>
                  <span className={styles.settingVal}>{room.category}</span>
                </div>
                <div className={styles.settingRow}>
                  <span>Difficulty</span>
                  <span className={styles.settingVal} style={{ color: diffColor[room.difficulty] }}>
                    {room.difficulty?.toUpperCase()}
                  </span>
                </div>
                <div className={styles.settingRow}>
                  <span>Questions</span>
                  <span className={styles.settingVal}>{room.questionCount}</span>
                </div>
                <div className={styles.settingRow}>
                  <span>Timer</span>
                  <span className={styles.settingVal}>{room.timerSeconds}s per question</span>
                </div>
              </div>
            )}
          </div>

          {/* Players */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>👥 PLAYERS ({players.length}/20)</h3>
            <div className={styles.playerList}>
              {players.map((p, i) => (
                <div key={p.id} className={styles.playerRow}>
                  <span className={styles.playerRank}>#{i + 1}</span>
                  <span className={styles.playerName}>
                    {p.username}
                    {p.id === socket?.id && <span className={styles.youBadge}> YOU</span>}
                    {room?.host === p.id && <span className={styles.hostBadge}> 👑</span>}
                  </span>
                  {isHost && p.id !== socket?.id && (
                    <button className={styles.kickBtn} onClick={() => kickPlayer(p.username)}>KICK</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isHost && (
            <div className={styles.startSection}>
              <button className={styles.startBtn} onClick={startGame}>
                ⚡ START BATTLE
              </button>
              {players.length === 1 && (
                <p className={styles.soloHint}>🎮 Solo mode — share the room code to add more players</p>
              )}
            </div>
          )}
          {!isHost && (
            <div className={styles.waitingMsg}>
              <div className={styles.waitingDots}>
                <span /><span /><span />
              </div>
              Waiting for host to start...
            </div>
          )}
        </aside>

        {/* Right: Chat */}
        <main className={styles.chatArea}>
          <div className={styles.card} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 className={styles.cardTitle}>💬 BATTLE CHAT</h3>
            <div className={styles.messages} ref={chatRef}>
              <div className={styles.systemMsg}>Welcome to the lobby! Game starts when the host is ready.</div>
              {messages.map((msg, i) => (
                <div key={i} className={`${styles.message} ${msg.username === user?.username ? styles.myMessage : ''}`}>
                  <span className={styles.msgUser}>{msg.username}</span>
                  <span className={styles.msgText}>{msg.message}</span>
                  <span className={styles.msgTime}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                maxLength={120}
              />
              <button className={styles.sendBtn} onClick={sendMessage}>SEND</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
