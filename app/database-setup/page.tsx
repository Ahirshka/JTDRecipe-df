"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertCircle,
  Database,
  Users,
  ChefHat,
  MessageSquare,
  Trash2,
  SproutIcon as Seedling,
  CheckCircle,
} from "lucide-react"

export default function DatabaseSetupPage() {
  const [status, setStatus] = useState<string>("")
  const [loading, setLoading] = useState<string>("")
  const [results, setResults] = useState<any>(null)

  const handleInitDatabase = async () => {
    setLoading("init")
    setStatus("Initializing database...")

    try {
      const response = await fetch("/api/init-db", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        setStatus("✅ Database initialized successfully!")
        setResults(result.data)
      } else {
        setStatus(`❌ Initialization failed: ${result.message}`)
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading("")
    }
  }

  const handleSeedDatabase = async () => {
    setLoading("seed")
    setStatus("Seeding database with sample data...")

    try {
      const response = await fetch("/api/seed-database", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        setStatus("✅ Database seeded successfully!")
        setResults(result.data)
      } else {
        setStatus(`❌ Seeding failed: ${result.message}`)
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading("")
    }
  }

  const handleClearDatabase = async () => {
    if (!confirm("Are you sure? This will delete all data except the owner account.")) {
      return
    }

    setLoading("clear")
    setStatus("Clearing database...")

    try {
      const response = await fetch("/api/clear-database", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        setStatus("✅ Database cleared successfully!")
        setResults(result.data)
      } else {
        setStatus(`❌ Clear failed: ${result.message}`)
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading("")
    }
  }

  const handleAutoInit = async () => {
    setLoading("auto")
    setStatus("Running auto-initialization...")

    try {
      const response = await fetch("/api/auto-init", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        setStatus("✅ Auto-initialization completed!")
        setResults(result.data)
      } else {
        setStatus(`❌ Auto-init failed: ${result.message}`)
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading("")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Database Setup</h1>
          <p className="text-gray-600">Initialize and manage your recipe database</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Database Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Operations
              </CardTitle>
              <CardDescription>Initialize, seed, or clear your database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleAutoInit} disabled={loading === "auto"} className="w-full" variant="default">
                <CheckCircle className="h-4 w-4 mr-2" />
                {loading === "auto" ? "Running..." : "Auto-Initialize (Recommended)"}
              </Button>

              <Separator />

              <Button
                onClick={handleInitDatabase}
                disabled={loading === "init"}
                className="w-full bg-transparent"
                variant="outline"
              >
                <Database className="h-4 w-4 mr-2" />
                {loading === "init" ? "Initializing..." : "Initialize Database"}
              </Button>

              <Button
                onClick={handleSeedDatabase}
                disabled={loading === "seed"}
                className="w-full bg-transparent"
                variant="outline"
              >
                <Seedling className="h-4 w-4 mr-2" />
                {loading === "seed" ? "Seeding..." : "Seed Sample Data"}
              </Button>

              <Button
                onClick={handleClearDatabase}
                disabled={loading === "clear"}
                className="w-full"
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loading === "clear" ? "Clearing..." : "Clear Database"}
              </Button>
            </CardContent>
          </Card>

          {/* Sample Data Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Seedling className="h-5 w-5" />
                Sample Data Includes
              </CardTitle>
              <CardDescription>What gets created when you seed the database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Sample Users</span>
                </div>
                <Badge variant="secondary">7 users</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  <span>Approved Recipes</span>
                </div>
                <Badge variant="secondary">5 recipes</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Pending Recipes</span>
                </div>
                <Badge variant="secondary">3 recipes</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Comments</span>
                </div>
                <Badge variant="secondary">8 comments</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>Flagged Comments</span>
                </div>
                <Badge variant="destructive">3 flagged</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Display */}
        {status && (
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-sm">{status}</p>

              {results && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <pre className="text-sm overflow-auto">{JSON.stringify(results, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Owner Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Owner Account</CardTitle>
            <CardDescription>Default owner account created during initialization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Email:</strong> aaronhirshka@gmail.com
              </p>
              <p>
                <strong>Password:</strong> Morton2121
              </p>
              <p>
                <strong>Role:</strong> Owner (Full Admin Access)
              </p>
              <p className="text-sm text-gray-600">
                Use these credentials to access the admin panel at <code>/admin</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
