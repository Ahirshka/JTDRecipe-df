"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Trash2, Play, Database, Shield, User } from "lucide-react"

interface LogEntry {
  id: string
  timestamp: string
  level: "info" | "warn" | "error" | "debug"
  message: string
  data?: any
}

export default function ServerLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [levelFilter, setLevelFilter] = useState("all")
  const [testResult, setTestResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)

  // Recipe test form state
  const [recipeForm, setRecipeForm] = useState({
    title: "Test Recipe",
    description: "This is a test recipe for debugging",
    category: "Test",
    difficulty: "Easy",
    prepTime: "5",
    cookTime: "10",
    servings: "2",
    ingredients: "1 cup flour\n2 eggs\n1 cup milk",
    instructions: "Mix ingredients\nCook for 10 minutes\nServe hot",
  })

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/test/server-logs?level=${levelFilter}&limit=100`)
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
      const response = await fetch("/api/test/server-logs", { method: "DELETE" })
      if (response.ok) {
        await fetchLogs()
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
        body: JSON.stringify(recipeForm),
      })

      const result = await response.json()
      setTestResult(result)

      // Refresh logs to see the test results
      setTimeout(() => {
        fetchLogs()
      }, 1000)
    } catch (error) {
      console.error("Error testing recipe submission:", error)
      setTestResult({
        success: false,
        error: "Network error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setTestLoading(false)
    }
  }

  const testQuickAction = async (endpoint: string, description: string) => {
    try {
      setTestLoading(true)
      setTestResult(null)

      const response = await fetch(endpoint)
      const result = await response.json()

      setTestResult({
        success: response.ok,
        message: description,
        data: result,
      })

      // Refresh logs
      setTimeout(() => {
        fetchLogs()
      }, 1000)
    } catch (error) {
      console.error(`Error testing ${endpoint}:`, error)
      setTestResult({
        success: false,
        error: `Failed to test ${description}`,
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setTestLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [levelFilter])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 2000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, levelFilter])

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "destructive"
      case "warn":
        return "secondary"
      case "info":
        return "default"
      case "debug":
        return "outline"
      default:
        return "default"
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Server Logs</h1>
          <p className="text-muted-foreground">Monitor server activity and debug issues</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchLogs} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={clearLogs} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Recipe Test Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Test Recipe Submission
          </CardTitle>
          <CardDescription>Submit a test recipe to debug the recipe creation process</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={recipeForm.title}
                onChange={(e) => setRecipeForm({ ...recipeForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={recipeForm.category}
                onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={recipeForm.difficulty}
                onValueChange={(value) => setRecipeForm({ ...recipeForm, difficulty: value })}
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
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="prepTime">Prep (min)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  value={recipeForm.prepTime}
                  onChange={(e) => setRecipeForm({ ...recipeForm, prepTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cookTime">Cook (min)</Label>
                <Input
                  id="cookTime"
                  type="number"
                  value={recipeForm.cookTime}
                  onChange={(e) => setRecipeForm({ ...recipeForm, cookTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  value={recipeForm.servings}
                  onChange={(e) => setRecipeForm({ ...recipeForm, servings: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={recipeForm.description}
              onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ingredients">Ingredients (one per line)</Label>
              <Textarea
                id="ingredients"
                value={recipeForm.ingredients}
                onChange={(e) => setRecipeForm({ ...recipeForm, ingredients: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="instructions">Instructions (one per line)</Label>
              <Textarea
                id="instructions"
                value={recipeForm.instructions}
                onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <Button onClick={testRecipeSubmission} disabled={testLoading} className="w-full">
            <Play className={`h-4 w-4 mr-2 ${testLoading ? "animate-spin" : ""}`} />
            {testLoading ? "Testing Recipe Submission..." : "Test Recipe Submission"}
          </Button>

          {testResult && (
            <Card className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={testResult.success ? "default" : "destructive"}>
                      {testResult.success ? "SUCCESS" : "ERROR"}
                    </Badge>
                    {testResult.step && <Badge variant="outline">{testResult.step}</Badge>}
                  </div>
                  <p className="font-medium">{testResult.message || testResult.error}</p>
                  {testResult.details && <p className="text-sm text-muted-foreground">{testResult.details}</p>}
                  {testResult.recipe && (
                    <div className="mt-2 p-2 bg-white rounded border">
                      <p className="text-sm font-medium">Recipe Created:</p>
                      <p className="text-sm">ID: {testResult.recipe.id}</p>
                      <p className="text-sm">Title: {testResult.recipe.title}</p>
                      <p className="text-sm">Author: {testResult.recipe.author}</p>
                      <p className="text-sm">Status: {testResult.recipe.status}</p>
                    </div>
                  )}
                  {testResult.sqlError && (
                    <details className="mt-2">
                      <summary className="text-sm font-medium cursor-pointer">SQL Error Details</summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(testResult.sqlError, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Log Filters & Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Log Filters & Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="level-filter">Filter by Level</Label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label htmlFor="auto-refresh">Auto-refresh</Label>
            </div>

            <div className="text-sm text-muted-foreground">Total logs: {logs.length}</div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testQuickAction("/api/test/auth-debug", "Authentication Test")}
                disabled={testLoading}
              >
                <Shield className="h-4 w-4 mr-1" />
                Test Authentication
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testQuickAction("/api/test/database-connection", "Database Connection")}
                disabled={testLoading}
              >
                <Database className="h-4 w-4 mr-1" />
                Test Database Connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testQuickAction("/api/admin/users", "Admin Panel")}
                disabled={testLoading}
              >
                <User className="h-4 w-4 mr-1" />
                Admin Panel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Server Logs ({logs.length})</CardTitle>
          <CardDescription>
            Auto-refresh: {autoRefresh ? "On" : "Off"} • Filter: {levelFilter === "all" ? "All levels" : levelFilter}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No logs available</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <Badge variant={getLevelColor(log.level)} className="mt-0.5">
                    {log.level.toUpperCase()}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-muted-foreground">{formatTime(log.timestamp)}</span>
                      <span className="text-sm font-medium">{log.message}</span>
                    </div>
                    {log.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          Show data
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
