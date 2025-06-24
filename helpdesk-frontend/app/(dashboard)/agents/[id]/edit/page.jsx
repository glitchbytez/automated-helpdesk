"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Save, User } from "lucide-react"
import { userService } from "@/lib/services/user-service"
import { showToast } from "@/lib/utils/toast-helper"
import { AdminRouteProtection } from "@/components/admin-route-protection"

export default function EditAgentPage({ params }) {
    const router = useRouter()
    const agentId = use(params).id
    const [isLoading, setIsLoading] = useState(false)
    
    // Initialize with empty agent data
    const [agent, setAgent] = useState({
        id: agentId,
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        avatar: "",
        role: "agent",
        team: "",
        status: "Active",
        bio: "",
        permissions: []
    })
    
    // State for available roles and permissions from backend
    const [availableRoles, setAvailableRoles] = useState([])
    const [availablePermissions, setAvailablePermissions] = useState([])
    const [loadingRolesPermissions, setLoadingRolesPermissions] = useState(true)

    // Fetch roles and permissions
    useEffect(() => {
        const fetchRolesAndPermissions = async () => {
            try {
                setLoadingRolesPermissions(true)
                const data = await userService.getRolesAndPermissions()
                
                if (data) {
                    setAvailableRoles(data.roles || [])
                    setAvailablePermissions(data.permissions || [])
                }
            } catch (error) {
                console.error("Error fetching roles and permissions:", error)
                // Use default values if API fails
                setAvailableRoles(["admin", "agent", "limited"])
                setAvailablePermissions([
                    "viewTickets",
                    "createTickets",
                    "assignTickets",
                    "deleteTickets",
                    "manageAgents",
                    "manageSettings",
                    "manageKnowledgeBase"
                ])
            } finally {
                setLoadingRolesPermissions(false)
            }
        }
        
        fetchRolesAndPermissions()
    }, [])

    // Define mapping for backend to display values
    const backendToDisplayTeamMapping = {
        "support": "Customer Support",
        "technical": "Technical Support",
        "billing": "Billing Support"
    }
    
    const backendToDisplayRoleMapping = {
        "admin": "Admin",
        "agent": "Agent",
        "limited": "Limited"
    }
    
    const backendToDisplayStatusMapping = {
        "active": "Active",
        "inactive": "Inactive",
        "away": "Away"
    }
    
    // Fetch agent data
    useEffect(() => {
        const fetchAgentData = async () => {
            try {
                setIsLoading(true)
                const response = await userService.getUser(agentId)
                
                if (response.data && response.data.user) {
                    const userData = response.data.user
                    
                    // Map backend values to display values
                    const backendTeam = userData.team || "support"
                    const backendRole = userData.role || "agent"
                    const backendStatus = userData.status || "active"
                    
                    setAgent({
                        id: userData._id || agentId,
                        firstName: userData.firstName || "",
                        lastName: userData.lastName || "",
                        email: userData.email || "",
                        phone: userData.phone || "",
                        avatar: userData.avatar || "",
                        role: backendToDisplayRoleMapping[backendRole] || "Agent",
                        team: backendToDisplayTeamMapping[backendTeam] || "Customer Support",
                        status: backendToDisplayStatusMapping[backendStatus] || "Active",
                        bio: userData.bio || "",
                        permissions: userData.permissions || []
                    })
                    
                    console.log("Loaded agent data:", {
                        backendTeam,
                        displayTeam: backendToDisplayTeamMapping[backendTeam],
                        backendStatus,
                        displayStatus: backendToDisplayStatusMapping[backendStatus]
                    })
                }
            } catch (error) {
                console.error("Error fetching agent data:", error)
                showToast.error("Failed to load agent data")
            } finally {
                setIsLoading(false)
            }
        }
        
        if (agentId) {
            fetchAgentData()
        }
    }, [agentId])

    const handleChange = (e) => {
        const { name, value } = e.target
        setAgent((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSelectChange = (name, value) => {
        setAgent((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSwitchChange = (name, checked) => {
        setAgent((prev) => ({
            ...prev,
            [name]: checked,
        }))
    }

    const handlePermissionChange = (permission, checked) => {
        setAgent((prev) => {
            if (checked) {
                return {
                    ...prev,
                    permissions: [...prev.permissions, permission],
                }
            } else {
                return {
                    ...prev,
                    permissions: prev.permissions.filter((p) => p !== permission),
                }
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        try {
            setIsLoading(true)
            
            // Map display values to valid backend enum values
            const displayToBackendTeamMapping = {
                "Customer Support": "support",
                "Technical Support": "technical",
                "Billing Support": "billing"
            }
            
            const displayToBackendRoleMapping = {
                "Admin": "admin",
                "Agent": "agent",
                "Limited": "limited"
            }
            
            const displayToBackendStatusMapping = {
                "Active": "active",
                "Inactive": "inactive",
                "Away": "away"
            }
            
            // Prepare the data to be sent to the backend
            const agentData = {
                firstName: agent.firstName,
                lastName: agent.lastName,
                email: agent.email,
                phone: agent.phone || '',
                // Map display values to backend enum values
                role: agent.role ? (displayToBackendRoleMapping[agent.role] || 'agent') : 'agent',
                team: agent.team ? (displayToBackendTeamMapping[agent.team] || 'support') : 'support',
                status: agent.status ? (displayToBackendStatusMapping[agent.status] || 'active') : 'active',
                bio: agent.bio || '',
                permissions: agent.permissions || []
            }
            
            console.log('Sending agent data:', {
                displayTeam: agent.team,
                backendTeam: agentData.team,
                displayStatus: agent.status,
                backendStatus: agentData.status
            })
            
            // Send the update request to the backend
            const response = await userService.updateUser(agentId, agentData)
            
            console.log('Update response:', response)
            
            showToast.success("Agent updated successfully")
            router.push(`/agents/${agentId}`)
        } catch (error) {
            console.error("Error updating agent:", error)
            showToast.error("Failed to update agent: " + (error.message || 'Unknown error'))
        } finally {
            setIsLoading(false)
        }
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
                <h1 className="text-xl font-semibold">Edit Agent</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Picture</CardTitle>
                            <CardDescription>Update the agent's profile picture</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center space-y-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={agent.avatar} alt={`${agent.firstName} ${agent.lastName}`} />
                                <AvatarFallback className="text-lg">
                                    {agent.firstName && agent.lastName
                                        ? `${agent.firstName[0]}${agent.lastName[0]}`
                                        : <User className="h-12 w-12" />
                                    }
                                </AvatarFallback>
                            </Avatar>
                            <Button variant="outline" size="sm" type="button">
                                Upload New Picture
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Update the agent's personal details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            name="firstName"
                                            value={agent.firstName}
                                            onChange={handleChange}
                                            placeholder="First Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            name="lastName"
                                            value={agent.lastName}
                                            onChange={handleChange}
                                            placeholder="Last Name"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={agent.email}
                                        onChange={handleChange}
                                        placeholder="Email Address"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={agent.phone}
                                        onChange={handleChange}
                                        placeholder="Phone Number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        name="bio"
                                        value={agent.bio}
                                        onChange={handleChange}
                                        placeholder="Agent bio"
                                        rows={4}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Role & Permissions</CardTitle>
                                <CardDescription>Configure the agent's role and access permissions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select value={agent.role} onValueChange={(value) => handleSelectChange("role", value)}>
                                            <SelectTrigger id="role">
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {loadingRolesPermissions ? (
                                                    <SelectItem value="loading">Loading roles...</SelectItem>
                                                ) : (
                                                    availableRoles.map(role => (
                                                        <SelectItem key={role} value={role}>
                                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="team">Team</Label>
                                        <Select value={agent.team} onValueChange={(value) => handleSelectChange("team", value)}>
                                            <SelectTrigger id="team">
                                                <SelectValue placeholder="Select team" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Customer Support">Customer Support</SelectItem>
                                                <SelectItem value="Technical Support">Technical Support</SelectItem>
                                                <SelectItem value="Billing Support">Billing Support</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={agent.status} onValueChange={(value) => handleSelectChange("status", value)}>
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Away">Away</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <Label>Permissions</Label>
                                    {loadingRolesPermissions ? (
                                        <div className="flex items-center justify-center py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                                <span>Loading permissions...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {availablePermissions.map((permissionId) => {
                                                // Convert camelCase to Title Case for display
                                                const displayName = permissionId
                                                    .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
                                                    .replace(/^./, str => str.toUpperCase()); // Capitalize the first letter
                                                
                                                return (
                                                    <div key={permissionId} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={permissionId}
                                                            checked={agent.permissions.includes(permissionId)}
                                                            onCheckedChange={(checked) => handlePermissionChange(permissionId, checked)}
                                                        />
                                                        <label
                                                            htmlFor={permissionId}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            {displayName}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" type="button" asChild>
                                <Link href={`/agents/${agentId}`}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
            </div>
        </AdminRouteProtection>
    )
}
