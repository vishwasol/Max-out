import MuscleMap from './MuscleMap'
import { EXERCISE_LIBRARY, MUSCLE_GROUPS } from '../utils/exerciseLibrary'

const library = Object.entries(EXERCISE_LIBRARY).sort(([a], [b]) => a.localeCompare(b))

export default function MuscleExercisePicker({ group, onSelectGroup, onAdd, lastAdded }) {
  const primary = library.filter(([, exercise]) => exercise.primary === group)
  const secondary = library.filter(([, exercise]) => exercise.secondary.includes(group))

  return (
    <details className="card exercise-picker" open={group ? true : undefined}>
      <summary>Browse exercises by muscle</summary>
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
              <div className="exercise-picker-list">
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
          <p className="exercise-picker-status" role="status">{lastAdded && `${lastAdded} added.`}</p>
        </div>
      </div>
    </details>
  )
}
