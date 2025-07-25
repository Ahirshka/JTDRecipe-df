"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Trash2, Play, AlertCircle, CheckCircle, Info } from "lucide-react"

interface LogEntry {
  id: string
  timestamp: string
  level: "info" | "warn" | "error"
  message: string
  data?: any
}

export default function ServerLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const [testResult, setTestResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)

  // Test recipe form data
  const [testRecipe, setTestRecipe] = useState({
    title: "Test Recipe",
    description: "This is a test recipe for debugging",
    category: "Test",
    difficulty: "Easy",
    prepTime: "5",
    cookTime: "10",
    servings: "2",
    ingredients: "Test ingredient 1\nTest ingredient 2\nTest ingredient 3",
    instructions: "Step 1: Test instruction\nStep 2: Another test instruction\nStep 3: Final test instruction",
  })

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== "all") {
        params.append("level", filter)
      }
      params.append("limit", "100")

      const response = await fetch(`/api/test/server-logs?${params}`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    try {
      const response = await fetch("/api/test/server-logs", {
        method: "DELETE",
      })
      const data = await response.json()

      if (data.success) {
        setLogs([])
      }
    } catch (error) {
      console.error("Error clearing logs:", error)
    }
  }

  const testRecipeSubmission = async () => {
    try {
      setTestLoading(true)
      setTestResult(null)

      const response = await fetch("/api/test/recipe-debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testRecipe),
      })

      const data = await response.json()
      setTestResult(data)

      // Refresh logs after test
      setTimeout(fetchLogs, 1000)
    } catch (error) {
      console.error("Error testing recipe submission:", error)
      setTestResult({
        success: false,
        error: "Network error",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setTestLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filter])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 2000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, filter])

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "destructive"
      case "warn":
        return "secondary"
      case "info":
        return "default"
      default:
        return "outline"
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "warn":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Server Logs</h1>
          <p className="text-muted-foreground">Monitor server activity and debug recipe submission</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh(!autoRefresh)} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Stop Auto-Refresh" : "Start Auto-Refresh"}
          </Button>
          <Button onClick={fetchLogs} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="destructive" onClick={clearLogs} size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipe Test Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Recipe Submission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={testRecipe.title}
                  onChange={(e) => setTestRecipe({ ...testRecipe, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={testRecipe.category}
                  onChange={(e) => setTestRecipe({ ...testRecipe, category: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={testRecipe.difficulty}
                  onValueChange={(value) => setTestRecipe({ ...testRecipe, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prepTime">Prep Time (min)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  value={testRecipe.prepTime}
                  onChange={(e) => setTestRecipe({ ...testRecipe, prepTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  value={testRecipe.servings}
                  onChange={(e) => setTestRecipe({ ...testRecipe, servings: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={2}
                value={testRecipe.description}
                onChange={(e) => setTestRecipe({ ...testRecipe, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="ingredients">Ingredients (one per line)</Label>
              <Textarea
                id="ingredients"
                rows={4}
                value={testRecipe.ingredients}
                onChange={(e) => setTestRecipe({ ...testRecipe, ingredients: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instructions (one per line)</Label>
              <Textarea
                id="instructions"
                rows={4}
                value={testRecipe.instructions}
                onChange={(e) => setTestRecipe({ ...testRecipe, instructions: e.target.value })}
              />
            </div>

            <Button onClick={testRecipeSubmission} disabled={testLoading} className="w-full">
              {testLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Test Recipe Submission
                </>
              )}
            </Button>

            {testResult && (
              <div
                className={`mt-4 p-4 border rounded-lg ${
                  testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <Badge variant={testResult.success ? "default" : "destructive"}>
                    {testResult.success ? "Success" : "Failed"}
                  </Badge>
                  {testResult.step && <Badge variant="outline">{testResult.step}</Badge>}
                </div>
                <p className="text-sm mb-2">{testResult.message || testResult.error}</p>
                {testResult.details && <p className="text-xs text-gray-600 mb-2">Details: {testResult.details}</p>}
                {testResult.recipe && (
                  <div className="text-sm">
                    <p>
                      <strong>Recipe ID:</strong> {testResult.recipe.id}
                    </p>
                    <p>
                      <strong>Title:</strong> {testResult.recipe.title}
                    </p>
                    <p>
                      <strong>Status:</strong> {testResult.recipe.status}
                    </p>
                  </div>
                )}
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer">Full Response</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Log Filters & Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="filter">Filter by Level</Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info Only</SelectItem>
                  <SelectItem value="warn">Warnings Only</SelectItem>
                  <SelectItem value="error">Errors Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>Total logs: {logs.length}</p>
              <p>Auto-refresh: {autoRefresh ? "On (every 2s)" : "Off"}</p>
              <p>Filter: {filter === "all" ? "All levels" : filter}</p>
            </div>

            <div className="pt-4 space-y-2">
              <h4 className="font-medium">Quick Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-transparent"
                  onClick={() => window.open("/api/test/auth-debug", "_blank")}
                >
                  Test Authentication
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-transparent"
                  onClick={() => window.open("/api/test/database-connection", "_blank")}
                >
                  Test Database Connection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-transparent"
                  onClick={() => window.open("/admin", "_blank")}
                >
                  Admin Panel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <CardTitle>Server Logs ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No logs available. Try performing some actions or refresh the page.
              </p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getLevelIcon(log.level)}
                      <Badge variant={getLevelColor(log.level) as any}>{log.level.toUpperCase()}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-mono">{log.message}</p>
                  {log.data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Show data</summary>
                      <pre className="bg-muted p-2 rounded mt-1 overflow-auto">{JSON.stringify(log.data, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
