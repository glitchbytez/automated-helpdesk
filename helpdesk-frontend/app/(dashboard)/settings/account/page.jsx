"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react"
import { userService } from "@/lib/services/user-service"
import { showToast } from "@/lib/utils/toast-helper"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function AccountManagementPage() {
    const router = useRouter()
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [user, setUser] = useState(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteConfirmation, setDeleteConfirmation] = useState("")

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setIsLoading(true)
                setError("")
                
                // Try to get user info from localStorage as fallback
                let userFromStorage = null;
                let requirePasswordChange = false;
                
                if (typeof window !== "undefined") {
                    try {
                        const userJson = localStorage.getItem("user");
                        if (userJson) {
                            userFromStorage = JSON.parse(userJson);
                        }
                        
                        // Check if password change is required
                        requirePasswordChange = localStorage.getItem("requirePasswordChange") === "true";
                        
                        // Show notification if password change is required
                        if (requirePasswordChange) {
                            showToast.warning("You need to change your password before continuing", {
                                duration: 5000,
                                id: "password-change-required"
                            });
                        }
                    } catch (e) {
                        console.warn("Could not parse user from localStorage", e);
                    }
                }
                
                try {
                    const response = await userService.getProfile()
                    
                    if (response.data && response.data.user) {
                        const userData = response.data.user
                        const user = {
                            id: userData._id,
                            name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
                            email: userData.email || '',
                        }
                        setUser(user)
                        
                        // Save to localStorage for future fallback
                        if (typeof window !== "undefined") {
                            localStorage.setItem("user", JSON.stringify(user));
                        }
                    } else if (userFromStorage) {
                        // Use fallback from localStorage
                        setUser(userFromStorage);
                        console.log("Using user data from localStorage");
                    } else {
                        setError("Failed to load user data");
                    }
                } catch (apiError) {
                    console.error("API Error fetching user:", apiError);
                    
                    if (userFromStorage) {
                        // Use fallback from localStorage
                        setUser(userFromStorage);
                        console.log("Using user data from localStorage due to API error");
                    } else {
                        setError("Could not connect to the server. Some features may be limited.");
                        showToast.error("Connection to server failed");
                    }
                }
            } catch (error) {
                console.error("Error in fetchUserData:", error);
                setError("Failed to load user data. Some features may be limited.");
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchUserData();
    }, [])

    const validatePassword = (password) => {
        // At least 8 characters, with at least one uppercase, one lowercase, one number, and one special character
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/
        return regex.test(password)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSuccess(false)

        if (!currentPassword) {
            setError("Current password is required.")
            return
        }

        if (!validatePassword(newPassword)) {
            setError(
                "New password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters."
            )
            return
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        try {
            setIsSubmitting(true)
            
            const passwordData = {
                currentPassword,
                newPassword
            }
            
            try {
                await userService.updatePassword(passwordData)
                showToast.success("Password has been updated successfully. Please log in with your new password.")
                setSuccess(true)
                
                // Clear form
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
                
                // Clear the password change requirement flag
                if (typeof window !== "undefined") {
                    localStorage.setItem("requirePasswordChange", "false")
                    
                    // Update user object in localStorage to set requirePasswordChange to false
                    try {
                        const userJson = localStorage.getItem("user")
                        if (userJson) {
                            const userData = JSON.parse(userJson)
                            userData.requirePasswordChange = false
                            localStorage.setItem("user", JSON.stringify(userData))
                        }
                    } catch (e) {
                        console.warn("Could not update user in localStorage", e)
                    }
                }
                
                // Show a message and redirect to login after a short delay
                setTimeout(() => {
                    // Clear user data from localStorage
                    localStorage.removeItem("user")
                    localStorage.removeItem("token")
                    
                    // Redirect to login page
                    router.push("/login")
                }, 2000) // 2 second delay to show the success message
            } catch (apiError) {
                console.error("API Error updating password:", apiError)
                if (apiError.message && apiError.message.includes("Failed to fetch")) {
                    setError("Could not connect to the server. Please try again later.")
                    showToast.error("Connection to server failed")
                } else {
                    setError(apiError.message || "Failed to update password. Please try again.")
                    showToast.error("Failed to update password")
                }
            }
        } catch (error) {
            console.error("Error in password update:", error)
            setError("An unexpected error occurred. Please try again.")
            showToast.error("Failed to update password")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== user?.email) {
            setError("Please enter your email correctly to confirm account deletion")
            return
        }

        try {
            setIsDeleting(true)
            
            try {
                await userService.deleteUser(user.id)
                
                // Clear local storage
                if (typeof window !== "undefined") {
                    localStorage.clear();
                }
                
                showToast.success("Your account has been deleted successfully")
                
                // Redirect to login page
                router.push("/login")
            } catch (apiError) {
                console.error("API Error deleting account:", apiError)
                if (apiError.message && apiError.message.includes("Failed to fetch")) {
                    setError("Could not connect to the server. Please try again later.")
                    showToast.error("Connection to server failed")
                } else {
                    setError(apiError.message || "Failed to delete account. Please try again.")
                    showToast.error("Failed to delete account")
                }
                setIsDeleting(false)
                setDeleteDialogOpen(false)
            }
        } catch (error) {
            console.error("Error in account deletion:", error)
            setError("An unexpected error occurred. Please try again.")
            showToast.error("Failed to delete account")
            setIsDeleting(false)
            setDeleteDialogOpen(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/settings">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold">Account Management</h1>
                </div>
                
                <div className="flex justify-center items-center h-64">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading user data...</p>
                    </div>
                </div>
            </div>
        )
    }
    
    // Show limited functionality if we couldn't load user data but we're not loading
    const showLimitedFunctionality = !isLoading && !user

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/settings">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold">Account Management</h1>
                    <p className="text-xs text-muted-foreground">Manage your account security and settings</p>
                </div>
            </div>

            <Separator />

            {showLimitedFunctionality && (
                <Alert className="mb-4">
                    <AlertTitle>Limited Functionality</AlertTitle>
                    <AlertDescription>
                        We couldn't connect to the server. Some features may be limited until the connection is restored.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Change Password Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Change Password</CardTitle>
                        <CardDescription className="text-xs">Update your account password</CardDescription>
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
                                    <AlertDescription>Password has been updated successfully.</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="current-password" className="text-xs">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    disabled={success || isSubmitting}
                                    className="text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-password" className="text-xs">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    disabled={success || isSubmitting}
                                    className="text-xs"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Password must be at least 8 characters and include uppercase, lowercase, numbers, and special
                                    characters.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password" className="text-xs">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    disabled={success || isSubmitting}
                                    className="text-xs"
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                type="submit" 
                                disabled={success || isSubmitting} 
                                className="ml-auto text-xs" 
                                size="sm"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>Update Password</>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Delete Account Card - Only show if we have user data */}
                {user ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-destructive">Danger Zone</CardTitle>
                            <CardDescription className="text-xs">Irreversible and destructive actions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="text-xs font-medium">Delete Account</h3>
                                <p className="text-[10px] text-muted-foreground">
                                    Permanently delete your account and all of your data. This action cannot be undone.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="text-xs">
                                        Delete Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                                        <DialogDescription>
                                            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <p className="text-sm font-medium">
                                            To confirm, please type your email address: <span className="font-bold">{user?.email}</span>
                                        </p>
                                        <Input
                                            value={deleteConfirmation}
                                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting} size="sm">
                                            Cancel
                                        </Button>
                                        <Button 
                                            variant="destructive" 
                                            onClick={handleDeleteAccount}
                                            disabled={isDeleting || deleteConfirmation !== user?.email}
                                            size="sm"
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                "Delete Account"
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>
                ) : (
                    /* Show message if delete account is not available */
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground">Danger Zone</CardTitle>
                            <CardDescription className="text-xs">This feature is currently unavailable</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="text-xs font-medium">Delete Account</h3>
                                <p className="text-[10px] text-muted-foreground">
                                    Account deletion requires a connection to the server. Please try again when the connection is restored.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" disabled size="sm" className="text-xs">
                                Delete Account
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    )
}
