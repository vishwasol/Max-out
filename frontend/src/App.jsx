import { lazy, Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getUser, logoutUser } from './api'
import HelpGuide from './components/HelpGuide'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import './index.css'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const LogWorkout = lazy(() => import('./pages/LogWorkout'))
const Progress = lazy(() => import('./pages/Progress'))
const Upgrades = lazy(() => import('./pages/Upgrades'))

export default function App() {
  const [isAuth, setIsAuth] = useState(false)
  const [loading, setLoading] = useState(true)

  const [logoutError, setLogoutError] = useState(false)

  useEffect(() => {
    localStorage.removeItem('maxout_token')
    const controller = new AbortController()
    const onSessionEnded = () => setIsAuth(false)
    window.addEventListener('maxout:session-ended', onSessionEnded)
    getUser(controller.signal)
      .then(() => setIsAuth(true))
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => {
      controller.abort()
      window.removeEventListener('maxout:session-ended', onSessionEnded)
    }
  }, [])

  const logout = async () => {
    setLogoutError(false)
    try {
      await logoutUser()
      setIsAuth(false)
    } catch {
      setLogoutError(true)
    }
  }

  if (loading) return null;

  return (
    <BrowserRouter>
      <HelpGuide />
      {!isAuth ? (
        <Routes>
          <Route path="/login" element={<Login setAuth={setIsAuth} />} />
          <Route path="/signup" element={<Signup setAuth={setIsAuth} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="app-container">
          <Navbar onLogout={logout} />
          <main className="main-content">
            {logoutError && <p role="alert">Could not log out. Please try again.</p>}
            <Suspense fallback={<p role="status">Loading…</p>}>
              <Routes>
                <Route path="/"         element={<Dashboard />} />
                <Route path="/log"      element={<LogWorkout />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/upgrades" element={<Upgrades />} />
                <Route path="*"         element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      )}
    </BrowserRouter>
  )
}
