import { EXERCISE_LIBRARY, MUSCLE_GROUPS } from './exerciseLibrary.js'

const BODYWEIGHT_EXERCISES = new Set(['Pull-ups', 'Chin-ups', 'Push-ups', 'Dips', 'Bench Dips', 'Inverted Row'])

// Ratios are in-app benchmarks, with higher targets for isolation lifts.
const STRENGTH_TARGET_MULTIPLIER = 1.2
const ARM_TARGET_MULTIPLIER = 1.35
const BASE_THRESHOLDS = {
  squat:           [0.45, 0.75, 1.0, 1.35, 1.7, 2.1],
  hinge:           [0.55, 0.9, 1.2, 1.6, 2.0, 2.45],
  horizontalPress: [0.35, 0.55, 0.8, 1.0, 1.25, 1.5],
  verticalPress:   [0.2, 0.35, 0.5, 0.68, 0.82, 1.0],
  horizontalPull:  [0.3, 0.5, 0.7, 0.92, 1.15, 1.38],
  verticalPull:    [0.4, 0.65, 0.9, 1.05, 1.2, 1.35],
  chestAccessory:  [0.18, 0.3, 0.45, 0.62, 0.78, 0.95],
  legAccessory:    [0.25, 0.45, 0.7, 0.95, 1.2, 1.45],
  shoulderIso:     [0.08, 0.14, 0.22, 0.32, 0.42, 0.54],
  armIso:          [0.1, 0.18, 0.28, 0.4, 0.52, 0.68],
  core:            [0.15, 0.28, 0.42, 0.58, 0.78, 1.0],
}

const EXERCISE_STANDARD_GROUPS = {
  'Barbell Bench Press': 'horizontalPress',
  'Dumbbell Bench Press': 'horizontalPress',
  'Incline Chest Press': 'horizontalPress',
  'Chest Fly': 'chestAccessory',
  'Cable Fly': 'chestAccessory',
  'Push-ups': 'horizontalPress',
  'Dips': 'horizontalPress',
  'Pull-ups': 'verticalPull',
  'Chin-ups': 'verticalPull',
  'Lat Pulldown': 'verticalPull',
  'Barbell Row': 'horizontalPull',
  'Dumbbell Row': 'horizontalPull',
  'Seated Cable Row': 'horizontalPull',
  'T-Bar Row': 'horizontalPull',
  'Deadlift': 'hinge',
  'Squat': 'squat',
  'Front Squat': 'squat',
  'Leg Press': 'legAccessory',
  'Lunges': 'legAccessory',
  'Bulgarian Split Squat': 'legAccessory',
  'Step-ups': 'legAccessory',
  'Leg Extension': 'legAccessory',
  'Leg Curl': 'legAccessory',
  'Romanian Deadlift': 'hinge',
  'Calf Raises': 'legAccessory',
  'Overhead Press': 'verticalPress',
  'Arnold Press': 'verticalPress',
  'Lateral Raise': 'shoulderIso',
  'Front Raise': 'shoulderIso',
  'Rear Delt Fly': 'shoulderIso',
  'Upright Row': 'horizontalPull',
  'Barbell Curl': 'armIso',
  'Dumbbell Curl': 'armIso',
  'Hammer Curl': 'armIso',
  'Preacher Curl': 'armIso',
  'Tricep Pushdown': 'armIso',
  'Skullcrusher': 'armIso',
  'Overhead Tricep Extension': 'armIso',
  'Plank': 'core',
  'Crunches': 'core',
  'Sit-ups': 'core',
  'Hanging Leg Raise': 'core',
  'Russian Twists': 'core',
  'Cable Crunch': 'core',
  'Ab Wheel Rollout': 'core',
  'Incline Dumbbell Press': 'horizontalPress',
  'Decline Bench Press': 'horizontalPress',
  'Machine Chest Press': 'horizontalPress',
  'Pec Deck': 'chestAccessory',
  'Wide Grip Lat Pulldown': 'verticalPull',
  'Close Grip Lat Pulldown': 'verticalPull',
  'Single Arm Dumbbell Row': 'horizontalPull',
  'Chest Supported Row': 'horizontalPull',
  'Inverted Row': 'horizontalPull',
  'Hack Squat': 'squat',
  'Smith Machine Squat': 'squat',
  'Glute Bridge': 'legAccessory',
  'Hip Thrust': 'legAccessory',
  'Walking Lunges': 'legAccessory',
  'Seated Calf Raise': 'legAccessory',
  'Standing Calf Raise': 'legAccessory',
  'Seated Dumbbell Press': 'verticalPress',
  'Cable Lateral Raise': 'shoulderIso',
  'Reverse Pec Deck': 'shoulderIso',
  'Cable Front Raise': 'shoulderIso',
  'Incline Dumbbell Curl': 'armIso',
  'Rope Hammer Curl': 'armIso',
  'Cable Curl': 'armIso',
  'EZ Bar Curl': 'armIso',
  'Concentration Curl': 'armIso',
  'Close Grip Bench Press': 'horizontalPress',
  'Rope Tricep Pushdown': 'armIso',
  'Cable Overhead Tricep Extension': 'armIso',
  'Bench Dips': 'horizontalPress',
  'Decline Sit-ups': 'core',
  'Toe Touches': 'core',
  'Bicycle Crunch': 'core',
  'Side Plank': 'core',
  'Mountain Climbers': 'core',
}

