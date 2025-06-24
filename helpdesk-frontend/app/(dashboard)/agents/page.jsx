import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AgentTable } from "@/components/agent-table"
import {Plus, Filter, Search} from 'lucide-react'
import { AdminRouteProtection } from "@/components/admin-route-protection"

export default function AgentsPage() {
    return (
        <AdminRouteProtection>
            <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Agents</h1>
                    <p className="text-xs text-muted-foreground">Manage support agents and their permissions</p>
                </div>
                <Button size="sm" className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    <Link href="/agents/new-agent">Add Agent</Link>
                </Button>
            </div>

            <Card className="p-0 overflow-hidden border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-sm font-medium">All Agents</h2>
                    <div className="flex items-center gap-2 ">

                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-500" />
                            <Input
                                placeholder="Search agents..."
                                className="h-8 pl-8 text-xs w-full"

                            />
                        </div>
                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                            <Filter className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
                <div className="p-4">
                    <div className="overflow-x-auto">
                        <AgentTable />
                    </div>
                </div>
            </Card>
            </div>
        </AdminRouteProtection>
    )
}

