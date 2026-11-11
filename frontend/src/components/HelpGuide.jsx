import { useRef } from 'react'

export default function HelpGuide() {
  const dialog = useRef(null)

  return (
    <>
      <button type="button" className="help-trigger" aria-label="How Max-out works" aria-haspopup="dialog"
        onClick={() => dialog.current.showModal()}>
        ?
      </button>
      <dialog ref={dialog} className="help-guide" aria-labelledby="help-title">
        <header>
          <h2 id="help-title" className="gradient-text">How Max-out works</h2>
          <form method="dialog">
            <button className="btn-ghost" aria-label="Close help">✕</button>
          </form>
        </header>

        <section>
          <h3>Log a workout</h3>
          <p>Enter an exercise, weight in pounds, reps, and sets. Type a custom exercise or select a muscle on the body map to browse exercises that train it. Add optional session notes, then save to see your points breakdown. Use the reps field for seconds on planks. For assisted dips and pull-ups, enter the weight of the assistance.</p>
        </section>

        <section>
          <h3>Earn points and levels</h3>
          <ul>
            <li><strong>Workout:</strong> 10 points for each session.</li>
            <li><strong>Personal record:</strong> 20 bonus points once per session if you beat a previously logged weight for an exercise.</li>
            <li><strong>Streak:</strong> 5 bonus points for each full three-day block in your current streak.</li>
            <li><strong>Volume:</strong> Volume is weight × reps × sets. When your session volume beats the average of up to your previous five sessions by more than 5%, you earn one point per two full percentage points above that 5% margin.</li>
          </ul>
          <p>Your points balance advances you through levels and pays for upgrades.</p>
        </section>

        <section>
          <h3>Unlock upgrades</h3>
          <p>Spend points in the Upgrade Shop. Owned bonuses apply automatically, and buying another copy adds another bonus.</p>
          <ul>
            <li><strong>PR Boost:</strong> Adds 10% of the workout score before upgrades when you set a PR, rounded down.</li>
            <li><strong>Volume Amplifier:</strong> Adds 5 points to each workout.</li>
            <li><strong>Weekend Warrior:</strong> Adds another copy of the workout score before upgrades on Saturday and Sunday (UTC).</li>
            <li><strong>Streak Shield:</strong> This effect is inactive. It’s intended to protect your streak after a missed day.</li>
          </ul>
        </section>

        <section>
          <h3>Review progress</h3>
          <p>The Dashboard shows your balance, level, streak, and recent sessions. Deleting a session removes its earned points from your balance. Progress shows your volume trend, best weights, and a muscle map based on your recent lifts and signup bodyweight.</p>
          <p><strong>Strength</strong> is an in-app estimate out of 100 for exercises the app recognizes. Select a muscle on the map or its score card to open its exercise list.</p>
        </section>
      </dialog>
    </>
  )
}
