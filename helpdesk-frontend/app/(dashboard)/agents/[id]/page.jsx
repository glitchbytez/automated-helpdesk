"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Mail, Phone, Edit, Loader2 } from "lucide-react"
import { userService } from "@/lib/services/user-service"
import { toast } from "sonner"
import { AdminRouteProtection } from "@/components/admin-route-protection"

export default function AgentProfilePage({ params }) {
    const router = useRouter()
    const agentId = use(params).id
    const [agent, setAgent] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    // Prevent this route from handling "new"
    if (agentId === "new") {
        router.push("/agents/new-agent")
        return null
    }

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
                setError(null)
                const response = await userService.getUser(agentId)
                
                if (response.data && response.data.user) {
                    const userData = response.data.user
                    
                    // Map backend values to display values
                    const backendRole = userData.role || "agent"
                    const backendTeam = userData.team || "support"
                    const backendStatus = userData.status || "active"
                    
                    // Format agent data
                    setAgent({
                        id: userData._id || agentId,
                        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
                        email: userData.email || '',
                        phone: userData.phone || 'Not provided',
                        avatar: userData.avatar || '',
                        role: backendToDisplayRoleMapping[backendRole] || 'Agent',
                        team: backendToDisplayTeamMapping[backendTeam] || 'Customer Support',
                        status: backendToDisplayStatusMapping[backendStatus] || 'Active',
                        bio: userData.bio || 'No bio provided',
                        joinedAt: userData.createdAt || new Date().toISOString(),
                        lastActive: userData.lastActive || userData.updatedAt || userData.createdAt || new Date().toISOString(),
                        statistics: {
                            assignedTickets: userData.assignedTicketsCount || 0,
                            resolvedTickets: userData.resolvedTicketsCount || 0,
                            averageResponseTime: userData.averageResponseTime || 0,
                            customerSatisfaction: userData.customerSatisfaction || 0,
                            activeChats: userData.activeChats || 0,
                        },
                        skills: userData.skills || ["Support"],
                        permissions: userData.permissions || [],
                    })
                    
                    console.log("Loaded agent profile data:", {
                        backendRole,
                        displayRole: backendToDisplayRoleMapping[backendRole],
                        backendTeam,
                        displayTeam: backendToDisplayTeamMapping[backendTeam],
                        backendStatus,
                        displayStatus: backendToDisplayStatusMapping[backendStatus]
                    })
                } else {
                    setError("Failed to load agent data")
                }
            } catch (error) {
                console.error("Error fetching agent:", error)
                setError("Failed to load agent data. Please try again.")
                toast.error("Failed to load agent data")
            } finally {
                setIsLoading(false)
            }
        }
        
        if (agentId) {
            fetchAgentData()
        }
    }, [agentId])

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full py-12">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading agent data...</p>
                </div>
            </div>
        )
    }

    if (error || !agent) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <h2 className="text-xl font-semibold mb-2">Error</h2>
                <p className="text-muted-foreground">{error || "Agent not found"}</p>
                <Button variant="outline" className="mt-4" asChild>
                    <Link href="/agents">Back to Agents</Link>
                </Button>
            </div>
        )
    }

    return (
        <AdminRouteProtection>
            <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/agents">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Agent Profile</h1>
                <div className="ml-auto">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/agents/${agentId}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader className="pb-3">
                        <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center text-center">
                            <Avatar className="h-24 w-24 mb-3">
                                <AvatarImage src={agent.avatar} alt={agent.name} />
                                <AvatarFallback className="text-lg">{agent.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                            </Avatar>
                            <h3 className="text-lg font-semibold">{agent.name}</h3>
                            <p className="text-sm text-muted-foreground">{agent.role}</p>
                            <div className="mt-1 flex items-center">
                                <Badge variant="outline" className={`${agent.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                    {agent.status}
                                </Badge>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">{agent.email}</span>
                            </div>
                            <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">{agent.phone}</span>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Team</h4>
                            <p className="text-sm">{agent.team}</p>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Bio</h4>
                            <p className="text-sm">{agent.bio}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4 md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Overview</CardTitle>
                            <CardDescription>Agent's activity and performance metrics</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Assigned Tickets</h4>
                                    <span className="text-sm font-medium">{agent.statistics.assignedTickets}</span>
                                </div>
                                {/* Scale progress based on number of tickets (max 20 for 100%) */}
                                <Progress 
                                    value={Math.min(agent.statistics.assignedTickets * 5, 100)} 
                                    className="h-2" 
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Resolved Tickets</h4>
                                    <span className="text-sm font-medium">{agent.statistics.resolvedTickets}</span>
                                </div>
                                {/* Calculate resolution rate as percentage */}
                                <Progress 
                                    value={agent.statistics.assignedTickets > 0 
                                        ? Math.min((agent.statistics.resolvedTickets / agent.statistics.assignedTickets) * 100, 100) 
                                        : 0
                                    } 
                                    className="h-2" 
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Avg. Response Time</h4>
                                    <span className="text-sm font-medium">{agent.statistics.averageResponseTime} hours</span>
                                </div>
                                {/* Inverse scale for response time (lower is better) */}
                                <Progress 
                                    value={Math.max(100 - (agent.statistics.averageResponseTime * 10), 0)} 
                                    className="h-2" 
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Customer Satisfaction</h4>
                                    <span className="text-sm font-medium">{agent.statistics.customerSatisfaction}/5</span>
                                </div>
                                {/* Scale satisfaction rating to percentage */}
                                <Progress 
                                    value={agent.statistics.customerSatisfaction * 20} 
                                    className="h-2" 
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="skills">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="skills">Skills</TabsTrigger>
                            <TabsTrigger value="permissions">Permissions</TabsTrigger>
                        </TabsList>
                        <TabsContent value="skills" className="p-4 border rounded-md mt-2">
                            <div className="flex flex-wrap gap-2">
                                {agent.skills && agent.skills.length > 0 ? (
                                    agent.skills.map((skill, index) => (
                                        <Badge key={index} variant="secondary">
                                            {skill}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No skills listed</p>
                                )}
                            </div>
                        </TabsContent>
                        <TabsContent value="permissions" className="p-4 border rounded-md mt-2">
                            <div className="flex flex-wrap gap-2">
                                {agent.permissions && agent.permissions.length > 0 ? (
                                    agent.permissions.map((permission, index) => (
                                        <Badge key={index} variant="outline">
                                            {permission}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No permissions assigned</p>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            </div>
        </AdminRouteProtection>
    )
}
