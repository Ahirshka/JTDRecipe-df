"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertTriangle, ExternalLink, Trash2, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface AnalysisStep {
  step: number
  name: string
  result: string
  status: "success" | "warning" | "error"
  data: any
}

interface DebugAnalysis {
  timestamp: string
  steps: AnalysisStep[]
  issues: string[]
  summary: {
    total_steps: number
    successful_steps: number
    error_steps: number
    issues_found: number
    overall_status: string
  }
}

export default function TestHomepage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [analysis, setAnalysis] = useState<DebugAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCreatingTest, setIsCreatingTest] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Redirect if not admin/owner
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== "admin" && user?.role !== "owner"))) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, user, router])

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/test/homepage-debug", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setAnalysis(data.analysis)
        setSuccess("Analysis completed successfully")
      } else {
        setError(data.error || "Analysis failed")
      }
    } catch (err) {
      setError("Failed to run analysis")
      console.error("Analysis error:", err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const createTestRecipe = async () => {
    setIsCreatingTest(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/test/homepage-debug", {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Test recipe created: ${data.test_recipe.title}`)
        // Re-run analysis to show updated results
        setTimeout(runAnalysis, 1000)
      } else {
        setError(data.error || "Failed to create test recipe")
      }
    } catch (err) {
      setError("Failed to create test recipe")
      console.error("Create test recipe error:", err)
    } finally {
      setIsCreatingTest(false)
    }
  }

  const cleanupTestRecipes = async () => {
    setIsCleaning(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/test/homepage-debug", {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        // Re-run analysis to show updated results
        setTimeout(runAnalysis, 1000)
      } else {
        setError(data.error || "Failed to cleanup test recipes")
      }
    } catch (err) {
      setError("Failed to cleanup test recipes")
      console.error("Cleanup error:", err)
    } finally {
      setIsCleaning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200"
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      case "error":
        return "bg-red-50 border-red-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "owner")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Admin access required for homepage testing.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Homepage Debug Dashboard</h1>
          <p className="text-gray-600 mt-2">Debug why approved recipes aren't showing on the homepage</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button onClick={runAnalysis} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Run Analysis"
            )}
          </Button>

          <Button
            onClick={createTestRecipe}
            disabled={isCreatingTest}
            variant="outline"
            className="w-full bg-transparent"
          >
            {isCreatingTest ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Test Recipe
              </>
            )}
          </Button>

          <Button
            onClick={cleanupTestRecipes}
            disabled={isCleaning}
            variant="outline"
            className="w-full bg-transparent"
          >
            {isCleaning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cleaning...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Cleanup Test Recipes
              </>
            )}
          </Button>

          <Button onClick={() => router.push("/")} variant="outline" className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Homepage
          </Button>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(analysis.summary.overall_status === "healthy" ? "success" : "error")}
                  Analysis Summary
                </CardTitle>
                <CardDescription>Analysis completed at {new Date(analysis.timestamp).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analysis.summary.total_steps}</div>
                    <div className="text-sm text-gray-600">Total Steps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analysis.summary.successful_steps}</div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{analysis.summary.error_steps}</div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{analysis.summary.issues_found}</div>
                    <div className="text-sm text-gray-600">Issues Found</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issues */}
            {analysis.issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    Issues Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.issues.map((issue, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertDescription>{issue}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analysis Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.steps.map((step) => (
                    <div key={step.step} className={`p-4 rounded-lg border ${getStatusColor(step.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(step.status)}
                          <span className="font-medium">
                            Step {step.step}: {step.name}
                          </span>
                        </div>
                        <Badge
                          variant={
                            step.status === "success"
                              ? "default"
                              : step.status === "warning"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {step.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{step.result}</p>
                      {step.data && (
                        <details className="text-xs text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-800">View Details</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                            {JSON.stringify(step.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Homepage
                  </Button>
                  <Button onClick={() => router.push("/admin/recipes")} variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Admin Recipes
                  </Button>
                  <Button onClick={() => router.push("/server-logs")} variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Server Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!analysis && (
          <Card>
            <CardHeader>
              <CardTitle>Ready to Debug</CardTitle>
              <CardDescription>
                Click "Run Analysis" to start debugging the homepage recipe display issue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">This tool will check:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                <li>Database connection</li>
                <li>Total recipes in database</li>
                <li>Approved and published recipes</li>
                <li>Recently approved recipes (last 30 days)</li>
                <li>API endpoint functionality</li>
                <li>Sample recipe data</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
