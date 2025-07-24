"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  Database,
  Mail,
  Server,
  ExternalLink,
  RefreshCw,
} from "lucide-react"

interface TestResult {
  name: string
  status: "success" | "error" | "warning" | "pending"
  message: string
  details?: string
  url?: string
}

export default function TestDeploymentPage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)
  const [domainInfo, setDomainInfo] = useState<any>(null)

  const testSuites = [
    {
      name: "Domain & SSL",
      tests: [
        { key: "domain", name: "Domain Resolution", endpoint: "/api/test/domain" },
        { key: "ssl", name: "SSL Certificate", endpoint: "/api/test/ssl" },
        { key: "redirect", name: "WWW Redirect", endpoint: "/api/test/redirect" },
      ],
    },
    {
      name: "Database",
      tests: [
        { key: "db-connection", name: "Database Connection", endpoint: "/api/test/database" },
        { key: "db-tables", name: "Database Tables", endpoint: "/api/test/database-tables" },
        { key: "db-data", name: "Sample Data", endpoint: "/api/test/database-data" },
      ],
    },
    {
      name: "Email Service",
      tests: [
        { key: "email-config", name: "Email Configuration", endpoint: "/api/test/email-config" },
        { key: "email-connection", name: "Email Service", endpoint: "/api/test/email-connection" },
        { key: "email-delivery", name: "Email Delivery", endpoint: "/api/test/email-delivery" },
      ],
    },
    {
      name: "Application",
      tests: [
        { key: "api-health", name: "API Health", endpoint: "/api/health" },
        { key: "auth-system", name: "Authentication", endpoint: "/api/test/auth" },
        { key: "recipe-system", name: "Recipe System", endpoint: "/api/test/recipes" },
      ],
    },
  ]

  useEffect(() => {
    // Get domain information
    setDomainInfo({
      currentUrl: window.location.href,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    })
  }, [])

  const runAllTests = async () => {
    setRunning(true)
    setTests([])

    const allTests = testSuites.flatMap((suite) => suite.tests)

    for (const test of allTests) {
      setTests((prev) => [
        ...prev,
        {
          name: test.name,
          status: "pending",
          message: "Running test...",
        },
      ])

      try {
        const response = await fetch(test.endpoint)
        const result = await response.json()

        setTests((prev) =>
          prev.map((t) =>
            t.name === test.name
              ? {
                  name: test.name,
                  status: response.ok && result.success ? "success" : "error",
                  message: result.message || (response.ok ? "Test passed" : "Test failed"),
                  details: result.details || result.error,
                  url: result.url,
                }
              : t,
          ),
        )
      } catch (error) {
        setTests((prev) =>
          prev.map((t) =>
            t.name === test.name
              ? {
                  name: test.name,
                  status: "error",
                  message: "Test failed to run",
                  details: error instanceof Error ? error.message : "Unknown error",
                }
              : t,
          ),
        )
      }

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case "pending":
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
    }
  }

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return "text-green-600"
      case "error":
        return "text-red-600"
      case "warning":
        return "text-yellow-600"
      case "pending":
        return "text-blue-600"
    }
  }

  const successCount = tests.filter((t) => t.status === "success").length
  const errorCount = tests.filter((t) => t.status === "error").length
  const warningCount = tests.filter((t) => t.status === "warning").length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Deployment Testing</h1>
          <p className="text-gray-600">
            Test your application's connection to the 3rd party domain and verify all systems
          </p>
        </div>

        {/* Domain Information */}
        {domainInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Current Environment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">URL:</span>
                  <p className="break-all">{domainInfo.currentUrl}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Hostname:</span>
                  <p>{domainInfo.hostname}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Protocol:</span>
                  <p>{domainInfo.protocol}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Port:</span>
                  <p>{domainInfo.port || "default"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Timestamp:</span>
                  <p>{new Date(domainInfo.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Suite</CardTitle>
            <CardDescription>Run comprehensive tests to verify your deployment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Button onClick={runAllTests} disabled={running} className="flex items-center gap-2">
                {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {running ? "Running Tests..." : "Run All Tests"}
              </Button>

              {tests.length > 0 && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{successCount} passed</span>
                  </div>
                  {errorCount > 0 && (
                    <div className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>{errorCount} failed</span>
                    </div>
                  )}
                  {warningCount > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span>{warningCount} warnings</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {tests.length > 0 && (
              <div className="space-y-2">
                {testSuites.map((suite) => (
                  <div key={suite.name}>
                    <h3 className="font-semibold text-gray-900 mb-2">{suite.name}</h3>
                    <div className="space-y-1 mb-4">
                      {suite.tests.map((test) => {
                        const result = tests.find((t) => t.name === test.name)
                        return result ? (
                          <div
                            key={test.name}
                            className="flex items-center justify-between p-3 bg-white rounded border"
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(result.status)}
                              <span className="font-medium">{result.name}</span>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm ${getStatusColor(result.status)}`}>{result.message}</p>
                              {result.details && <p className="text-xs text-gray-500 mt-1">{result.details}</p>}
                              {result.url && (
                                <a
                                  href={result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                >
                                  View <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Test specific functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" asChild className="h-auto p-4 bg-transparent">
                <a href="/test-recipe-submission" className="flex flex-col items-center gap-2">
                  <Server className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium">Test Recipe Submission</div>
                    <div className="text-xs text-gray-500">Submit test recipes</div>
                  </div>
                </a>
              </Button>

              <Button variant="outline" asChild className="h-auto p-4 bg-transparent">
                <a href="/admin" className="flex flex-col items-center gap-2">
                  <Database className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium">Admin Panel</div>
                    <div className="text-xs text-gray-500">Moderate recipes</div>
                  </div>
                </a>
              </Button>

              <Button variant="outline" asChild className="h-auto p-4 bg-transparent">
                <a href="/test-email-system" className="flex flex-col items-center gap-2">
                  <Mail className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium">Email Testing</div>
                    <div className="text-xs text-gray-500">Test email delivery</div>
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