const SCORE_STOPS = [10, 25, 40, 55, 70, 85]
const PLANK_SECONDS_TARGETS = [20, 35, 55, 80, 110, 150]
const MAX_STRENGTH_SCORE = 99.9

export const calculate1RM = (weight, reps) => weight * (1 + Math.min(reps, 12) / 30)

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const interpolate = (input, inMin, inMax, outMin, outMax) => {
  const ratio = (input - inMin) / (inMax - inMin)
  return outMin + ratio * (outMax - outMin)
}

const getStrengthScore = (exerciseName, weight, reps, bodyweight) => {
  const group = EXERCISE_STANDARD_GROUPS[exerciseName]
  if (!group) return null

  const isPlank = exerciseName === 'Plank' || exerciseName === 'Side Plank'
  const multiplier = group === 'armIso' ? ARM_TARGET_MULTIPLIER : STRENGTH_TARGET_MULTIPLIER
  const thresholds = isPlank ? PLANK_SECONDS_TARGETS : BASE_THRESHOLDS[group].map(value => value * multiplier)
  const estimatedLoad = BODYWEIGHT_EXERCISES.has(exerciseName)
    ? Math.max(weight, bodyweight)
    : calculate1RM(weight, reps)
  const value = isPlank ? reps : estimatedLoad / bodyweight

  if (value <= thresholds[0]) {
    return interpolate(Math.max(value, 0), 0, thresholds[0], 1, SCORE_STOPS[0])
  }

  for (let i = 1; i < thresholds.length; i += 1) {
    if (value <= thresholds[i]) {
      return interpolate(value, thresholds[i - 1], thresholds[i], SCORE_STOPS[i - 1], SCORE_STOPS[i])
    }
  }

  // Keep the curve continuous at 85 and leave room above the top benchmark.
  const excess = value / thresholds.at(-1) - 1
  return Math.min(MAX_STRENGTH_SCORE, 100 - 15 / (1 + 2 * excess))
}

const getExerciseReliability = (exerciseName, exerciseType) => {
  const standardsGroup = EXERCISE_STANDARD_GROUPS[exerciseName]

  if (standardsGroup === 'squat' || standardsGroup === 'hinge') return 1
  if (
    standardsGroup === 'horizontalPress' ||
    standardsGroup === 'verticalPress' ||
    standardsGroup === 'horizontalPull' ||
    standardsGroup === 'verticalPull'
  ) return 0.92
  if (exerciseType === 'secondary') return 0.8
  if (exerciseType === 'isolation') return 0.65
  return 0.75
}

const getRecencyWeight = (daysSinceLog) => {
  if (daysSinceLog <= 7) return 1
  if (daysSinceLog <= 30) return 0.92
  if (daysSinceLog <= 60) return 0.84
  if (daysSinceLog <= 90) return 0.74
  if (daysSinceLog <= 180) return 0.6
  return 0.45
}

