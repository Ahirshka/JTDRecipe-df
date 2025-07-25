"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Server Logs</h1>
        <div className="flex items-center gap-2">
          <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? "Stop Auto-Refresh" : "Start Auto-Refresh"}
          </Button>
          <Button onClick={fetchLogs} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
          <Button variant="destructive" onClick={clearLogs}>
            Clear Logs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipe Test Form */}
        <Card>
          <CardHeader>
            <CardTitle>Test Recipe Submission</CardTitle>
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
              {testLoading ? "Testing..." : "Test Recipe Submission"}
            </Button>

            {testResult && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={testResult.success ? "default" : "destructive"}>
                    {testResult.success ? "Success" : "Failed"}
                  </Badge>
                  {testResult.step && <Badge variant="outline">{testResult.step}</Badge>}
                </div>
                <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Log Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
              <div className="text-sm text-gray-600">
                <p>Total logs: {logs.length}</p>
                <p>Auto-refresh: {autoRefresh ? "On" : "Off"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <CardTitle>Server Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No logs available</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getLevelColor(log.level)}>{log.level.toUpperCase()}</Badge>
                      <span className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <p className="text-sm font-mono">{log.message}</p>
                  {log.data && (
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
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
