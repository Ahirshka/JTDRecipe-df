"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Database, Mail, Globe, GitBranch, Calendar, CheckCircle, XCircle } from "lucide-react"

interface ProjectInfo {
  name: string
  domain: string
  framework: string
  environment: string
  vercel_url?: string
  app_url?: string
  has_database: boolean
  has_email: boolean
  has_jwt: boolean
  deployment_id?: string
  git_branch?: string
  timestamp: string
}

export default function WhichProjectPage() {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjectInfo = async () => {
      try {
        const response = await fetch("/api/project-info")
        const data = await response.json()

        if (data.success) {
          setProjectInfo(data.project)
        } else {
          setError(data.message || "Failed to load project information")
        }
      } catch (err) {
        setError("Network error loading project information")
      } finally {
        setLoading(false)
      }
    }

    fetchProjectInfo()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Loading Project Information...</h1>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!projectInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-yellow-800">No project information available</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const configurationStatus = [
    {
      name: "Database",
      configured: projectInfo.has_database,
      icon: <Database className="w-4 h-4" />,
      description: "Neon PostgreSQL connection",
    },
    {
      name: "Email Service",
      configured: projectInfo.has_email,
      icon: <Mail className="w-4 h-4" />,
      description: "Resend API for emails",
    },
    {
      name: "JWT Secret",
      configured: projectInfo.has_jwt,
      icon: <CheckCircle className="w-4 h-4" />,
      description: "Authentication token signing",
    },
  ]

  const configuredCount = configurationStatus.filter((item) => item.configured).length
  const totalCount = configurationStatus.length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Information</h1>
          <p className="text-gray-600">Details about your current Vercel deployment</p>
        </div>

        {/* Main Project Info */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{projectInfo.name}</CardTitle>
                <CardDescription className="text-lg">{projectInfo.domain}</CardDescription>
              </div>
              <Badge className="bg-blue-100 text-blue-800 text-lg px-3 py-1">{projectInfo.framework}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Domain:</span>
                  <span className="text-gray-600">{projectInfo.domain}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Environment:</span>
                  <Badge
                    className={
                      projectInfo.environment === "production"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {projectInfo.environment}
                  </Badge>
                </div>
                {projectInfo.git_branch && (
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Branch:</span>
                    <span className="text-gray-600">{projectInfo.git_branch}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {projectInfo.app_url && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">App URL:</span>
                    <a
                      href={projectInfo.app_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {projectInfo.app_url}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">Last Check:</span>
                  <span className="text-gray-600">{new Date(projectInfo.timestamp).toLocaleString()}</span>
                </div>
                {projectInfo.deployment_id && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Deployment:</span>
                    <span className="text-gray-600 font-mono text-sm">
                      {projectInfo.deployment_id.substring(0, 8)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
            <CardDescription>
              {configuredCount} of {totalCount} services configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {configurationStatus.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.configured ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <Badge className="bg-green-100 text-green-800">Configured</Badge>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-500" />
                        <Badge className="bg-red-100 text-red-800">Missing</Badge>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vercel Project Name */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Vercel Project Identification</CardTitle>
            <CardDescription>Information to help you find this project in your Vercel dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  <strong>Look for this project in your Vercel dashboard:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>
                      • <strong>Project Name:</strong> Likely "JTDRecipe", "recipe-site", or "justthedamnrecipe"
                    </li>
                    <li>
                      • <strong>Domain:</strong> {projectInfo.domain}
                    </li>
                    <li>
                      • <strong>Framework:</strong> {projectInfo.framework}
                    </li>
                    <li>
                      • <strong>Git Branch:</strong> {projectInfo.git_branch || "main/master"}
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild>
                  <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Vercel Dashboard
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href="/test-connection">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Test Configuration
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {configuredCount < totalCount ? (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">
                    <strong>Configuration Incomplete:</strong> You have {totalCount - configuredCount} missing
                    environment variables. This is likely why your site shows "Loading...".
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-800">
                    <strong>Configuration Complete:</strong> All environment variables are configured. If you're still
                    seeing "Loading...", you may need to redeploy your application.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild variant="outline">
                  <a href="/vercel-setup-guide">Setup Environment</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="/troubleshoot-loading">Troubleshoot Loading</a>
                </Button>
                <Button asChild variant="outline">
                  <a href={projectInfo.app_url || `https://${projectInfo.domain}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Test Homepage
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
