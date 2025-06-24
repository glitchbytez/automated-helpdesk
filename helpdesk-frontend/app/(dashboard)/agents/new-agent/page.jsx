"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Loader2 } from "lucide-react"
import { userService } from "@/lib/services/user-service"
import { toast } from "sonner"
import { AdminRouteProtection } from "@/components/admin-route-protection"

export default function NewAgentPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formErrors, setFormErrors] = useState({})

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        role: "",
        team: "",
        permissions: ["viewTickets", "createTickets", "assignTickets"],
        password: "",
        confirmPassword: "",
        requirePasswordChange: true,
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleCheckboxChange = (permission) => {
        setFormData((prev) => {
            const newPermissions = prev.permissions.includes(permission)
                ? prev.permissions.filter((p) => p !== permission)
                : [...prev.permissions, permission]

            return {
                ...prev,
                permissions: newPermissions,
            }
        })
    }

    const handleSelectChange = (name, value) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const validateForm = () => {
        const errors = {}
        
        if (!formData.firstName.trim()) errors.firstName = "First name is required"
        if (!formData.lastName.trim()) errors.lastName = "Last name is required"
        
        if (!formData.email.trim()) {
            errors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Please enter a valid email address"
        }
        
        if (!formData.role) errors.role = "Role is required"
        
        if (!formData.password) {
            errors.password = "Password is required"
        } else if (formData.password.length < 8) {
            errors.password = "Password must be at least 8 characters"
        }
        
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match"
        }
        
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!validateForm()) {
            toast.error("Please fix the errors in the form")
            return
        }
        
        try {
            setIsLoading(true)
            
            // Prepare the data for the API
            const userData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone || undefined,
                jobTitle: formData.jobTitle || undefined,
                role: formData.role,
                team: formData.team || undefined,
                permissions: formData.permissions,
                password: formData.password,
                requirePasswordChange: formData.requirePasswordChange
            }
            
            console.log("Creating new agent:", userData)
            
            // Call the API to create the user
            const response = await userService.createUser(userData)
            
            console.log("Agent created successfully:", response.data)
            toast.success("Agent created successfully")
            
            // Redirect to the agents list page
            router.push("/agents")
        } catch (error) {
            console.error("Error creating agent:", error)
            toast.error(`Failed to create agent: ${error.response?.data?.message || error.message || 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AdminRouteProtection>
            <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/agents">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold">Add New Agent</h1>
                    <p className="text-xs text-muted-foreground">Create a new support agent account</p>
                </div>
            </div>

            <Separator />

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Agent Information</CardTitle>
                            <CardDescription className="text-xs">
                                Enter the new agent's personal and contact information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-xs">
                                        First Name
                                    </Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="First name"
                                        className={`text-xs ${formErrors.firstName ? 'border-red-500' : ''}`}
                                    />
                                    {formErrors.firstName && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-xs">
                                        Last Name
                                    </Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Last name"
                                        className={`text-xs ${formErrors.lastName ? 'border-red-500' : ''}`}
                                    />
                                    {formErrors.lastName && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    type="email"
                                    placeholder="Email address"
                                    className={`text-xs ${formErrors.email ? 'border-red-500' : ''}`}
                                />
                                {formErrors.email && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-xs">
                                    Phone Number (Optional)
                                </Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    type="tel"
                                    placeholder="Phone number"
                                    className="text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="jobTitle" className="text-xs">
                                    Job Title
                                </Label>
                                <Input
                                    id="jobTitle"
                                    name="jobTitle"
                                    value={formData.jobTitle}
                                    onChange={handleChange}
                                    placeholder="Job title"
                                    className="text-xs"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Account Settings</CardTitle>
                                <CardDescription className="text-xs">Configure the agent's role and permissions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-xs">
                                        Role
                                    </Label>
                                    <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                                        <SelectTrigger id="role" className={`text-xs ${formErrors.role ? 'border-red-500' : ''}`}>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                    {formErrors.role && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.role}</p>
                                    )}
                                        <SelectContent>
                                            <SelectItem value="admin" className="text-xs">
                                                Admin
                                            </SelectItem>
                                            <SelectItem value="agent" className="text-xs">
                                                Agent
                                            </SelectItem>
                                            <SelectItem value="limited" className="text-xs">
                                                Limited Agent
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="team" className="text-xs">
                                        Team
                                    </Label>
                                    <Select value={formData.team} onValueChange={(value) => handleSelectChange("team", value)}>
                                        <SelectTrigger id="team" className="text-xs">
                                            <SelectValue placeholder="Select team" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="support" className="text-xs">
                                                Customer Support
                                            </SelectItem>
                                            <SelectItem value="technical" className="text-xs">
                                                Technical Support
                                            </SelectItem>
                                            <SelectItem value="billing" className="text-xs">
                                                Billing Support
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Permissions</Label>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="viewTickets"
                                                checked={formData.permissions.includes("viewTickets")}
                                                onCheckedChange={() => handleCheckboxChange("viewTickets")}
                                            />
                                            <Label htmlFor="viewTickets" className="text-xs">
                                                View Tickets
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="createTickets"
                                                checked={formData.permissions.includes("createTickets")}
                                                onCheckedChange={() => handleCheckboxChange("createTickets")}
                                            />
                                            <Label htmlFor="createTickets" className="text-xs">
                                                Create Tickets
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="assignTickets"
                                                checked={formData.permissions.includes("assignTickets")}
                                                onCheckedChange={() => handleCheckboxChange("assignTickets")}
                                            />
                                            <Label htmlFor="assignTickets" className="text-xs">
                                                Assign Tickets
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="deleteTickets"
                                                checked={formData.permissions.includes("deleteTickets")}
                                                onCheckedChange={() => handleCheckboxChange("deleteTickets")}
                                            />
                                            <Label htmlFor="deleteTickets" className="text-xs">
                                                Delete Tickets
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="manageAgents"
                                                checked={formData.permissions.includes("manageAgents")}
                                                onCheckedChange={() => handleCheckboxChange("manageAgents")}
                                            />
                                            <Label htmlFor="manageAgents" className="text-xs">
                                                Manage Agents
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="manageSettings"
                                                checked={formData.permissions.includes("manageSettings")}
                                                onCheckedChange={() => handleCheckboxChange("manageSettings")}
                                            />
                                            <Label htmlFor="manageSettings" className="text-xs">
                                                Manage Settings
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Initial Password</CardTitle>
                                <CardDescription className="text-xs">Set the initial password for the agent</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-xs">
                                        Password
                                    </Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        type="password"
                                        className={`text-xs ${formErrors.password ? 'border-red-500' : ''}`}
                                    />
                                    {formErrors.password && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-xs">
                                        Confirm Password
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        type="password"
                                        className={`text-xs ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                                    />
                                    {formErrors.confirmPassword && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.confirmPassword}</p>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="requirePasswordChange"
                                        checked={formData.requirePasswordChange}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                requirePasswordChange: checked,
                                            }))
                                        }
                                    />
                                    <Label htmlFor="requirePasswordChange" className="text-xs">
                                        Require password change on first login
                                    </Label>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" asChild className="text-xs">
                                    <Link href="/agents">Cancel</Link>
                                </Button>
                                <Button type="submit" className="text-xs" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Agent"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </form>
            </div>
        </AdminRouteProtection>
    )
}

