"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw, AlertCircle, ExternalLink } from "lucide-react"

interface TestResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: string
  duration?: number
}

export default function TestConnectionPage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [overallStatus, setOverallStatus] = useState<"success" | "error" | "warning">("warning")

  const runTests = async () => {
    setLoading(true)
    const testResults: TestResult[] = []

    // Test 1: API Health Check
    try {
      const start = Date.now()
      const response = await fetch("/api/health")
      const duration = Date.now() - start

      if (response.ok) {
        testResults.push({
          name: "API Health Check",
          status: "success",
          message: "API is responding correctly",
          duration,
        })
      } else {
        testResults.push({
          name: "API Health Check",
          status: "error",
          message: `API returned status ${response.status}`,
          duration,
        })
      }
    } catch (error) {
      testResults.push({
        name: "API Health Check",
        status: "error",
        message: "Failed to connect to API",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 2: Database Initialization
    try {
      const start = Date.now()
      const response = await fetch("/api/init-db")
      const duration = Date.now() - start
      const data = await response.json()

      if (response.ok && data.success) {
        testResults.push({
          name: "Database Initialization",
          status: "success",
          message: "Mock database initialized successfully",
          details: `Missing env vars: ${data.missing_variables.length}`,
          duration,
        })
      } else {
        testResults.push({
          name: "Database Initialization",
          status: "error",
          message: data.error || "Database initialization failed",
          duration,
        })
      }
    } catch (error) {
      testResults.push({
        name: "Database Initialization",
        status: "error",
        message: "Failed to initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 3: Environment Variables
    try {
      const start = Date.now()
      const response = await fetch("/api/test/env-check")
      const duration = Date.now() - start
      const data = await response.json()

      if (response.ok && data.success) {
        const status = data.missing_variables.length === 0 ? "success" : "warning"
        testResults.push({
          name: "Environment Variables",
          status,
          message: `${data.configured_count}/${data.total_count} variables configured`,
          details:
            data.missing_variables.length > 0
              ? `Missing: ${data.missing_variables.join(", ")}`
              : "All variables configured",
          duration,
        })
      } else {
        testResults.push({
          name: "Environment Variables",
          status: "error",
          message: "Failed to check environment variables",
          duration,
        })
      }
    } catch (error) {
      testResults.push({
        name: "Environment Variables",
        status: "error",
        message: "Failed to check environment variables",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 4: Authentication System
    try {
      const start = Date.now()
      const response = await fetch("/api/auth/me")
      const duration = Date.now() - start

      if (response.status === 401) {
        testResults.push({
          name: "Authentication System",
          status: "success",
          message: "Auth system is working (not logged in)",
          duration,
        })
      } else if (response.ok) {
        testResults.push({
          name: "Authentication System",
          status: "success",
          message: "Auth system is working (logged in)",
          duration,
        })
      } else {
        testResults.push({
          name: "Authentication System",
          status: "error",
          message: `Auth system returned status ${response.status}`,
          duration,
        })
      }
    } catch (error) {
      testResults.push({
        name: "Authentication System",
        status: "error",
        message: "Failed to test authentication system",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 5: Recipe API
    try {
      const start = Date.now()
      const response = await fetch("/api/recipes")
      const duration = Date.now() - start
      const data = await response.json()

      if (response.ok) {
        const recipeCount = Array.isArray(data) ? data.length : data.recipes?.length || 0
        testResults.push({
          name: "Recipe API",
          status: "success",
          message: `Recipe API working with ${recipeCount} recipes`,
          duration,
        })
      } else {
        testResults.push({
          name: "Recipe API",
          status: "error",
          message: `Recipe API returned status ${response.status}`,
          duration,
        })
      }
    } catch (error) {
      testResults.push({
        name: "Recipe API",
        status: "error",
        message: "Failed to test recipe API",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 6: Domain Connection
    try {
      const start = Date.now()
      const response = await fetch("/api/test/domain")
      const duration = Date.now() - start
      const data = await response.json()

      testResults.push({
        name: "Domain Connection",
        status: data.success ? "success" : "warning",
        message: data.message,
        details: data.details,
        duration,
      })
    } catch (error) {
      testResults.push({
        name: "Domain Connection",
        status: "error",
        message: "Failed to test domain connection",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    setTests(testResults)

    // Determine overall status
    const hasErrors = testResults.some((t) => t.status === "error")
    const hasWarnings = testResults.some((t) => t.status === "warning")

    if (hasErrors) {
      setOverallStatus("error")
    } else if (hasWarnings) {
      setOverallStatus("warning")
    } else {
      setOverallStatus("success")
    }

    setLoading(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <RefreshCw className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connection Test</h1>
          <p className="text-gray-600">Testing all system components and connections</p>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(overallStatus)}
                System Status
              </CardTitle>
              <Button onClick={runTests} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Run Tests
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {getStatusBadge(overallStatus)}
              <span className="text-sm text-gray-600">
                {overallStatus === "success" && "All systems operational"}
                {overallStatus === "warning" && "Some issues detected but system is functional"}
                {overallStatus === "error" && "Critical issues detected"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <div className="space-y-4">
          {tests.map((test, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getStatusIcon(test.status)}
                    {test.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(test.status)}
                    {test.duration && (
                      <Badge variant="outline" className="text-xs">
                        {test.duration}ms
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-2">{test.message}</p>
                {test.details && <p className="text-sm text-gray-500">{test.details}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        {overallStatus !== "success" && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>Steps to resolve detected issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tests.some((t) => t.name === "Environment Variables" && t.status !== "success") && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configure missing environment variables in your Vercel dashboard.
                      <Button size="sm" variant="outline" className="ml-2 bg-transparent" asChild>
                        <a href="/setup-environment" target="_blank" rel="noreferrer">
                          Setup Guide
                        </a>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {tests.some((t) => t.name === "Domain Connection" && t.status === "error") && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Check your DNS configuration and Vercel domain settings.
                      <Button size="sm" variant="outline" className="ml-2 bg-transparent" asChild>
                        <a href="/dns-settings" target="_blank" rel="noreferrer">
                          DNS Settings
                        </a>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Vercel Dashboard
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/deployment-status" target="_blank" rel="noreferrer">
                      Deployment Status
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
