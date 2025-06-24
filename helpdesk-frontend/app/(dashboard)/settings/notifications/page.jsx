import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Notification Settings</h1>
          <p className="text-xs text-muted-foreground">Configure how you receive notifications</p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Email Notifications</CardTitle>
            <CardDescription className="text-xs">Configure which email notifications you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="newTicket" className="text-xs">New Ticket</Label>
                <p className="text-[10px] text-muted-foreground">Receive an email when a new ticket is created</p>
              </div>
              <Switch id="newTicket" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ticketAssigned" className="text-xs">Ticket Assigned</Label>
                <p className="text-[10px] text-muted-foreground">Receive an email when a ticket is assigned to you</p>
              </div>
              <Switch id="ticketAssigned" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ticketUpdated" className="text-xs">Ticket Updated</Label>
                <p className="text-[10px] text-muted-foreground">
                  Receive an email when a ticket you're assigned to is updated
                </p>
              </div>
              <Switch id="ticketUpdated" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ticketResolved" className="text-xs">Ticket Resolved</Label>
                <p className="text-[10px] text-muted-foreground">Receive an email when a ticket is resolved</p>
              </div>
              <Switch id="ticketResolved" defaultChecked />
            </div>
          </CardContent>
          <CardFooter>
            <Button size="sm" className="ml-auto text-xs">Save Changes</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">In-App Notifications</CardTitle>
            <CardDescription className="text-xs">Configure which notifications appear in the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inAppNewTicket" className="text-xs">New Ticket</Label>
                <p className="text-[10px] text-muted-foreground">Show a notification when a new ticket is created</p>
              </div>
              <Switch id="inAppNewTicket" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inAppTicketAssigned" className="text-xs">Ticket Assigned</Label>
                <p className="text-[10px] text-muted-foreground">Show a notification when a ticket is assigned to you</p>
              </div>
              <Switch id="inAppTicketAssigned" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inAppChatMessage" className="text-xs">Chat Message</Label>
                <p className="text-[10px] text-muted-foreground">Show a notification when you receive a new chat message</p>
              </div>
              <Switch id="inAppChatMessage" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inAppMentions" className="text-xs">Mentions</Label>
                <p className="text-[10px] text-muted-foreground">
                  Show a notification when you are mentioned in a ticket or note
                </p>
              </div>
              <Switch id="inAppMentions" defaultChecked />
            </div>
          </CardContent>
          <CardFooter>
            <Button size="sm" className="ml-auto text-xs">Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

