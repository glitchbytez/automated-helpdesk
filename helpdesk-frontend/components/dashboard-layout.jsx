"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { chatService } from "@/lib/services/chat-service"
import { socketService } from "@/lib/services/socket-service"
import {
    LayoutDashboard,
    Ticket,
    MessageSquare,
    Users,
    BookOpen,
    Settings,
    LogOut,
    BarChart3,
    ChevronRight,
    ChevronLeft,
    Menu,
    Bell,
    GraduationCap,
    FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { NotificationPanel } from "@/components/notification-panel"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"

export function DashboardLayout({ children }) {
    const pathname = usePathname()
    const router = useRouter()
    const isMobileView = useIsMobile()
    const { user, logout, loading } = useAuth()
    
    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    const [chatRequestsCount, setChatRequestsCount] = useState(0)
    const [userData, setUserData] = useState({
        firstName: "Admin",
        lastName: "User",
        email: "admin.user@example.com",
        role: "admin"
    })
    const [expandedItems, setExpandedItems] = useState({
        tickets: pathname.startsWith("/tickets") || pathname === "/my-tickets" || pathname === "/unassigned-tickets",
        knowledgeBase: pathname.startsWith("/knowledge-base"),
    })
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)


    
    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])
    
    // Update userData when authenticated user changes
    useEffect(() => {
        if (user) {
            // If we have authenticated user data, update our local state
            setUserData({
                firstName: user.firstName || "Admin",
                lastName: user.lastName || "User",
                email: user.email || "admin.user@example.com",
                role: user.role || "admin",
                avatar: user.avatar || ""
            })
        }
    }, [user])
    
    // Listen for chat requests count updates
    useEffect(() => {
        // Set initial count to 0
        setChatRequestsCount(0)
        
        // Listen for updates from the dashboard
        const handleChatRequestsUpdated = (event) => {
            if (event.detail && typeof event.detail.count === 'number') {
                setChatRequestsCount(event.detail.count)
            }
        }
        
        // Add event listener
        window.addEventListener('chatRequestsUpdated', handleChatRequestsUpdated)
        
        // Clean up
        return () => {
            window.removeEventListener('chatRequestsUpdated', handleChatRequestsUpdated)
        }
    }, [])

    // Automatically collapse sidebar on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarCollapsed(true)
            }
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])
    
    // Show loading or nothing while checking authentication
    if (loading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }
    
    // Compute name and initials from our local state
    const fullName = `${userData.firstName} ${userData.lastName}`
    const initials = userData.firstName[0] + userData.lastName[0]

    const toggleExpanded = (key) => {
        setExpandedItems((prev) => ({
            ...prev,
            [key]: !prev[key],
        }))
    }

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed)
        if (isMobileView) {
            setMobileMenuOpen(!mobileMenuOpen)
        }
    }

    const handleLogout = async () => {
        await logout()
    }

    const closeMobileMenu = () => {
        if (isMobileView) {
            setMobileMenuOpen(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile overlay */}
            {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobileMenu} />}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 z-50 flex flex-col border-r border-border bg-white dark:bg-black transition-all duration-300 ${
                    sidebarCollapsed && !mobileMenuOpen ? "w-[3.5rem] md:w-[3.5rem]" : "w-64 md:w-56"
                } ${mobileMenuOpen ? "left-0" : isMobileView ? "-left-64" : "left-0"}`}
            >
                <div className="p-3 flex items-center justify-between">
                    <div className={`flex items-center gap-2 ${sidebarCollapsed && !mobileMenuOpen ? "justify-center" : ""}`}>
                        <div className="rounded-md bg-blue-600 dark:bg-blue-500 p-1">
                            <GraduationCap className="h-4 w-4 text-white" />
                        </div>
                        {(!sidebarCollapsed || mobileMenuOpen) && (
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">Campus Support</span>
                                <span className="text-xs text-muted-foreground">University Helpdesk</span>
                            </div>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-6 w-6">
                        {sidebarCollapsed && !mobileMenuOpen ? (
                            <ChevronRight className="h-3 w-3" />
                        ) : (
                            <ChevronLeft className="h-3 w-3" />
                        )}
                    </Button>
                </div>

                <div className="flex-1 overflow-auto py-2">
                    <TooltipProvider delayDuration={0}>
                        <div className="space-y-1">
                            <div className={`px-2 ${sidebarCollapsed && !mobileMenuOpen ? "px-0" : ""}`}>
                                {(!sidebarCollapsed || mobileMenuOpen) && (
                                    <h2 className="mb-1 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Main</h2>
                                )}
                                <nav className="space-y-0.5">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href="/dashboard"
                                                onClick={closeMobileMenu}
                                                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                                    pathname === "/dashboard"
                                                        ? "bg-gray-100 dark:bg-gray-800 font-medium"
                                                        : "text-gray-700 dark:text-gray-300"
                                                } ${sidebarCollapsed && !mobileMenuOpen ? "justify-center px-0" : ""}`}
                                            >
                                                <LayoutDashboard className="h-3.5 w-3.5" />
                                                {(!sidebarCollapsed || mobileMenuOpen) && <span>Dashboard</span>}
                                            </Link>
                                        </TooltipTrigger>
                                        {sidebarCollapsed && !mobileMenuOpen && <TooltipContent side="right">Dashboard</TooltipContent>}
                                    </Tooltip>

                                    {sidebarCollapsed && !mobileMenuOpen ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href="/tickets"
                                                    onClick={closeMobileMenu}
                                                    className={`flex items-center justify-center rounded-md py-1.5 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                                        pathname.startsWith("/tickets") ||
                                                        pathname === "/my-tickets" ||
                                                        pathname === "/unassigned-tickets"
                                                            ? "bg-gray-100 dark:bg-gray-800 font-medium"
                                                            : "text-gray-700 dark:text-gray-300"
                                                    }`}
                                                >
                                                    <Ticket className="h-3.5 w-3.5" />
                                                </Link>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">Tickets</TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <Collapsible open={expandedItems.tickets} onOpenChange={() => toggleExpanded("tickets")}>
                                            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <Ticket className="h-3.5 w-3.5" />
                                                    <span>Tickets</span>
                                                </div>
                                                <ChevronRight
                                                    className={`h-3.5 w-3.5 transition-transform ${expandedItems.tickets ? "rotate-90" : ""}`}
                                                />
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="space-y-0.5 pl-6 pr-2 pt-0.5 pb-1">
                                                <Link
                                                    href="/tickets"
                                                    onClick={closeMobileMenu}
                                                    className={`flex items-center rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                                        pathname === "/tickets"
                                                            ? "bg-gray-100 dark:bg-gray-800 font-medium"
                                                            : "text-gray-600 dark:text-gray-400"
                                                    }`}
                                                >
                                                    All Tickets
                                                </Link>
                                                <Link
                                                    href="/my-tickets"
                                                    onClick={closeMobileMenu}
                                                    className={`flex items-center rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                                        pathname === "/my-tickets"
                                                            ? "bg-gray-100 dark:bg-gray-800 font-medium"
                                                            : "text-gray-600 dark:text-gray-400"
                                                    }`}
                                                >
                                                    My Tickets
                                                </Link>
                                                <Link
                                                    href="/unassigned-tickets"
                                                    onClick={closeMobileMenu}
                                                    className={`flex items-center rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                                        pathname === "/unassigned-tickets"
                                                            ? "bg-gray-100 dark:bg-gray-800 font-medium"
                                                            : "text-gray-600 dark:text-gray-400"
                                                    }`}
                                                >
                                                    Unassigned
                                                </Link>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    )}

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href="/chats"
                                                onClick={closeMobileMenu}
                                                className={`flex items-center ${sidebarCollapsed && !mobileMenuOpen ? "justify-center px-0" : "justify-between px-2"} rounded-md py-1.5 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                                    pathname === "/chats"
                                                        ? "bg-gray-100 dark:bg-gray-800 font-medium"
                                                        : "text-gray-700 dark:text-gray-300"
                                                }`}
                                            >
                                                <div className={`flex items-center ${sidebarCollapsed && !mobileMenuOpen ? "" : "gap-2"}`}>
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    {(!sidebarCollapsed || mobileMenuOpen) && <span>Chat Requests</span>}
                                                </div>
                                                {(!sidebarCollapsed || mobileMenuOpen) && chatRequestsCount > 0 && (
                                                     <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 px-1 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                                                        {chatRequestsCount}
                                                     </span>
                                                 )}
                                            </Link>
                                        </TooltipTrigger>
                                        {sidebarCollapsed && !mobileMenuOpen && (
                                            <TooltipContent side="right">Chat Requests {chatRequestsCount > 0 ? `(${chatRequestsCount})` : ''}</TooltipContent>
                                        )}
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href="/reports"
                                                onClick={closeMobileMenu}
                                                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                                    pathname === "/reports"
                                                        ? "bg-gray-100 dark:bg-gray-800 font-medium"
                                                        : "text-gray-700 dark:text-gray-300"
                                                } ${sidebarCollapsed && !mobileMenuOpen ? "justify-center px-0" : ""}`}
                                            >
                                                <BarChart3 className="h-3.5 w-3.5" />
                                                {(!sidebarCollapsed || mobileMenuOpen) && <span>Reports</span>}
                                            </Link>
                                        </TooltipTrigger>
                                        {sidebarCollapsed && !mobileMenuOpen && <TooltipContent side="right">Reports</TooltipContent>}
                                    </Tooltip>
                                </nav>
                            </div>

                            {/* Knowledge Base section - only visible to admin users */}
                            {!loading && userData.role === "admin" && (
                                <div className={`px-2 ${sidebarCollapsed && !mobileMenuOpen ? "px-0" : ""}`}>
                                    {(!sidebarCollapsed || mobileMenuOpen) && (
                                        <h2 className="mb-1 px-2 mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Knowledge Base
                                        </h2>
                                    )}
                                    <nav className="space-y-0.5">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href="/knowledge-base"
                                                    onClick={closeMobileMenu}
                                                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                                        pathname.startsWith("/knowledge-base")
                                                            ? "bg-gray-100 dark:bg-gray-800 font-medium"
                                                            : "text-gray-700 dark:text-gray-300"
                                                    } ${sidebarCollapsed && !mobileMenuOpen ? "justify-center px-0" : ""}`}
                                                >
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                    {(!sidebarCollapsed || mobileMenuOpen) && <span>Vector Search</span>}
                                                </Link>
                                            </TooltipTrigger>
                                            {sidebarCollapsed && !mobileMenuOpen && <TooltipContent side="right">Knowledge Base</TooltipContent>}
                                        </Tooltip>
                                    </nav>
                                </div>
                            )}

                            <div className={`px-2 ${sidebarCollapsed && !mobileMenuOpen ? "px-0" : ""}`}>
                                {(!sidebarCollapsed || mobileMenuOpen) && (
                                    <h2 className="mb-1 px-2 mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">Admin</h2>
                                )}
                                <nav className="space-y-0.5">
                                    {/* Requests link - only visible to admin users */}
                                    {!loading && userData.role === "admin" && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href="/requests"
                                                    onClick={closeMobileMenu}
                                                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                                        pathname === "/requests"
                                                            ? "bg-gray-100 dark:bg-gray-800 font-medium"
                                                            : "text-gray-700 dark:text-gray-300"
                                                    } ${sidebarCollapsed && !mobileMenuOpen ? "justify-center px-0" : ""}`}
                                                >
                                                    <FileText className="h-3.5 w-3.5" />
                                                    {(!sidebarCollapsed || mobileMenuOpen) && <span>Requests</span>}
                                                </Link>
                                            </TooltipTrigger>
                                            {sidebarCollapsed && !mobileMenuOpen && <TooltipContent side="right">Requests</TooltipContent>}
                                        </Tooltip>
                                    )}

                                    {/* Agents link - only visible to admin users */}
                                    {!loading && userData.role === "admin" && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href="/agents"
                                                    onClick={closeMobileMenu}
                                                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                                        pathname === "/agents"
                                                            ? "bg-gray-100 dark:bg-gray-800 font-medium"
                                                            : "text-gray-700 dark:text-gray-300"
                                                    } ${sidebarCollapsed && !mobileMenuOpen ? "justify-center px-0" : ""}`}
                                                >
                                                    <Users className="h-3.5 w-3.5" />
                                                    {(!sidebarCollapsed || mobileMenuOpen) && <span>Agents</span>}
                                                </Link>
                                            </TooltipTrigger>
                                            {sidebarCollapsed && !mobileMenuOpen && <TooltipContent side="right">Agents</TooltipContent>}
                                        </Tooltip>
                                    )}

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href="/settings"
                                                onClick={closeMobileMenu}
                                                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                                    pathname === "/settings"
                                                        ? "bg-gray-100 dark:bg-gray-800 font-medium"
                                                        : "text-gray-700 dark:text-gray-300"
                                                } ${sidebarCollapsed && !mobileMenuOpen ? "justify-center px-0" : ""}`}
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                                {(!sidebarCollapsed || mobileMenuOpen) && <span>Settings</span>}
                                            </Link>
                                        </TooltipTrigger>
                                        {sidebarCollapsed && !mobileMenuOpen && <TooltipContent side="right">Settings</TooltipContent>}
                                    </Tooltip>
                                </nav>
                            </div>
                        </div>
                    </TooltipProvider>
                </div>

                <div className="border-t border-border p-3">
                    <div className={`flex items-center ${sidebarCollapsed && !mobileMenuOpen ? "justify-center" : "gap-2"}`}>
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={userData.avatar || ""} alt={fullName} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        {(!sidebarCollapsed || mobileMenuOpen) && (
                            <div className="flex flex-1 flex-col">
                                <span className="text-xs font-medium">{fullName}</span>
                                <span className="text-[10px] text-muted-foreground">{userData.email}</span>
                            </div>
                        )}
                        {(!sidebarCollapsed || mobileMenuOpen) && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleLogout}>
                                <LogOut className="h-3.5 w-3.5" />
                                <span className="sr-only">Log out</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div
                className={`flex flex-1 flex-col transition-all duration-300 ${isMobileView ? "ml-0" : sidebarCollapsed ? "ml-[3.5rem]" : "ml-56"} bg-gray-50 dark:bg-gray-900 min-h-screen`}
            >
                <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-white dark:bg-black px-4">
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-7 w-7">
                        <Menu className="h-4 w-4" />
                    </Button>

                    <div className="flex-1"></div>

                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                                    <Bell className="h-4 w-4" />
                                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-600"></span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="end">
                                <NotificationPanel />
                            </PopoverContent>
                        </Popover>

                        <Link href="/settings">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 flex items-center gap-2 text-sm font-medium">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={userData.avatar || ""} alt={fullName} />
                                        <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>
                                    <span className="hidden md:inline">{fullName}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel className="text-xs">My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild className="text-xs">
                                    <Link href="/settings/profile">Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="text-xs">
                                    <Link href="/settings">Settings</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-xs text-red-600">
                                    <LogOut className="h-3.5 w-3.5 mr-2" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 min-h-[calc(100vh-3rem)]">{children}</main>
            </div>
        </div>
    )
}

