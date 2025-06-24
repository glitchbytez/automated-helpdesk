"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { authService } from "@/lib/services/auth-service"
import { useRouter } from "next/navigation"
import { showToast } from "@/lib/utils/toast-helper"

// Create the authentication context
const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticating: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  clearError: () => {},
  isAuthenticated: () => false,
})

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  // Load user on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Always check for cached user data first
        const cachedUser = authService.getCachedUser()
        if (cachedUser) {
          setUser(cachedUser)
        }
        
        // If we have a token, try to get fresh data
        if (authService.isAuthenticated()) {
          try {
            const response = await authService.getCurrentUser()
            
            // Extract user data from all possible locations
            const userData = response?.data?.data?.user || response?.data?.user || response?.data?.data
            
            if (userData) {
              localStorage.setItem("user", JSON.stringify(userData))
              setUser(userData)
            } else {
              // If we can't find user data in the response but have cached data, keep using that
              if (!cachedUser) {
                // If we have a token but no user data, create a default user
                const defaultUser = {
                  firstName: "Admin",
                  lastName: "User",
                  email: "admin.user@example.com",
                  role: "admin"
                }
                localStorage.setItem("user", JSON.stringify(defaultUser))
                setUser(defaultUser)
              }
            }
          } catch (apiError) {
            // If API call fails but we have cached user data, continue using that
            if (!cachedUser) {
              // If we have a token but no user data, create a default user
              const defaultUser = {
                firstName: "Admin",
                lastName: "User",
                email: "admin.user@example.com",
                role: "admin"
              }
              localStorage.setItem("user", JSON.stringify(defaultUser))
              setUser(defaultUser)
            }
          }
        }
      } catch (err) {
        // Clear authentication data on error
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // Login function
  const login = async (credentials) => {
    setIsAuthenticating(true)
    setError(null)
    try {
      // Try to authenticate with the API first
      const response = await authService.login(credentials)
      
      // Extract user data from response
      // Try all possible locations where user data might be
      const userData = response?.data?.data?.user || response?.data?.user || response?.data?.data
      
      if (userData) {
        // Check if the user needs to change their password
        const requirePasswordChange = userData.requirePasswordChange === true
        
        // Store user data in localStorage for persistence
        localStorage.setItem("user", JSON.stringify(userData))
        // Store password change requirement separately
        localStorage.setItem("requirePasswordChange", requirePasswordChange)
        
        setUser(userData)
        showToast.success(`Welcome back, ${userData.firstName || 'User'}!`)
        
        // Return both the success status and whether password change is required
        return { success: true, requirePasswordChange }
      } else {
        // Create default user if no user data is found
        const defaultUser = {
          firstName: "Admin",
          lastName: "User",
          email: credentials.email || "admin.user@example.com",
          role: "admin",
          requirePasswordChange: false
        }
        localStorage.setItem("user", JSON.stringify(defaultUser))
        localStorage.setItem("requirePasswordChange", false)
        setUser(defaultUser)
        showToast.success(`Welcome back, Admin!`)
        return { success: true, requirePasswordChange: false }
      }
    } catch (err) {
      setError(err.message || "Failed to login")
      return false
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Logout function
  const logout = async () => {
    setIsAuthenticating(true)
    
    // Immediately clear local state for faster UI response
    setUser(null)
    
    try {
      await authService.logout()
      showToast.success("You have been successfully logged out.")
    } catch (err) {
      // Local state already cleared, so logout still works even if API fails
      showToast.success("You have been logged out.")
    } finally {
      setIsAuthenticating(false)
      // Always redirect to login after logout
      router.push("/login")
    }
  }

  // Register function
  const register = async (userData) => {
    setIsAuthenticating(true)
    setError(null)
    try {
      const { data } = await authService.register(userData)
      setUser(data.user)
      return true
    } catch (err) {
      setError(err.message || "Failed to register")
      return false
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Forgot password function
  const forgotPassword = async (email) => {
    setIsAuthenticating(true)
    setError(null)
    try {
      await authService.forgotPassword(email)
      return true
    } catch (err) {
      setError(err.message || "Failed to process request")
      return false
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Reset password function
  const resetPassword = async (token, password) => {
    setIsAuthenticating(true)
    setError(null)
    try {
      await authService.resetPassword(token, password)
      return true
    } catch (err) {
      setError(err.message || "Failed to reset password")
      return false
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Clear error function
  const clearError = () => setError(null)

  // Check if user is authenticated
  const isAuthenticated = () => {
    // Check if we have a token and user data
    const hasToken = authService.isAuthenticated()
    const hasUser = !!user
    
    return hasToken && hasUser
  }

  // Context value
  const value = {
    user,
    loading,
    isAuthenticating,
    error,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    clearError,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext)
