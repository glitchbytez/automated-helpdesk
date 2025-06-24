import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft } from "lucide-react"

export default function NewAgentPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/agents">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Add New Agent</h1>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Agent Information</CardTitle>
                        <CardDescription>Enter the new agent's personal and contact information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" placeholder="First name" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" placeholder="Last name" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="Email address" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <Input id="phone" type="tel" placeholder="Phone number" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jobTitle">Job Title</Label>
                            <Input id="jobTitle" placeholder="Job title" />
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Settings</CardTitle>
                            <CardDescription>Configure the agent's role and permissions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="agent">Agent</SelectItem>
                                        <SelectItem value="limited">Limited Agent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="team">Team</Label>
                                <Select>
                                    <SelectTrigger id="team">
                                        <SelectValue placeholder="Select team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="support">Customer Support</SelectItem>
                                        <SelectItem value="technical">Technical Support</SelectItem>
                                        <SelectItem value="billing">Billing Support</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Permissions</Label>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="viewTickets" defaultChecked />
                                        <Label htmlFor="viewTickets">View Tickets</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="createTickets" defaultChecked />
                                        <Label htmlFor="createTickets">Create Tickets</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="assignTickets" defaultChecked />
                                        <Label htmlFor="assignTickets">Assign Tickets</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="deleteTickets" />
                                        <Label htmlFor="deleteTickets">Delete Tickets</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="manageAgents" />
                                        <Label htmlFor="manageAgents">Manage Agents</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="manageSettings" />
                                        <Label htmlFor="manageSettings">Manage Settings</Label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Initial Password</CardTitle>
                            <CardDescription>Set the initial password for the agent</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input id="confirmPassword" type="password" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="resetPassword" defaultChecked />
                                <Label htmlFor="resetPassword">Require password change on first login</Label>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" asChild>
                                <Link href="/agents">Cancel</Link>
                            </Button>
                            <Button>Create Agent</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}

