import Model from 'react-body-highlighter'
import { LEVEL_COLORS, classifyLevel } from '../utils/strengthVisualizerLogic'

const MUSCLE_PARTS = {
  chest: ['chest'],
  back: ['upper-back', 'trapezius', 'lower-back'],
  legs: ['quadriceps', 'hamstring', 'calves', 'gluteal', 'adductor', 'abductors', 'left-soleus', 'right-soleus'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  arms: ['biceps', 'triceps', 'forearm'],
  core: ['abs', 'obliques'],
}

const GROUP_BY_PART = Object.fromEntries(
  Object.entries(MUSCLE_PARTS).flatMap(([group, parts]) => parts.map(part => [part, group]))
)
const EMPTY_SCORES = {}

export default function MuscleMap({ scores = EMPTY_SCORES, selected, onSelect }) {
  const colors = selected !== undefined ? ['#8b5cf6'] : LEVEL_COLORS.slice(1)
  const data = Object.entries(MUSCLE_PARTS).flatMap(([name, muscles]) => {
    const frequency = selected !== undefined ? Number(selected === name) : classifyLevel(scores[name])
    return frequency > 0 ? [{ name, muscles, frequency }] : []
  })

  function selectPart({ muscle }) {
    const group = GROUP_BY_PART[muscle]
    if (group) onSelect(group)
  }

  return (
    <div className={`muscle-map ${onSelect ? 'muscle-map--interactive' : ''}`} aria-hidden="true">
      {['anterior', 'posterior'].map(type => (
        <div key={type} className="muscle-map-view">
          <Model
            type={type}
            data={data}
            bodyColor={LEVEL_COLORS[0]}
            highlightedColors={colors}
            onClick={onSelect ? selectPart : undefined}
          />
          <span>{type === 'anterior' ? 'Front' : 'Back'}</span>
        </div>
      ))}
    </div>
  )
}
