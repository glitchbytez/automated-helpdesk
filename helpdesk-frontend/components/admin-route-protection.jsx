"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function AdminRouteProtection({ children }) {
  const router = useRouter()
  const { user, loading, isAuthenticated } = useAuth()

  useEffect(() => {
    // Only redirect after auth has loaded to prevent flashes
    if (!loading) {
      // Check if we have a token but no user (might be loading user data)
      const hasToken = typeof window !== "undefined" && localStorage.getItem("token")
      
      // If no token at all, redirect to login
      if (!hasToken) {
        router.push("/login")
        return
      }
      
      // If we have a token but no user yet, wait for user data to load
      if (hasToken && !user) {
        return
      }
      
      // If we have token and user but auth check fails, redirect to login
      if (hasToken && user && !isAuthenticated()) {
        router.push("/login")
        return
      }
      
      // If user is logged in but not an admin, redirect to dashboard
      if (user && user.role !== "admin") {
        router.push("/dashboard")
        return
      }
    }
  }, [user, loading, router, isAuthenticated])

  // While loading, show loading state
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if we should show content or redirect
  const hasToken = typeof window !== "undefined" && localStorage.getItem("token")
  
  // If no token, show auth required message (while redirect is happening)
  if (!hasToken) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Authentication Required</h2>
          <p className="text-sm text-muted-foreground">
            Please log in to access this page.
          </p>
        </div>
      </div>
    )
  }
  
  // If we have a token but no user yet, show loading (user data is being fetched)
  if (hasToken && !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading user data...</p>
        </div>
      </div>
    )
  }
  
  // If we have token and user but auth check fails, show error (while redirect happens)
  if (hasToken && user && !isAuthenticated()) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Session Invalid</h2>
          <p className="text-sm text-muted-foreground">
            Your session has expired. Please log in again.
          </p>
        </div>
      </div>
    )
  }

  // If user is not admin, show access denied (while redirect is happening)
  if (user && user.role !== "admin") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    )
  }

  // If user is admin, render the protected content
  return children
}
