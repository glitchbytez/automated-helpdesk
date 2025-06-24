"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { userService } from "@/lib/services/user-service"
import { toast } from "sonner"

export default function ProfilePage() {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    avatar: "",
    notificationPreferences: {
      email: true,
      push: true
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true)
        const response = await userService.getProfile()
        
        if (response.data && response.data.user) {
          setUser({
            firstName: response.data.user.firstName || "",
            lastName: response.data.user.lastName || "",
            email: response.data.user.email || "",
            phone: response.data.user.phone || "",
            bio: response.data.user.bio || "",
            avatar: response.data.user.avatar || "",
            notificationPreferences: {
              email: response.data.user.notificationPreferences?.email !== false,
              push: response.data.user.notificationPreferences?.push !== false
            }
          })
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        toast.error("Failed to load profile data")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserProfile()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setUser(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNotificationChange = (type, checked) => {
    setUser(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [type]: checked
      }
    }))
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      const response = await userService.updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        bio: user.bio,
        notificationPreferences: user.notificationPreferences
      })
      
      if (response.data && response.data.user) {
        toast.success("Profile updated successfully")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Profile Settings</h1>
          <p className="text-xs text-muted-foreground">Manage your account settings and preferences</p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Personal Information</CardTitle>
            <CardDescription className="text-xs">Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm" className="text-xs">
                  Change Avatar
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs">
                    First Name
                  </Label>
                  <Input 
                    id="firstName" 
                    name="firstName"
                    value={user.firstName} 
                    onChange={handleInputChange}
                    className="text-xs" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs">
                    Last Name
                  </Label>
                  <Input 
                    id="lastName" 
                    name="lastName"
                    value={user.lastName} 
                    onChange={handleInputChange}
                    className="text-xs" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input 
                  id="email" 
                  name="email"
                  value={user.email} 
                  disabled
                  className="text-xs" 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button 
              size="sm" 
              className="ml-auto text-xs"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
            <CardDescription className="text-xs">Update your contact details and bio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs">
                Phone Number
              </Label>
              <Input 
                id="phone" 
                name="phone"
                value={user.phone} 
                onChange={handleInputChange}
                className="text-xs" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-xs">
                Bio
              </Label>
              <Textarea 
                id="bio" 
                name="bio"
                value={user.bio} 
                onChange={handleInputChange}
                className="text-xs min-h-[100px]" 
              />
            </div>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button 
              size="sm" 
              className="ml-auto text-xs"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notification Preferences</CardTitle>
            <CardDescription className="text-xs">Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs">Email Notifications</Label>
                <p className="text-[10px] text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch 
                checked={user.notificationPreferences.email}
                onCheckedChange={(checked) => handleNotificationChange('email', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs">Push Notifications</Label>
                <p className="text-[10px] text-muted-foreground">Receive push notifications in the app</p>
              </div>
              <Switch 
                checked={user.notificationPreferences.push}
                onCheckedChange={(checked) => handleNotificationChange('push', checked)}
              />
            </div>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button 
              size="sm" 
              className="ml-auto text-xs"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
