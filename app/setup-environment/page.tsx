"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Copy, ExternalLink, RefreshCw, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EnvVariable {
  name: string
  configured: boolean
  description: string
  required: boolean
}

interface EnvCheckResponse {
  status: string
  configured_count: number
  total_count: number
  environment_variables: Record<string, EnvVariable>
  missing_variables: string[]
}

export default function SetupEnvironmentPage() {
  const [envStatus, setEnvStatus] = useState<EnvCheckResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const environmentVariables = {
    DATABASE_URL: {
      value: "https://api.stack-auth.com/api/v1/projects/85e14859-fd35-4179-a43f-ee56cfea6f7e/.well-known/jwks.json",
      description: "Stack Auth JWKS endpoint for authentication",
      required: true,
      setupUrl: "https://app.stack-auth.com",
    },
    RESEND_API_KEY: {
      value: "re_xxxxxxxxx",
      description: "Your Resend API key for sending emails (replace with your actual key)",
      required: true,
      setupUrl: "https://resend.com/api-keys",
    },
    FROM_EMAIL: {
      value: "contact@justthedamnrecipe.net",
      description: "Email address for sending system emails",
      required: true,
      setupUrl: null,
    },
    JWT_SECRET: {
      value: "your_super_secret_jwt_key_minimum_32_characters_long_random_string_here",
      description: "Secret key for JWT token signing (generate a random 32+ character string)",
      required: true,
      setupUrl: null,
    },
    NEXT_PUBLIC_APP_URL: {
      value: "https://v0-mobile-recipe-site-2aojj74or-aaron-hirshkas-projects.vercel.app",
      description: "Your application's public URL",
      required: true,
      setupUrl: null,
    },
  }

  const checkEnvironmentStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test/env-check")
      if (response.ok) {
        const data = await response.json()
        setEnvStatus(data)
      } else {
        throw new Error("Failed to check environment status")
      }
    } catch (error) {
      console.error("Failed to check environment status:", error)
      toast({
        title: "Error",
        description: "Failed to check environment variables",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkEnvironmentStatus()
  }, [])

  const copyToClipboard = async (text: string, name: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${name} copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (configured: boolean) => {
    return configured ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusBadge = (configured: boolean) => {
    return configured ? (
      <Badge className="bg-green-100 text-green-800">Configured</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Missing</Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Environment Setup</h1>
          <p className="text-gray-600">Configure your environment variables for your Vercel deployment</p>
          <p className="text-sm text-gray-500 mt-1">
            App URL: https://v0-mobile-recipe-site-2aojj74or-aaron-hirshkas-projects.vercel.app
          </p>
        </div>

        {/* Status Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Environment Status</CardTitle>
              <Button onClick={checkEnvironmentStatus} disabled={loading} size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh Status
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {envStatus ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  {envStatus.status === "complete" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {envStatus.status === "complete"
                      ? "All environment variables configured"
                      : "Missing environment variables"}
                  </span>
                  {envStatus.status === "complete" ? (
                    <Badge className="bg-green-100 text-green-800">Complete</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Incomplete</Badge>
                  )}
                </div>

                {envStatus.status !== "complete" && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your site is loading but stuck because {envStatus.missing_variables.length} environment variable
                      {envStatus.missing_variables.length > 1 ? "s are" : " is"} missing:{" "}
                      {envStatus.missing_variables.join(", ")}. Configure these in your Vercel dashboard.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Status</p>
                    <p className="text-gray-600">{envStatus.status}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Configured</p>
                    <p className="text-gray-600">
                      {envStatus.configured_count} / {envStatus.total_count}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Missing</p>
                    <p className="text-gray-600">{envStatus.missing_variables.length} variables</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Click refresh to check environment status</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <div className="space-y-6">
          {Object.entries(environmentVariables).map(([key, config]) => {
            const status = envStatus?.environment_variables[key]
            const isConfigured = status?.configured || false

            return (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(isConfigured)}
                      <CardTitle className="text-lg font-mono">{key}</CardTitle>
                      {config.required && <Badge variant="outline">Required</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(isConfigured)}
                      {config.setupUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={config.setupUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Get Value
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{config.description}</p>

                  {isConfigured && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm font-medium text-green-800 mb-1">✅ This variable is configured</p>
                      <p className="text-sm text-green-700">Value is set in your environment</p>
                    </div>
                  )}

                  {!isConfigured && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm font-medium text-red-800 mb-1">❌ This variable is missing</p>
                      <p className="text-sm text-red-700">Add this to your Vercel environment variables</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Value to Copy:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm break-all font-mono">
                          {config.value}
                        </code>
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(config.value, key)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {key === "DATABASE_URL" && (
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> This is a Stack Auth JWKS endpoint for authentication services.
                        </p>
                      </div>
                    )}

                    {key === "RESEND_API_KEY" && (
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> Replace "re_xxxxxxxxx" with your actual Resend API key from your
                          dashboard.
                        </p>
                      </div>
                    )}

                    {key === "JWT_SECRET" && (
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Security:</strong> Generate a random string of at least 32 characters for production
                          use.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Setup Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Add Environment Variables to Vercel</CardTitle>
            <CardDescription>Follow these steps to configure your environment variables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Access Vercel Dashboard</h3>
                  <p className="text-sm text-gray-600 mb-3">Go to your Vercel dashboard and select your project</p>
                  <Button size="sm" variant="outline" asChild>
                    <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open Vercel Dashboard
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Navigate to Environment Variables</h3>
                  <p className="text-sm text-gray-600">Click on your project → Settings → Environment Variables</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Add Each Variable</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    For each missing variable above, click "Add New" and enter:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>
                      • <strong>Name:</strong> The variable name (e.g., DATABASE_URL)
                    </li>
                    <li>
                      • <strong>Value:</strong> The actual value (use copy buttons above)
                    </li>
                    <li>
                      • <strong>Environment:</strong> Select "Production", "Preview", and "Development"
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Redeploy Your Application</h3>
                  <p className="text-sm text-gray-600">
                    After adding variables, go to Deployments tab and click "Redeploy" on the latest deployment
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Helpful links and tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" asChild className="h-auto p-4 bg-transparent">
                <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                  <div className="text-center">
                    <ExternalLink className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">Vercel Dashboard</p>
                    <p className="text-xs text-gray-500">Configure environment variables</p>
                  </div>
                </a>
              </Button>

              <Button variant="outline" asChild className="h-auto p-4 bg-transparent">
                <a href="https://app.stack-auth.com" target="_blank" rel="noopener noreferrer">
                  <div className="text-center">
                    <ExternalLink className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">Stack Auth</p>
                    <p className="text-xs text-gray-500">Manage authentication</p>
                  </div>
                </a>
              </Button>

              <Button variant="outline" asChild className="h-auto p-4 bg-transparent">
                <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer">
                  <div className="text-center">
                    <ExternalLink className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">Resend API Keys</p>
                    <p className="text-xs text-gray-500">Get email API key</p>
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
