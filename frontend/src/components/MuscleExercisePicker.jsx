import MuscleMap from './MuscleMap'
import { EXERCISE_LIBRARY, MUSCLE_GROUPS } from '../utils/exerciseLibrary'

// Put familiar gym staples first, then keep the supplied catalog order.
const COMMON_EXERCISES = [
  'Barbell Bench Press', 'Barbell Squat', 'Dumbbell Bench Press', 'Lat Pulldown',
  'Leg Press', 'Overhead Press', 'Seated Cable Row', 'Dumbbell Curl', 'Pull-ups',
  'Incline Dumbbell Press', 'Dumbbell Lateral Raise', 'Tricep Pushdown',
  'Romanian Deadlift', 'Push-ups', 'Plank', 'Barbell Row', 'Deadlift',
  'Seated Dumbbell Shoulder Press', 'Hammer Curl', 'Leg Extension',
  'Cable Lateral Raise', 'Crunches', 'Cable Chest Fly', 'Seated Leg Curl',
  'Rope Tricep Pushdown', 'Dips', 'Face Pull', 'Hanging Leg Raise',
]

const library = Object.entries(EXERCISE_LIBRARY)
const commonRank = new Map(COMMON_EXERCISES.map((name, rank) => [name, rank]))
library.sort(([a], [b]) => (commonRank.get(a) ?? COMMON_EXERCISES.length) - (commonRank.get(b) ?? COMMON_EXERCISES.length))

export default function MuscleExercisePicker({ group, onSelectGroup, onAdd }) {
  const primary = library.filter(([, exercise]) => exercise.primary === group)
  const secondary = library.filter(([, exercise]) => exercise.secondary.includes(group))

  return (
    <details className="card exercise-picker" open={group ? true : undefined}>
      <summary aria-label="Browse exercises by muscle">Exercises</summary>
      <div className="exercise-picker-content">
        <div>
          <MuscleMap selected={group ?? null} onSelect={onSelectGroup} />
          <div className="muscle-picker-buttons" role="group" aria-label="Muscle groups">
            {MUSCLE_GROUPS.map(muscle => (
              <button key={muscle} type="button" className="btn-ghost" aria-pressed={group === muscle}
                onClick={() => onSelectGroup(muscle)}>
                {muscle}
              </button>
            ))}
          </div>
        </div>
        <div className="exercise-picker-results">
          {group ? (
            <>
              <h2>{group} exercises</h2>
              <p>Choose an exercise to add it to this workout.</p>
              <div key={group} className="exercise-picker-list">
                {[['Main focus', primary], ['Also works this group', secondary]].map(([label, exercises]) =>
                  exercises.length > 0 && (
                    <div key={label}>
                      <h3>{label}</h3>
                      {exercises.map(([name]) => (
                        <button key={name} type="button" className="btn-ghost" onClick={() => onAdd(name)}>
                          <span>{name}</span><span aria-hidden="true">+</span>
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>
            </>
          ) : <p>Choose a group on the map or use the buttons to see matching exercises.</p>}
        </div>
      </div>
    </details>
  )
}
