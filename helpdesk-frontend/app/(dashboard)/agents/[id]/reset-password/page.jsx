"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { userService } from "@/lib/services/user-service"
import { showToast } from "@/lib/utils/toast-helper"
import { AdminRouteProtection } from "@/components/admin-route-protection"

export default function ResetAgentPasswordPage({ params }) {
    const router = useRouter()
    const agentId = use(params).id
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [requirePasswordChange, setRequirePasswordChange] = useState(true)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [agent, setAgent] = useState(null)

    // Fetch agent data
    useEffect(() => {
        const fetchAgentData = async () => {
            try {
                setIsLoading(true)
                setError("")
                const response = await userService.getUser(agentId)
                
                if (response.data && response.data.user) {
                    const userData = response.data.user
                    setAgent({
                        id: userData._id || agentId,
                        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
                        email: userData.email || '',
                    })
                } else {
                    setError("Failed to load agent data")
                }
            } catch (error) {
                console.error("Error fetching agent:", error)
                setError("Failed to load agent data. Please try again.")
                showToast.error("Failed to load agent data")
            } finally {
                setIsLoading(false)
            }
        }
        
        if (agentId) {
            fetchAgentData()
        }
    }, [agentId])

    const validatePassword = (password) => {
        // At least 8 characters, with at least one uppercase, one lowercase, one number, and one special character
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/
        return regex.test(password)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSuccess(false)

        if (!validatePassword(password)) {
            setError(
                "Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.",
            )
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        try {
            setIsSubmitting(true)
            
            // Since there's no dedicated reset password endpoint,
            // we'll use the updateUser function instead
            const userData = {
                password,
                requirePasswordChange
            }
            
            await userService.updateUser(agent.id, userData)
            
            showToast.success("Password has been reset successfully")
            setSuccess(true)
            
            // Redirect after a delay
            setTimeout(() => {
                router.push(`/agents/${agentId}`)
            }, 2000)
        } catch (error) {
            console.error("Error resetting password:", error)
            setError(error.message || "Failed to reset password. Please try again.")
            showToast.error("Failed to reset password")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/agents">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold">Reset Password</h1>
                </div>
                
                <div className="flex justify-center items-center h-64">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading agent data...</p>
                    </div>
                </div>
            </div>
        )
    }
    
    if (!agent) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/agents">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold">Reset Password</h1>
                </div>
                
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                        <CardDescription>Could not load agent data</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error || "Agent not found"}</AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" asChild>
                            <Link href="/agents">Back to Agents</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <AdminRouteProtection>
            <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/agents/${agentId}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Reset Password</h1>
            </div>

            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Reset Password for {agent.name}</CardTitle>
                    <CardDescription>Set a new password for this agent</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="bg-green-100 text-green-800">
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>Password has been reset successfully.</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-1">
                            <Label htmlFor="agent-email">Email</Label>
                            <Input id="agent-email" type="email" value={agent.email} readOnly disabled />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                disabled={success || isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Password must be at least 8 characters and include uppercase, lowercase, numbers, and special
                                characters.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                disabled={success || isSubmitting}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="require-change"
                                checked={requirePasswordChange}
                                onCheckedChange={setRequirePasswordChange}
                                disabled={success || isSubmitting}
                            />
                            <label
                                htmlFor="require-change"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Require password change on next login
                            </label>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" type="button" asChild disabled={isSubmitting}>
                            <Link href={`/agents/${agentId}`}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={success || isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Reset Password
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            </div>
        </AdminRouteProtection>
    )
}

