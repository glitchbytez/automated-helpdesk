"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { TicketMetrics } from "@/components/ticket-metrics"
import { TicketVolumeChart } from "@/components/ticket-volume-chart"
import { ArrowUpRight, ArrowDownRight, Users, Clock, AlertCircle, Loader2, MessageSquare } from "lucide-react"
import { ticketService } from "@/lib/services/ticket-service"
import { reportService } from "@/lib/services/report-service"
import { chatService } from "@/lib/services/chat-service"
import { socketService } from "@/lib/services/socket-service"
import { useAuth } from "@/contexts/auth-context"
import { showToast } from "@/lib/utils/toast-helper"

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const [dashboardData, setDashboardData] = useState({
    openTickets: 0,
    assignedTickets: 0,
    chatRequests: 0,
    responseTime: 0,
    ticketTrend: 0,
    responseTimeTrend: 0,
    highPriorityCount: 0
  })
  
  // Dashboard data state
  useEffect(() => {
    // Effect to track dashboard data changes
  }, [dashboardData])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize socket connection for chat notifications
    const socket = socketService.initialize()
    
    // Register as admin if user is available
    if (user) {
      const adminSessionId = socketService.registerAsAdmin(user.id)
      // Store the admin session ID for reference
      localStorage.setItem('adminSessionId', adminSessionId)
    } else if (!authLoading) {
      // Use a temporary ID if user is not available
      const tempAgentId = localStorage.getItem('tempAgentId') || `agent-${Date.now()}`
      localStorage.setItem('tempAgentId', tempAgentId)
      const adminSessionId = socketService.registerAsAdmin(tempAgentId)
      localStorage.setItem('adminSessionId', adminSessionId)
    }
    
    // Listen for new chat requests to update the dashboard
    socketService.onNewChatRequest(() => {
      fetchChatRequests()
    })
    
    // Cleanup socket connection on unmount
    return () => {
      socketService.disconnect()
    }
  }, [user, authLoading])
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch ticket statistics
        const statsResponse = await reportService.getTicketStats()
        
        // Fetch assigned tickets
        const myTicketsResponse = await ticketService.getMyTickets()
        
        // Fetch response time metrics
        const responseTimeResponse = await reportService.getResponseTimeMetrics()
        
        // Fetch agent metrics
        const agentMetricsResponse = await reportService.getAgentMetrics()
        
        // Fetch chat requests
        await fetchChatRequests()
        
        // Always update the dashboard with whatever data we have
        // For this specific API, the response IS the data (no .data property)
        let stats = {};
        if (statsResponse) {
          // The statsResponse object directly contains the data we need
          stats = statsResponse;
        }
        
        const myTickets = myTicketsResponse?.data?.tickets || []
        const responseTimeData = responseTimeResponse?.data || {}
        const agentMetrics = agentMetricsResponse?.data || {}
        
        // Count open tickets directly from the tickets data if needed for other calculations
        const openTicketsFromData = myTickets.filter(ticket => 
          ticket.status && 
          !['Resolved', 'Closed', 'resolved', 'closed', 'RESOLVED', 'CLOSED'].includes(ticket.status)
        ).length
        
        // Calculate high priority tickets - first try from stats, then from tickets
        const highPriorityCount = stats.highPriorityTickets || 
          myTickets.filter(ticket => 
            ticket.priority && ticket.priority.toLowerCase().includes('high')
          ).length
        
        // Calculate open tickets directly from the tickets if needed
        // This is a fallback in case the API response doesn't include the count
        let calculatedOpenTickets = 0;
        if (myTicketsResponse?.data?.tickets) {
          calculatedOpenTickets = myTicketsResponse.data.tickets.filter(ticket => 
            ticket.status && 
            !['Resolved', 'Closed'].includes(ticket.status)
          ).length;
        }
        
        // Use real metrics from the backend, with fallbacks
        setDashboardData(prevData => {
          // Get the openTickets value directly from the API response
          const openTicketsValue = Number(stats.openTickets) || 0;
          
          return {
            ...prevData,
            openTickets: openTicketsValue,
            assignedTickets: myTickets.length || 0,
            responseTime: Number(responseTimeData.averageResponseTime) || 0,
            ticketTrend: Number(stats.ticketTrend) || 0,
            responseTimeTrend: Number(responseTimeData.responseTimeTrend) || 0,
            highPriorityCount: Number(highPriorityCount) || 0,
            totalTickets: Number(stats.totalTickets) || 0,
            resolvedTickets: Number(stats.resolvedTickets) || 0,
            pendingChatRequests: Number(stats.pendingChatRequests) || 0
          };
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        showToast.error("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])
  
  // Fetch chat requests from the backend API
  const fetchChatRequests = async () => {
    try {
      console.log('Fetching active chat sessions from backend...');
      
      // Get active chat sessions directly from the backend API
      const activeSessions = await chatService.getActiveChatSessions();
      
      // Get the count of active sessions
      const activeChatRequests = activeSessions.length;
      
      console.log('Active chat sessions from backend:', activeSessions);
      console.log('Active chat requests count:', activeChatRequests);
      
      // Update dashboard data with chat requests count
      setDashboardData(prevData => ({
        ...prevData,
        chatRequests: activeChatRequests
      }));
      
      // Dispatch global event to update other components
      window.dispatchEvent(new CustomEvent('chatRequestsUpdated', {
        detail: { count: activeChatRequests }
      }));
      
      return activeChatRequests;
    } catch (error) {
      console.error("Error fetching chat requests:", error);
      // Reset to zero on error
      setDashboardData(prevData => ({
        ...prevData,
        chatRequests: 0
      }));
      
      return 0;
    }
  }

  // Format response time in minutes
  const formatResponseTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {authLoading ? "Loading user data..." : "Loading dashboard data..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Overview of your helpdesk activity</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Link href="/tickets" className="block">
          <Card className="p-4 h-full hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Open Tickets</p>
                <p className="text-2xl font-semibold">
                  {/* Display the actual open tickets count directly from the dashboard data */}
                  {dashboardData.openTickets}
                </p>
                <div className={`flex items-center mt-1 text-xs ${dashboardData.ticketTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {dashboardData.ticketTrend >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  <span>{Math.abs(dashboardData.ticketTrend)}% from yesterday</span>
                </div>
              </div>
              <div className="bg-blue-50 p-2 rounded-md">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/my-tickets" className="block">
          <Card className="p-4 h-full hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Assigned to You</p>
                <p className="text-2xl font-semibold">{dashboardData.assignedTickets}</p>
                <div className="flex items-center mt-1 text-xs">
                  <span className="text-amber-600 font-medium">
                    {dashboardData.highPriorityCount > 0 
                      ? `${dashboardData.highPriorityCount} high priority` 
                      : "No high priority"}
                  </span>
                </div>
              </div>
              <div className="bg-amber-50 p-2 rounded-md">
                <Users className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/chats" className="block">
          <Card className="p-4 h-full hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Chat Requests</p>
                <p className="text-2xl font-semibold">{dashboardData.chatRequests}</p>
                <div className="flex items-center mt-1 text-xs">
                  <span className="text-muted-foreground">Waiting for response</span>
                </div>
              </div>
              <div className="bg-purple-50 p-2 rounded-md">
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Card className="p-4 h-full">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg. Response Time</p>
              <p className="text-2xl font-semibold">{formatResponseTime(dashboardData.responseTime)}</p>
              <div className={`flex items-center mt-1 text-xs ${dashboardData.responseTimeTrend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboardData.responseTimeTrend <= 0 ? (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                )}
                <span>{Math.abs(dashboardData.responseTimeTrend)}m from last week</span>
              </div>
            </div>
            <div className="bg-green-50 p-2 rounded-md">
              <Clock className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium">Ticket Volume</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
          </div>
          <div className="h-[250px]">
            <TicketVolumeChart />
          </div>
        </Card>

        <Card className="md:col-span-3 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium">Ticket Metrics</h3>
              <p className="text-xs text-muted-foreground">Distribution by status and priority</p>
            </div>
          </div>
          <div className="h-[250px]">
            <TicketMetrics />
          </div>
        </Card>
      </div>
    </div>
  )
}
