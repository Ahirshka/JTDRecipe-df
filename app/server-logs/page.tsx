"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Trash2, Send, AlertCircle, CheckCircle, Info } from "lucide-react"

interface LogEntry {
  timestamp: string
  level: string
  message: string
  data?: any
}

export default function ServerLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("all")
  const [limit, setLimit] = useState("50")
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Recipe test form
  const [recipeTitle, setRecipeTitle] = useState("Test Recipe")
  const [recipeCategory, setRecipeCategory] = useState("Test")
  const [recipeDifficulty, setRecipeDifficulty] = useState("Easy")
  const [recipeIngredients, setRecipeIngredients] = useState("Test ingredient 1\nTest ingredient 2")
  const [recipeInstructions, setRecipeInstructions] = useState("Test instruction 1\nTest instruction 2")
  const [testResult, setTestResult] = useState<any>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/test/server-logs?level=${filter}&limit=${limit}`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.logs)
      } else {
        console.error("Failed to fetch logs:", data.error)
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      })

      if (response.ok) {
        setLogs([])
      }
    } catch (error) {
      console.error("Error clearing logs:", error)
    }
  }

  const testRecipeSubmission = async () => {
    try {
      setTestResult(null)
      const ingredients = recipeIngredients.split("\n").filter((i) => i.trim())
      const instructions = recipeInstructions.split("\n").filter((i) => i.trim())

      const response = await fetch("/api/test/recipe-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recipeTitle,
          category: recipeCategory,
          difficulty: recipeDifficulty,
          ingredients,
          instructions,
        }),
      })

      const result = await response.json()
      setTestResult(result)

      // Refresh logs after test
      setTimeout(fetchLogs, 1000)
    } catch (error) {
      console.error("Error testing recipe submission:", error)
      setTestResult({ success: false, error: "Network error", step: "network" })
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filter, limit])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 2000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, filter, limit])

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
        <div>
          <h1 className="text-3xl font-bold">Server Logs</h1>
          <p className="text-muted-foreground">Monitor server activity and debug issues</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto Refresh On" : "Auto Refresh Off"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="destructive" size="sm" onClick={clearLogs}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Logs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipe Test Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Recipe Submission Test
            </CardTitle>
            <CardDescription>Test recipe submission with detailed debugging</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={recipeTitle} onChange={(e) => setRecipeTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={recipeCategory} onValueChange={setRecipeCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Test">Test</SelectItem>
                    <SelectItem value="Breakfast">Breakfast</SelectItem>
                    <SelectItem value="Lunch">Lunch</SelectItem>
                    <SelectItem value="Dinner">Dinner</SelectItem>
                    <SelectItem value="Dessert">Dessert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={recipeDifficulty} onValueChange={setRecipeDifficulty}>
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
              <Label htmlFor="ingredients">Ingredients (one per line)</Label>
              <Textarea
                id="ingredients"
                value={recipeIngredients}
                onChange={(e) => setRecipeIngredients(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instructions (one per line)</Label>
              <Textarea
                id="instructions"
                value={recipeInstructions}
                onChange={(e) => setRecipeInstructions(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={testRecipeSubmission} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Test Recipe Submission
            </Button>

            {testResult && (
              <div
                className={`p-4 rounded-lg border ${
                  testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">{testResult.success ? "Success" : "Failed"}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{testResult.message || testResult.error}</p>
                {testResult.step && <p className="text-xs text-gray-500">Step: {testResult.step}</p>}
                {testResult.details && <p className="text-xs text-gray-500 mt-1">Details: {testResult.details}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Log Filters</CardTitle>
            <CardDescription>Filter and configure log display</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="level">Log Level</Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="limit">Limit</Label>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 logs</SelectItem>
                  <SelectItem value="50">50 logs</SelectItem>
                  <SelectItem value="100">100 logs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <h4 className="font-medium mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => window.open("/api/test/auth-debug", "_blank")}
                >
                  Test Authentication
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => window.open("/api/test/database-connection", "_blank")}
                >
                  Test Database
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Logs ({logs.length})</CardTitle>
          <CardDescription>
            Server logs in real-time {autoRefresh && "(Auto-refreshing every 2 seconds)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No logs available. Try performing some actions or refresh the page.
              </p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getLevelIcon(log.level)}
                    <Badge variant={getLevelColor(log.level) as any} className="text-xs">
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-mono">{log.message}</p>
                    {log.data && (
                      <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
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
