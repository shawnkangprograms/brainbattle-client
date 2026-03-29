import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar.jsx';
import styles from './AdminPage.module.css';

const CATEGORIES = ['General Knowledge', 'Science & Nature', 'History & Geography', 'Pop Culture & Entertainment', 'Sports', 'Technology'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const emptyForm = {
  question: '', correct_answer: '',
  incorrect_answers: ['', '', ''],
  category: 'General Knowledge', difficulty: 'medium',
};

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [filterDiff, setFilterDiff] = useState('');

  useEffect(() => {
    if (user?.isGuest) { navigate('/'); return; }
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const params = {};
      if (filterCat) params.category = filterCat;
      if (filterDiff) params.difficulty = filterDiff;
      const res = await api.get('/api/questions/admin', { params });
      setQuestions(res.data.questions);
    } catch (e) { toast.error('Failed to load questions'); }
  };

  useEffect(() => { fetchQuestions(); }, [filterCat, filterDiff]);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setIncorrect = (i, val) => setForm(f => {
    const arr = [...f.incorrect_answers];
    arr[i] = val;
    return { ...f, incorrect_answers: arr };
  });

  const handleSubmit = async () => {
    if (!form.question || !form.correct_answer || form.incorrect_answers.some(a => !a))
      return toast.error('Fill all fields including 3 incorrect answers');
    setLoading(true);
    try {
      await api.post('/api/questions/admin', form);
      toast.success('Question added!');
      setForm(emptyForm);
      fetchQuestions();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to add question'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/api/questions/admin/${id}`);
      toast.success('Deleted');
      fetchQuestions();
    } catch (e) { toast.error('Failed to delete'); }
  };

  const diffColor = { easy: 'var(--green)', medium: 'var(--gold)', hard: 'var(--red)' };

  return (
    <div className={styles.container}>
      <Navbar />
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>← HOME</button>
        <div className={styles.logoText}>🧠 BRAIN<span>BATTLE</span></div>
        <div className={styles.adminBadge}>⚙ ADMIN PANEL</div>
      </header>

      <div className={styles.layout}>
        {/* Add question form */}
        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>➕ ADD QUESTION</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>QUESTION</label>
              <textarea className={styles.textarea} rows={3} placeholder="Enter the question..."
                value={form.question} onChange={e => setField('question', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>CORRECT ANSWER</label>
              <input className={`${styles.input} ${styles.inputCorrect}`} placeholder="Correct answer"
                value={form.correct_answer} onChange={e => setField('correct_answer', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>INCORRECT ANSWERS (3)</label>
              {form.incorrect_answers.map((a, i) => (
                <input key={i} className={`${styles.input} ${styles.inputWrong}`}
                  placeholder={`Wrong answer ${i + 1}`}
                  value={a} onChange={e => setIncorrect(i, e.target.value)} />
              ))}
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>CATEGORY</label>
                <select className={styles.select} value={form.category} onChange={e => setField('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>DIFFICULTY</label>
                <select className={styles.select} value={form.difficulty} onChange={e => setField('difficulty', e.target.value)}>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? 'ADDING...' : '➕ ADD QUESTION'}
            </button>
          </div>
        </aside>

        {/* Question list */}
        <main className={styles.main}>
          <div className={styles.filters}>
            <h2 className={styles.mainTitle}>📋 QUESTION BANK ({questions.length})</h2>
            <div className={styles.filterRow}>
              <select className={styles.filterSelect} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className={styles.filterSelect} value={filterDiff} onChange={e => setFilterDiff(e.target.value)}>
                <option value="">All Difficulties</option>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.questionList}>
            {questions.length === 0 ? (
              <div className={styles.empty}>No questions yet. Add some using the form!</div>
            ) : questions.map(q => (
              <div key={q._id} className={styles.questionCard}>
                <div className={styles.qMeta}>
                  <span className={styles.qCat}>{q.category}</span>
                  <span className={styles.qDiff} style={{ color: diffColor[q.difficulty] }}>
                    {q.difficulty?.toUpperCase()}
                  </span>
                  <span className={styles.qSource}>{q.source}</span>
                </div>
                <p className={styles.qText}>{q.question}</p>
                <div className={styles.qAnswers}>
                  <span className={styles.qCorrect}>✓ {q.correct_answer}</span>
                  {q.incorrect_answers.map((a, i) => (
                    <span key={i} className={styles.qWrong}>✗ {a}</span>
                  ))}
                </div>
                <button className={styles.deleteBtn} onClick={() => handleDelete(q._id)}>🗑 DELETE</button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
