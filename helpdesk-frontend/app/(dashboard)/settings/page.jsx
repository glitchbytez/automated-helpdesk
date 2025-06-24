import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { User, Shield, Key } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-xs text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <Link href="/settings/profile" className="block">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Profile</CardTitle>
                <CardDescription className="text-xs">Manage your personal information and preferences</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-start text-xs">
                Manage profile
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="overflow-hidden">
          <Link href="/settings/account" className="block">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Account Management</CardTitle>
                <CardDescription className="text-xs">Change password or delete your account</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-start text-xs">
                Manage account
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="overflow-hidden">
          <Link href="/settings/notifications" className="block">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                <CardDescription className="text-xs">Configure your notification preferences</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-start text-xs">
                Manage notifications
              </Button>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}

