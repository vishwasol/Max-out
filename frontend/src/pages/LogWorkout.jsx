import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { logWorkout } from '../api'
import MuscleExercisePicker from '../components/MuscleExercisePicker'
import { EXERCISE_LIBRARY, MUSCLE_GROUPS } from '../utils/exerciseLibrary'

const LIBRARY_EXERCISES = Object.keys(EXERCISE_LIBRARY).sort()
const newExercise = (name = '') => ({ name, weight: '', reps: '', sets: '' })

function ExerciseRow({ ex, idx, onChange, onRemove }) {
  return (
    <div className="fade-up workout-exercise-grid" style={{
      alignItems: 'center',
      padding: '14px 18px', background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(139,92,246,0.12)', borderRadius: 12,
    }}>
      {/* Name with datalist */}
      <div>
        <input
          id={`ex-name-${idx}`}
          className="input"
          list="exercise-list"
          placeholder="Exercise name"
          value={ex.name}
          onChange={e => onChange(idx, 'name', e.target.value)}
          style={{ fontSize: '0.88rem' }}
        />
      </div>

      <div>
        <input id={`ex-weight-${idx}`} className="input" type="number" placeholder="lbs" min={0} step={2.5}
          value={ex.weight} onChange={e => onChange(idx, 'weight', e.target.value)}
          style={{ fontSize: '0.88rem', textAlign: 'center' }} />
      </div>
      <div>
        <input id={`ex-reps-${idx}`} className="input" type="number" placeholder="reps" min={1}
          value={ex.reps} onChange={e => onChange(idx, 'reps', e.target.value)}
          style={{ fontSize: '0.88rem', textAlign: 'center' }} />
      </div>
      <div>
        <input id={`ex-sets-${idx}`} className="input" type="number" placeholder="sets" min={1}
          value={ex.sets} onChange={e => onChange(idx, 'sets', e.target.value)}
          style={{ fontSize: '0.88rem', textAlign: 'center' }} />
      </div>
      <button id={`ex-remove-${idx}`} onClick={() => onRemove(idx)}
        style={{ background: 'none', border: 'none', color: '#ffffffff', cursor: 'pointer', fontSize: '1.1rem', padding: 4 }}>
        ✕
      </button>
    </div>
  )
}

function ResultCard({ result, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(8px)',
    }}>
      <div className="card fade-up" style={{ padding: '36px 40px', maxWidth: 420, width: '90%', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>
          {result.level_up ? '🎉' : result.is_pr ? '🏆' : '✅'}
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.4rem', marginBottom: 8 }}>
          {result.level_up ? `Level Up! You're Level ${result.new_level}` : 'Workout Logged!'}
        </h2>
        <div className="gold-text" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16 }}>
          +{result.points_earned} pts
        </div>

        {/* Breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, textAlign: 'left' }}>
          {Object.entries(result.breakdown).map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between', padding: '4px 0',
              fontSize: '0.85rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.04)'
            }}>
              <span style={{ textTransform: 'capitalize' }}>{k.replaceAll('_', ' ')}</span>
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>+{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {result.is_pr && <span className="badge badge-gold">🏆 New PR!</span>}
          {result.streak >= 3 && <span className="badge badge-purple">🔥 {result.streak}-day streak</span>}
          {result.level_up && <span className="badge badge-green">⬆️ Level Up!</span>}
        </div>

        <button id="result-close-btn" className="btn-primary" style={{ marginTop: 24, width: '100%' }} onClick={onClose}>
          Keep Going
        </button>
      </div>
    </div>
  )
}

export default function LogWorkout() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const group = MUSCLE_GROUPS.find(muscle => muscle === searchParams.get('muscle'))
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState(() => [newExercise()])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const addExercise = () => setExercises(rows => [...rows, newExercise()])
  const addFromLibrary = name => {
    setExercises(rows => {
      const emptyIndex = rows.findIndex(row => !row.name.trim())
      if (emptyIndex === -1) return [...rows, newExercise(name)]
      return rows.map((row, i) => i === emptyIndex ? { ...row, name } : row)
    })
  }
  const removeExercise = idx => setExercises(ex => ex.filter((_, i) => i !== idx))
  const updateExercise = (idx, field, val) => setExercises(ex => ex.map((e, i) => i === idx ? { ...e, [field]: val } : e))

  const handleSubmit = async () => {
    const valid = exercises.filter(e => e.name && e.weight && e.reps && e.sets)
    if (valid.length === 0) { setError('Add at least one complete exercise.'); return }
    setError(null)
    setLoading(true)
    try {
      const res = await logWorkout({
        notes,
        exercises: valid.map(e => ({
          name: e.name,
          weight: parseFloat(e.weight),
          reps: parseInt(e.reps),
          sets: parseInt(e.sets),
        })),
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to log workout. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title gradient-text fade-up">Log Workout</h1>
      <p className="page-subtitle fade-up">Record your exercises to earn points and track progress.</p>

      <MuscleExercisePicker
        group={group}
        onSelectGroup={muscle => setSearchParams({ muscle }, { replace: true })}
        onAdd={addFromLibrary}
      />

      <datalist id="exercise-list">
        {LIBRARY_EXERCISES.map(name => <option key={name} value={name} />)}
      </datalist>

      {/* Column headers */}
      <div className="workout-exercise-grid" style={{ padding: '0 18px', marginBottom: 8 }}>
        {['Exercise', 'Weight (lbs)', 'Reps', 'Sets', ''].map((h, i) => (
          <div key={i} style={{
            fontSize: '0.72rem', fontWeight: 600, color: '#475569',
            textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i > 0 ? 'center' : 'left'
          }}>
            {h}
          </div>
        ))}
      </div>

      {/* Exercise rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {exercises.map((ex, idx) => (
          <ExerciseRow key={idx} ex={ex} idx={idx} onChange={updateExercise} onRemove={removeExercise} />
        ))}
      </div>

      <button id="add-exercise-btn" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }}
        onClick={addExercise}>
        + Add Exercise
      </button>

      {/* Notes */}
      <textarea id="workout-notes" className="input" placeholder="Session notes (optional)…"
        value={notes} onChange={e => setNotes(e.target.value)}
        style={{ resize: 'vertical', minHeight: 80, marginBottom: 20, fontFamily: 'inherit' }} />

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '12px 16px', color: '#ef4444', fontSize: '0.875rem', marginBottom: 16
        }}>
          ⚠️ {error}
        </div>
      )}

      <button id="submit-workout-btn" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
        onClick={handleSubmit} disabled={loading}>
        {loading ? 'Calculating points…' : 'Log Workout & Earn Points'}
      </button>

      {result && (
        <ResultCard result={result} onClose={() => { setResult(null); navigate('/') }} />
      )}
    </div>
  )
}
