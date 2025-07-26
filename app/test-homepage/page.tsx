"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Play, Trash2, CheckCircle, XCircle, AlertTriangle, Home, Database, Eye } from "lucide-react"
import Link from "next/link"

interface DebugReport {
  timestamp: string
  summary: {
    total_recipes: number
    approved_published: number
    recently_approved: number
    api_recipes_returned: number
    issues_found: number
  }
  issues: string[]
  recently_approved_recipes: any[]
  api_response_sample: any
  database_sample: any[]
}

interface TestRecipe {
  id: string
  title: string
  status: string
  published: boolean
  days_since_approval: number
  should_appear_on_homepage: boolean
  created_at: string
}

export default function TestHomepagePage() {
  const [debugReport, setDebugReport] = useState<DebugReport | null>(null)
  const [testRecipe, setTestRecipe] = useState<TestRecipe | null>(null)
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [cleanupLoading, setCleanupLoading] = useState(false)

  const runDebugAnalysis = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/test/homepage-debug")
      const data = await response.json()

      if (data.success) {
        setDebugReport(data.debug)
      } else {
        console.error("Debug analysis failed:", data.error)
      }
    } catch (error) {
      console.error("Error running debug analysis:", error)
    } finally {
      setLoading(false)
    }
  }

  const createTestRecipe = async () => {
    try {
      setTestLoading(true)
      const response = await fetch("/api/test/homepage-debug", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        setTestRecipe(data.test_recipe)
        // Refresh debug analysis after creating test recipe
        setTimeout(() => {
          runDebugAnalysis()
        }, 1000)
      } else {
        console.error("Failed to create test recipe:", data.error)
      }
    } catch (error) {
      console.error("Error creating test recipe:", error)
    } finally {
      setTestLoading(false)
    }
  }

  const cleanupTestRecipes = async () => {
    try {
      setCleanupLoading(true)
      const response = await fetch("/api/test/homepage-debug", {
        method: "DELETE",
      })
      const data = await response.json()

      if (data.success) {
        setTestRecipe(null)
        // Refresh debug analysis after cleanup
        setTimeout(() => {
          runDebugAnalysis()
        }, 1000)
      } else {
        console.error("Failed to cleanup test recipes:", data.error)
      }
    } catch (error) {
      console.error("Error cleaning up test recipes:", error)
    } finally {
      setCleanupLoading(false)
    }
  }

  useEffect(() => {
    runDebugAnalysis()
  }, [])

  const getStatusIcon = (hasIssues: boolean) => {
    return hasIssues ? <XCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />
  }

  const getStatusColor = (hasIssues: boolean) => {
    return hasIssues ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Homepage Testing & Debug</h1>
          <p className="text-muted-foreground">Test and debug recipe display on homepage</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              View Homepage
            </Button>
          </Link>
          <Button onClick={runDebugAnalysis} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Run Analysis
          </Button>
        </div>
      </div>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Test Actions
          </CardTitle>
          <CardDescription>Create test recipes and analyze homepage behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button onClick={createTestRecipe} disabled={testLoading} className="flex items-center gap-2">
              <Play className={`h-4 w-4 ${testLoading ? "animate-spin" : ""}`} />
              {testLoading ? "Creating Test Recipe..." : "Create Test Recipe"}
            </Button>

            <Button
              onClick={cleanupTestRecipes}
              disabled={cleanupLoading}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Trash2 className={`h-4 w-4 ${cleanupLoading ? "animate-spin" : ""}`} />
              {cleanupLoading ? "Cleaning Up..." : "Cleanup Test Recipes"}
            </Button>

            <Link href="/server-logs">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Server Logs
              </Button>
            </Link>
          </div>

          {testRecipe && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Test Recipe Created:</strong> "{testRecipe.title}" (ID: {testRecipe.id})
                <br />
                <strong>Status:</strong> {testRecipe.status} | <strong>Published:</strong>{" "}
                {testRecipe.published ? "Yes" : "No"}
                <br />
                <strong>Should appear on homepage:</strong> {testRecipe.should_appear_on_homepage ? "Yes" : "No"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Debug Report */}
      {debugReport && (
        <>
          {/* Summary */}
          <Card className={getStatusColor(debugReport.issues.length > 0)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(debugReport.issues.length > 0)}
                Debug Summary
              </CardTitle>
              <CardDescription>
                Analysis completed at {new Date(debugReport.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{debugReport.summary.total_recipes}</div>
                  <div className="text-sm text-muted-foreground">Total Recipes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{debugReport.summary.approved_published}</div>
                  <div className="text-sm text-muted-foreground">Approved & Published</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{debugReport.summary.recently_approved}</div>
                  <div className="text-sm text-muted-foreground">Recently Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{debugReport.summary.api_recipes_returned}</div>
                  <div className="text-sm text-muted-foreground">API Returned</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${debugReport.summary.issues_found > 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    {debugReport.summary.issues_found}
                  </div>
                  <div className="text-sm text-muted-foreground">Issues Found</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues */}
          {debugReport.issues.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Issues Found ({debugReport.issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {debugReport.issues.map((issue, index) => (
                    <li key={index} className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-4 w-4" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recently Approved Recipes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Recently Approved Recipes ({debugReport.recently_approved_recipes.length})
              </CardTitle>
              <CardDescription>Recipes approved in the last 30 days that should appear on homepage</CardDescription>
            </CardHeader>
            <CardContent>
              {debugReport.recently_approved_recipes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recently approved recipes found</p>
              ) : (
                <div className="space-y-3">
                  {debugReport.recently_approved_recipes.map((recipe, index) => (
                    <div key={recipe.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{recipe.title}</h4>
                          <p className="text-sm text-muted-foreground">by {recipe.author}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>ID: {recipe.id}</span>
                            <span>Days since approval: {recipe.days_since_approval}</span>
                            <span>Category: {recipe.category}</span>
                            <span>Rating: {recipe.rating}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={recipe.should_appear_on_homepage ? "default" : "secondary"}>
                            {recipe.should_appear_on_homepage ? "Should Show" : "Won't Show"}
                          </Badge>
                          <Badge variant={recipe.published ? "default" : "destructive"}>
                            {recipe.published ? "Published" : "Not Published"}
                          </Badge>
                          <Badge variant={recipe.status === "approved" ? "default" : "secondary"}>
                            {recipe.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Response Sample */}
          <Card>
            <CardHeader>
              <CardTitle>API Response Analysis</CardTitle>
              <CardDescription>Sample data from /api/recipes endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(debugReport.api_response_sample, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Database Sample */}
          <Card>
            <CardHeader>
              <CardTitle>Database Sample</CardTitle>
              <CardDescription>Raw data from recipes table</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(debugReport.database_sample, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
