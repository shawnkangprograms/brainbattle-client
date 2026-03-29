import { useState, useEffect, useCallback, useRef } from 'react';
import { useSound } from './useSound';

export function useGame(socket, user) {
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState('idle'); // idle | lobby | playing | results
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionResult, setQuestionResult] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [finalRanking, setFinalRanking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [myAnswer, setMyAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isEliminated, setIsEliminated] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const timerRef = useRef(null);
  const sound = useSound();

  const startTimer = useCallback((seconds) => {
    clearInterval(timerRef.current);
    setTimeLeft(seconds);
    let t = seconds;
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 3 && t > 0) sound.playUrgentTick();
      else if (t > 0) sound.playTick();
      if (t <= 0) clearInterval(timerRef.current);
    }, 1000);
  }, [sound]);

  useEffect(() => {
    if (!socket) return;

    socket.on('room_created', ({ roomCode, room }) => {
      setRoom(room);
      setGameState('lobby');
      setIsHost(true);
    });

    socket.on('room_joined', ({ room }) => {
      setRoom(room);
      setGameState('lobby');
      setIsHost(room.host === socket.id);
    });

    socket.on('player_joined', ({ players }) => {
      setRoom(prev => prev ? { ...prev, players } : prev);
      sound.playJoin();
    });

    socket.on('player_left', ({ username, players }) => {
      setRoom(prev => prev ? { ...prev, players } : prev);
    });

    socket.on('settings_updated', ({ settings }) => {
      setRoom(prev => prev ? { ...prev, ...settings } : prev);
    });

    socket.on('host_transferred', () => {
      setIsHost(true);
    });

    socket.on('game_started', ({ totalQuestions }) => {
      setGameState('playing');
      setIsEliminated(false);
      setFinalRanking(null);
    });

    socket.on('question', (data) => {
      setCurrentQuestion(data);
      setQuestionResult(null);
      setAnswerResult(null);
      setMyAnswer(null);
      startTimer(data.timerSeconds);
    });

    socket.on('answer_result', (result) => {
      setAnswerResult(result);
      clearInterval(timerRef.current);
      if (result.correct) sound.playCorrect();
      else sound.playWrong();
    });

    socket.on('eliminated', ({ answer }) => {
      setIsEliminated(true);
      setAnswerResult({ correct: false, eliminated: true });
      sound.playWrong();
    });

    socket.on('player_eliminated', ({ username }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map(p =>
            p.username === username ? { ...p, eliminated: true } : p
          ),
        };
      });
    });

    socket.on('question_results', (data) => {
      setQuestionResult(data);
      clearInterval(timerRef.current);
      setRoom(prev => prev ? {
        ...prev,
        players: data.leaderboard.map(p => ({ ...prev.players.find(pl => pl.username === p.username), ...p }))
      } : prev);
    });

    socket.on('game_over', ({ finalRanking }) => {
      setFinalRanking(finalRanking);
      setGameState('results');
      setCurrentQuestion(null);
      clearInterval(timerRef.current);
      // Check if current user won
      const myRank = finalRanking.find(p => p.username === user?.username);
      if (myRank?.rank === 1) sound.playWin();
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev.slice(-99), msg]);
    });

    socket.on('kicked', () => {
      resetGame();
    });

    socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    return () => {
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('settings_updated');
      socket.off('host_transferred');
      socket.off('game_started');
      socket.off('question');
      socket.off('answer_result');
      socket.off('eliminated');
      socket.off('player_eliminated');
      socket.off('question_results');
      socket.off('game_over');
      socket.off('new_message');
      socket.off('kicked');
      socket.off('error');
      clearInterval(timerRef.current);
    };
  }, [socket, user, startTimer, sound]);

  const createRoom = useCallback((settings) => {
    socket?.emit('create_room', {
      username: user?.username,
      userId: user?.isGuest ? null : user?.id,
      ...settings,
    });
  }, [socket, user]);

  const joinRoom = useCallback((roomCode) => {
    socket?.emit('join_room', {
      roomCode: roomCode.toUpperCase(),
      username: user?.username,
      userId: user?.isGuest ? null : user?.id,
    });
  }, [socket, user]);

  const submitAnswer = useCallback((answer) => {
    if (myAnswer || isEliminated) return;
    setMyAnswer(answer);
    socket?.emit('submit_answer', { roomCode: room?.code, answer });
  }, [socket, room, myAnswer, isEliminated]);

  const sendMessage = useCallback((message) => {
    socket?.emit('send_message', { roomCode: room?.code, username: user?.username, message });
  }, [socket, room, user]);

  const startGame = useCallback(() => {
    socket?.emit('start_game', { roomCode: room?.code });
  }, [socket, room]);

  const kickPlayer = useCallback((username) => {
    socket?.emit('kick_player', { roomCode: room?.code, username });
  }, [socket, room]);

  const skipQuestion = useCallback(() => {
    socket?.emit('skip_question', { roomCode: room?.code });
  }, [socket, room]);

  const endGame = useCallback(() => {
    socket?.emit('end_game', { roomCode: room?.code });
  }, [socket, room]);

  const updateSettings = useCallback((settings) => {
    socket?.emit('update_settings', { roomCode: room?.code, settings });
    setRoom(prev => prev ? { ...prev, ...settings } : prev);
  }, [socket, room]);

  const resetGame = useCallback(() => {
    setRoom(null);
    setGameState('idle');
    setCurrentQuestion(null);
    setQuestionResult(null);
    setAnswerResult(null);
    setFinalRanking(null);
    setMessages([]);
    setMyAnswer(null);
    setIsEliminated(false);
    setIsHost(false);
    clearInterval(timerRef.current);
  }, []);

  return {
    room, gameState, currentQuestion, questionResult, answerResult,
    finalRanking, messages, myAnswer, timeLeft, isEliminated, isHost,
    createRoom, joinRoom, submitAnswer, sendMessage, startGame,
    kickPlayer, skipQuestion, endGame, updateSettings, resetGame, sound,
  };
}
