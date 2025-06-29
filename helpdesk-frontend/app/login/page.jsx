"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from '@/components/header'
import { useAuth } from '@/contexts/auth-context'
import { showToast } from "@/lib/utils/toast-helper"
import { requestService } from "@/lib/services/request-service"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const { login, error: authError, isAuthenticating } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    
    // Request form states
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
    const [requestType, setRequestType] = useState("")
    const [requestForm, setRequestForm] = useState({
        requesterEmail: "",
        requesterName: "",
        reason: "",
    })
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

    const handleEmailChange = (e) => setEmail(e.target.value)
    const handlePasswordChange = (e) => setPassword(e.target.value)
    const togglePasswordVisibility = () => setShowPassword(!showPassword)
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isLoading) {
            e.preventDefault()
            handleLogin()
        }
    }

    // Update local error state when auth context error changes
    useEffect(() => {
        if (authError) {
            setError(authError)
        }
    }, [authError])

    const handleLogin = async () => {
        // Clear any previous errors
        setError("")
        
        // Client-side validation
        if (!email && !password) {
            setError("Please enter your email and password to sign in")
            return
        }
        
        if (!email) {
            setError("Please enter your email address")
            return
        }
        
        if (!password) {
            setError("Please enter your password")
            return
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address")
            return
        }

        // Set loading state
        setIsLoading(true)

        try {
            // Use the auth context login function
            const result = await login({ email, password })
            
            if (result && result.success) {
                // Check if password change is required
                if (result.requirePasswordChange) {
                    // Show notification about password change requirement
                    showToast.info("You need to change your password before continuing", {
                        duration: 5000
                    })
                    
                    // Redirect to account settings page
                    setTimeout(() => {
                        router.push("/settings/account")
                    }, 500)
                } else {
                    // Normal login flow - redirect to dashboard
                    setTimeout(() => {
                        router.push("/dashboard")
                    }, 500)
                }
            } else {
                setIsLoading(false)
            }
        } catch (err) {
            setIsLoading(false)
            
            // Handle different types of errors with specific messages
            const errorMessage = err.response?.data?.message || err.message || ""
            
            if (errorMessage.toLowerCase().includes("incorrect email or password")) {
                setError("Invalid email or password. Please check your credentials and try again.")
            } else if (errorMessage.toLowerCase().includes("please provide email and password")) {
                setError("Please enter both email and password")
            } else if (errorMessage.toLowerCase().includes("no user") || errorMessage.toLowerCase().includes("user not found")) {
                setError("No account found with this email address. Please check your email or contact an administrator.")
            } else if (errorMessage.toLowerCase().includes("network") || errorMessage.toLowerCase().includes("fetch")) {
                setError("Unable to connect to the server. Please check your internet connection and try again.")
            } else if (errorMessage.toLowerCase().includes("timeout")) {
                setError("The request timed out. Please try again in a moment.")
            } else if (errorMessage.toLowerCase().includes("server error") || errorMessage.toLowerCase().includes("internal server")) {
                setError("Server error occurred. Please try again later or contact support if the problem persists.")
            } else if (errorMessage.toLowerCase().includes("too many requests") || errorMessage.toLowerCase().includes("rate limit")) {
                setError("Too many login attempts. Please wait a few minutes before trying again.")
            } else if (errorMessage.toLowerCase().includes("account locked") || errorMessage.toLowerCase().includes("account disabled")) {
                setError("Your account has been locked or disabled. Please contact an administrator for assistance.")
            } else if (errorMessage.toLowerCase().includes("unauthorized") || errorMessage.toLowerCase().includes("forbidden")) {
                setError("Access denied. Please check your credentials or contact an administrator.")
            } else if (errorMessage) {
                // If we have a specific error message, use it
                setError(errorMessage)
            } else {
                // Generic fallback error
                setError("Unable to sign in. Please check your credentials and try again.")
            }
        }
    }

    const handleRequestSubmit = async () => {
        // Validate required fields based on request type
        if (!requestForm.requesterEmail || !requestForm.requesterName || !requestForm.reason) {
            showToast.error("Please fill in all required fields (Email, Full Name, and Reason)")
            return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(requestForm.requesterEmail)) {
            showToast.error("Please enter a valid email address")
            return
        }

        setIsSubmittingRequest(true)
        
        try {
            await requestService.createRequest({
                type: requestType,
                ...requestForm,
            })
            
            showToast.success("Request submitted successfully! An administrator will review your request shortly.")
            setIsRequestDialogOpen(false)
            setRequestType("")
            setRequestForm({
                requesterEmail: "",
                requesterName: "",
                reason: "",
            })
        } catch (error) {
            console.error("Request submission error:", error)
            
            // Handle specific error cases
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to submit request. Please try again."
            
            // Provide specific feedback for password reset when user not found
            if (requestType === "password_reset" && errorMessage.toLowerCase().includes("no user found")) {
                showToast.error(
                    "No account found with that email address. Please check your email or contact an administrator for account creation.",
                    { duration: 6000 }
                )
            } else if (requestType === "account_opening" && errorMessage.toLowerCase().includes("already exists")) {
                showToast.error(
                    "An account with this email already exists. Try logging in or use the 'Forgot password?' option.",
                    { duration: 6000 }
                )
            } else {
                showToast.error(errorMessage)
            }
        } finally {
            setIsSubmittingRequest(false)
        }
    }

    const openRequestDialog = (type) => {
        setRequestType(type)
        // Clear form when opening dialog
        setRequestForm({
            requesterEmail: "",
            requesterName: "",
            reason: "",
        })
        setIsRequestDialogOpen(true)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <Header />

                <Card>
                    <CardHeader>
                        <CardTitle>Sign in to your account</CardTitle>
                        <CardDescription>Enter your credentials to access the helpdesk</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={handleEmailChange}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <button
                                    type="button"
                                    onClick={() => openRequestDialog("password_reset")}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={handlePasswordChange}
                                    onKeyDown={handleKeyDown}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            className="w-full" 
                            disabled={isLoading}
                            onClick={handleLogin}
                            type="button"
                        >
                            {isLoading ? (
                                <>
                                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                <div className="text-center text-sm">
                    <p className="text-gray-500 dark:text-gray-400">
                        Don&apos;t have an account?{" "}
                        <button
                            type="button"
                            onClick={() => openRequestDialog("account_opening")}
                            className="text-primary hover:underline"
                        >
                            Contact your administrator
                        </button>
                    </p>
                </div>

                {/* Request Dialog */}
                <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>
                                {requestType === "account_opening" ? "Request Account Access" : "Reset Password Request"}
                            </DialogTitle>
                            <DialogDescription>
                                {requestType === "account_opening" 
                                    ? "Fill out this form to request access to the campus support system. An administrator will review your request."
                                    : "Enter your email, name, and reason for the password reset. We'll verify your account and an administrator will review your request."
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="requesterEmail">Email Address *</Label>
                                <Input
                                    id="requesterEmail"
                                    type="email"
                                    value={requestForm.requesterEmail}
                                    onChange={(e) => setRequestForm(prev => ({ ...prev, requesterEmail: e.target.value }))}
                                    placeholder="your.email@university.edu"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="requesterName">Full Name *</Label>
                                <Input
                                    id="requesterName"
                                    value={requestForm.requesterName}
                                    onChange={(e) => setRequestForm(prev => ({ ...prev, requesterName: e.target.value }))}
                                    placeholder="John Doe"
                                />
                            </div>
                            

                            
                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason for Request *</Label>
                                <Textarea
                                    id="reason"
                                    value={requestForm.reason}
                                    onChange={(e) => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder={requestType === "account_opening" 
                                        ? "Please explain why you need access to the campus support system..."
                                        : "Please explain why you need to reset your password..."
                                    }
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsRequestDialogOpen(false)}
                                disabled={isSubmittingRequest}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRequestSubmit}
                                disabled={isSubmittingRequest}
                            >
                                {isSubmittingRequest ? (
                                    <>
                                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Request"
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
