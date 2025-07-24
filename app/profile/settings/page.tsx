"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Upload, Trash2, Save, ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function ProfileSettingsPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    bio: "",
    location: "",
    website: "",
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    setSelectedImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadProfilePicture = async () => {
    if (!selectedImage) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("avatar", selectedImage)

      const response = await fetch("/api/user/upload-avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Profile picture updated successfully!")
        await refreshUser()
        setSelectedImage(null)
        setImagePreview(null)
      } else {
        toast.error(result.error || "Failed to upload profile picture")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload profile picture")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteProfilePicture = async () => {
    try {
      const response = await fetch("/api/user/delete-avatar", {
        method: "DELETE",
        credentials: "include",
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Profile picture removed successfully!")
        await refreshUser()
      } else {
        toast.error(result.error || "Failed to remove profile picture")
      }
    } catch (error) {
      console.error("Delete avatar error:", error)
      toast.error("Failed to remove profile picture")
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Profile updated successfully!")
        await refreshUser()
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Update profile error:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        credentials: "include",
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Account deleted successfully")
        router.push("/")
      } else {
        toast.error(result.error || "Failed to delete account")
      }
    } catch (error) {
      console.error("Delete account error:", error)
      toast.error("Failed to delete account")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/profile" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" />
                Back to Profile
              </Link>
            </div>
            <Link href="/" className="text-2xl font-bold text-orange-600">
              JTDRecipe
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Profile Picture Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-32 h-32">
                    <AvatarImage
                      src={imagePreview || user.avatar || "/placeholder.svg?height=128&width=128"}
                      alt={user.username}
                    />
                    <AvatarFallback className="text-2xl">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {imagePreview && <Badge className="absolute -top-2 -right-2 bg-green-600">Preview</Badge>}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="text-center sm:text-left">
                    <h3 className="font-semibold text-lg">{user.username}</h3>
                    <p className="text-gray-600">{user.email}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Choose Photo
                    </Button>

                    {selectedImage && (
                      <Button
                        onClick={handleUploadProfilePicture}
                        disabled={isUploading}
                        className="flex items-center gap-2"
                      >
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {isUploading ? "Uploading..." : "Save Photo"}
                      </Button>
                    )}

                    {user.avatar && (
                      <Button
                        onClick={handleDeleteProfilePicture}
                        variant="outline"
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove Photo
                      </Button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  <p className="text-sm text-gray-500">Upload a JPG, PNG, or GIF image. Max file size: 5MB.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter your username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Your location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveProfile} disabled={isSaving} className="flex items-center gap-2">
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Account Status</h4>
                  <p className="text-sm text-gray-600">Your account is active and verified</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Member Since</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant="outline">{user.role}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Once you delete your account, there is no going back. Please be certain.
                </AlertDescription>
              </Alert>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2" disabled={isDeleting}>
                    <Trash2 className="w-4 h-4" />
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        This action cannot be undone. This will permanently delete your account and remove all your data
                        from our servers.
                      </p>
                      <p className="font-medium">This includes:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>Your profile and account information</li>
                        <li>All recipes you've submitted</li>
                        <li>Your favorites and ratings</li>
                        <li>All comments and reviews</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Deleting...
                        </div>
                      ) : (
                        "Yes, delete my account"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
