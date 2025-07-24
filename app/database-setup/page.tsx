"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, Users, ChefHat, MessageSquare, Star, Trash2 } from "lucide-react"

interface DatabaseStatus {
  success: boolean
  message: string
  data?: {
    users: number
    approvedRecipes: number
    pendingRecipes: number
    comments: number
    ratings: number
    flaggedComments: number
  }
}

export default function DatabaseSetupPage() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [initStatus, setInitStatus] = useState<DatabaseStatus | null>(null)
  const [seedStatus, setSeedStatus] = useState<DatabaseStatus | null>(null)
  const [clearStatus, setClearStatus] = useState<DatabaseStatus | null>(null)

  const handleInitialize = async () => {
    setIsInitializing(true)
    setInitStatus(null)

    try {
      const response = await fetch("/api/init-db", { method: "POST" })
      const result = await response.json()
      setInitStatus(result)
    } catch (error) {
      setInitStatus({
        success: false,
        message: "Failed to connect to initialization endpoint",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const handleSeedDatabase = async () => {
    setIsSeeding(true)
    setSeedStatus(null)

    try {
      const response = await fetch("/api/seed-database", { method: "POST" })
      const result = await response.json()
      setSeedStatus(result)
    } catch (error) {
      setSeedStatus({
        success: false,
        message: "Failed to connect to seeding endpoint",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleClearDatabase = async () => {
    if (!confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      return
    }

    setIsClearing(true)
    setClearStatus(null)

    try {
      const response = await fetch("/api/clear-database", { method: "POST" })
      const result = await response.json()
      setClearStatus(result)
    } catch (error) {
      setClearStatus({
        success: false,
        message: "Failed to connect to clearing endpoint",
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Management</h1>
          <p className="text-gray-600">Initialize, seed, or clear your recipe database</p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {/* Initialize Database */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Initialize Database
              </CardTitle>
              <CardDescription>Create database tables and owner account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleInitialize} disabled={isInitializing} className="w-full">
                {isInitializing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Initialize Database"
                )}
              </Button>

              {initStatus && (
                <Alert className={initStatus.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription className={initStatus.success ? "text-green-800" : "text-red-800"}>
                    {initStatus.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Seed Database */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Seed Sample Data
              </CardTitle>
              <CardDescription>Add sample users, recipes, and comments for testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="w-full bg-transparent"
                variant="outline"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  "Seed Database"
                )}
              </Button>

              {seedStatus && (
                <Alert className={seedStatus.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription className={seedStatus.success ? "text-green-800" : "text-red-800"}>
                    {seedStatus.message}
                  </AlertDescription>
                </Alert>
              )}

              {seedStatus?.success && seedStatus.data && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Users
                    </span>
                    <span className="font-medium">{seedStatus.data.users}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ChefHat className="h-4 w-4" />
                      Approved Recipes
                    </span>
                    <span className="font-medium">{seedStatus.data.approvedRecipes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Database className="h-4 w-4" />
                      Pending Recipes
                    </span>
                    <span className="font-medium">{seedStatus.data.pendingRecipes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      Comments
                    </span>
                    <span className="font-medium">{seedStatus.data.comments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      Ratings
                    </span>
                    <span className="font-medium">{seedStatus.data.ratings}</span>
                  </div>
                  <div className="flex items-center justify-between text-red-600">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      Flagged Comments
                    </span>
                    <span className="font-medium">{seedStatus.data.flaggedComments}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clear Database */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Clear Database
              </CardTitle>
              <CardDescription>Remove all data from the database (destructive)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleClearDatabase} disabled={isClearing} className="w-full" variant="destructive">
                {isClearing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  "Clear All Data"
                )}
              </Button>

              {clearStatus && (
                <Alert className={clearStatus.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription className={clearStatus.success ? "text-green-800" : "text-red-800"}>
                    {clearStatus.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Initialize Database</h3>
              <p className="text-sm text-gray-600">
                Creates all necessary database tables and the owner account (aaronhirshka@gmail.com / Morton2121)
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">2. Seed Sample Data</h3>
              <p className="text-sm text-gray-600">
                Adds sample users, approved recipes, pending recipes for moderation, comments, ratings, and flagged
                comments for testing the admin panel
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">3. Test the System</h3>
              <p className="text-sm text-gray-600">
                Login as owner, test recipe submission, user management, and comment moderation features
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
