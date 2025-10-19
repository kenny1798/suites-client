import axios from "axios"

export const msmartAxios = axios.create({
  baseURL: import.meta.env.VITE_MSMART     // was REACT_APP_MSMART
})

const api = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER}` // was REACT_APP_SERVER
})

// attach token on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers['accessToken'] = token
    return config
  },
  (error) => Promise.reject(error)
)

// optional: auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      try { localStorage.removeItem('accessToken') } catch {}
    }
    return Promise.reject(err)
  }
)

export default api