const getContributionWeights = (definition) => {
  const contributions = [{ muscle: definition.primary, share: 0.7 }]
  const secondaries = definition.secondary || []

  if (secondaries.length > 0) {
    const secondaryShare = 0.3 / secondaries.length
    secondaries.forEach(muscle => {
      contributions.push({ muscle, share: secondaryShare })
    })
  }

  return contributions
}

export const buildCurrentMuscleProfile = (workouts, bodyweight) => {
  const safeBodyweight = Math.max(Number(bodyweight) || 180, 1)
  const latestWorkoutDate = workouts.reduce((latest, workout) => {
    const workoutDate = new Date(workout.date)
    return workoutDate > latest ? workoutDate : latest
  }, new Date(0))

  const exerciseBestEntries = new Map()

  workouts.forEach(workout => {
    const workoutDate = new Date(workout.date)
    const daysSinceLog = Math.max(
      0,
      Math.round((latestWorkoutDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))
    )

    workout.exercises.forEach(exercise => {
      if (!Object.hasOwn(EXERCISE_LIBRARY, exercise.name)) return
      const definition = EXERCISE_LIBRARY[exercise.name]

      const score = getStrengthScore(
        exercise.name,
        exercise.weight,
        exercise.reps,
        safeBodyweight
      )
      if (score === null) return
      const reliability = getExerciseReliability(exercise.name, definition.type)
      const recencyWeight = getRecencyWeight(daysSinceLog)
      const effectiveScore = score * reliability * recencyWeight

      const existing = exerciseBestEntries.get(exercise.name)
      if (!existing || effectiveScore > existing.effectiveScore) {
        exerciseBestEntries.set(exercise.name, {
          exerciseName: exercise.name,
          muscleDefinition: definition,
          score,
          effectiveScore,
          reliability,
          recencyWeight,
          performedAt: workout.date,
        })
      }
    })
  })

  const muscleTotals = Object.fromEntries(
    MUSCLE_GROUPS.map(muscle => [muscle, { score: 0, weight: 0, confidence: 0, exercises: [] }])
  )

  exerciseBestEntries.forEach(entry => {
    const contributions = getContributionWeights(entry.muscleDefinition)
    const qualityWeight = entry.reliability * entry.recencyWeight

    contributions.forEach(({ muscle, share }) => {
      const total = muscleTotals[muscle]
      if (!total) return

      const appliedWeight = qualityWeight * share
      total.score += entry.score * appliedWeight
      total.weight += appliedWeight
      total.confidence += appliedWeight
      total.exercises.push({
        name: entry.exerciseName,
        score: entry.score,
        performedAt: entry.performedAt,
        contribution: share,
      })
    })
  })

  const scores = {}
  const confidence = {}
  const topExercises = {}

  MUSCLE_GROUPS.forEach(muscle => {
    const total = muscleTotals[muscle]
    scores[muscle] = total.weight > 0 ? total.score / total.weight : 0
    confidence[muscle] = clamp(total.confidence / 1.6, 0, 1)
    topExercises[muscle] = total.exercises
      .sort((a, b) => (b.score * b.contribution) - (a.score * a.contribution))
      .slice(0, 3)
  })

  return { scores, confidence, topExercises }
}

export const classifyLevel = (score) => {
  if (!Number.isFinite(score) || score <= 0) return 0
  if (score < 20) return 1
  if (score < 35) return 2
  if (score < 50) return 3
  if (score < 72) return 4
  if (score < 90) return 5
  return 6
}

export const LEVEL_COLORS = [
  '#1a1a24',
  '#7f1d1d',
  '#c2410c',
  '#ca8a04',
  '#16a34a',
  '#2563eb',
  '#7c3aed',
]

export const LEGEND = [
  { label: 'Developing', color: LEVEL_COLORS[1] },
  { label: 'Emerging', color: LEVEL_COLORS[2] },
  { label: 'Competent', color: LEVEL_COLORS[3] },
  { label: 'Strong', color: LEVEL_COLORS[4] },
  { label: 'Advanced', color: LEVEL_COLORS[5] },
  { label: 'Elite', color: LEVEL_COLORS[6] },
]
