import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use(config => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers['X-Maxout-Request'] = '1'
  }
  return config
})

api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
    window.dispatchEvent(new Event('maxout:session-ended'))
  }
  return Promise.reject(error)
})

// Auth
export const signupUser    = (data) => api.post(`/auth/signup`, data)
export const loginUser     = (data) => api.post(`/auth/login`, data)
export const logoutUser    = () => api.post(`/auth/logout`)

// Application Data
export const getUser       = (signal) => api.get(`/users/me`, { signal })
export const getWorkouts   = (limit=20) => api.get(`/workouts/`, { params: { limit } })
export const logWorkout    = (data)   => api.post('/workouts/', data)
export const deleteWorkout = (id)     => api.delete(`/workouts/${id}`)
export const getPerformance = ()      => api.get(`/performance/`)
export const getUpgrades   = ()       => api.get('/upgrades/')
export const unlockUpgrade = (data)   => api.post('/upgrades/unlock', data)
export const resetUser     = ()       => api.delete(`/users/me/reset`)
export const updateBodyweight = (bodyweight) => api.put(`/users/me/bodyweight`, { bodyweight })

export default api
