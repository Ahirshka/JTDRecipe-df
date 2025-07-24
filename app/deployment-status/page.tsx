"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

interface DeploymentStatus {
  timestamp: string
  environment: string
  deployment: {
    region: string
    url: string
    gitCommit: string
    gitBranch: string
  }
  environmentVariables: Record<string, boolean>
  missingVariables: string[]
}

export default function DeploymentStatusPage() {
  const [status, setStatus] = useState<DeploymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/deployment-status")
      if (!response.ok) {
        throw new Error("Failed to fetch deployment status")
      }
      const data = await response.json()
      setStatus(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchStatus} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isHealthy = status?.missingVariables.length === 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deployment Status</h1>
          <p className="text-muted-foreground">Just The Damn Recipe - Production Environment</p>
        </div>
        <Button onClick={fetchStatus} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card className={isHealthy ? "border-green-200" : "border-yellow-200"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isHealthy ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            Overall Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge
            variant={isHealthy ? "default" : "secondary"}
            className={isHealthy ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
          >
            {isHealthy ? "Healthy" : "Configuration Issues"}
          </Badge>
          {!isHealthy && (
            <p className="text-sm text-muted-foreground mt-2">
              Some environment variables are missing. Check the details below.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Deployment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Information</CardTitle>
          <CardDescription>Current deployment details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Environment</p>
              <p className="text-sm text-muted-foreground">{status?.environment}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Region</p>
              <p className="text-sm text-muted-foreground">{status?.deployment.region}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Git Branch</p>
              <p className="text-sm text-muted-foreground">{status?.deployment.gitBranch}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Git Commit</p>
              <p className="text-sm text-muted-foreground font-mono">{status?.deployment.gitCommit.substring(0, 8)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Deployment URL</p>
            <p className="text-sm text-muted-foreground break-all">{status?.deployment.url}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Last Updated</p>
            <p className="text-sm text-muted-foreground">
              {status?.timestamp ? new Date(status.timestamp).toLocaleString() : "Unknown"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>Required configuration for the application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status &&
              Object.entries(status.environmentVariables).map(([key, isSet]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {isSet ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-mono text-sm">{key}</span>
                  </div>
                  <Badge variant={isSet ? "default" : "destructive"}>{isSet ? "Set" : "Missing"}</Badge>
                </div>
              ))}
          </div>

          {status?.missingVariables && status.missingVariables.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Missing Environment Variables</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {status.missingVariables.map((varName) => (
                  <li key={varName} className="font-mono">
                    • {varName}
                  </li>
                ))}
              </ul>
              <div className="mt-3">
                <p className="text-sm text-yellow-700 mb-2">To fix this:</p>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>
                    Go to{" "}
                    <a
                      href="https://vercel.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Vercel Dashboard
                    </a>
                  </li>
                  <li>Find your "justthedamnrecipe" project</li>
                  <li>Go to Settings → Environment Variables</li>
                  <li>Add the missing variables</li>
                  <li>
                    Redeploy with <code className="bg-yellow-100 px-1 rounded">vercel --prod</code>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
