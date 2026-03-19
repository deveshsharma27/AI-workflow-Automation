import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

// Named export so AppRoutes can use useContext(AuthContext) directly
export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]           = useState(null)
  const [token, setToken]         = useState(localStorage.getItem('token'))
  const [loading, setLoading]     = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(true) // initial session check

  // Rehydrate user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)) } catch (_) {}
    }
    setLoadingAuth(false)
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await authAPI.login({ email, password })
      const { token: newToken, user: userData } = res.data
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      setToken(newToken)
      setUser(userData)
      return { success: true }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please try again.'
      }
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    try {
      const res = await authAPI.register({ name, email, password })
      const { token: newToken, user: userData } = res.data
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      setToken(newToken)
      setUser(userData)
      return { success: true }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Please try again.'
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, loadingAuth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Convenience hook — used by components (Sidebar, pages, etc.)
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}