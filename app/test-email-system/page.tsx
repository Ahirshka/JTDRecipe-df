"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Clock, Mail, Send, AlertTriangle, Settings, TestTube, Loader2 } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "success" | "error" | "idle"
  message: string
  details?: any
  timestamp?: string
}

interface EmailTest {
  type: "verification" | "password_reset" | "welcome" | "custom"
  recipient: string
  subject?: string
  content?: string
}

export default function TestEmailSystem() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [emailTest, setEmailTest] = useState<EmailTest>({
    type: "verification",
    recipient: "",
  })
  const [customEmail, setCustomEmail] = useState({
    to: "",
    subject: "",
    content: "",
  })

  const updateTest = (name: string, status: TestResult["status"], message: string, details?: any) => {
    setTests((prev) => {
      const existing = prev.find((t) => t.name === name)
      const timestamp = new Date().toLocaleTimeString()

      if (existing) {
        existing.status = status
        existing.message = message
        existing.details = details
        existing.timestamp = timestamp
        return [...prev]
      }
      return [...prev, { name, status, message, details, timestamp }]
    })
  }

  const runEmailSystemTests = async () => {
    setIsRunning(true)
    setTests([])

    try {
      // Test 1: Environment Variables Check
      updateTest("Environment Check", "pending", "Checking email service configuration...")

      const envResponse = await fetch("/api/test/email-config")
      const envData = await envResponse.json()

      if (envData.configured) {
        updateTest("Environment Check", "success", "Email service properly configured", envData)
      } else {
        updateTest("Environment Check", "error", `Missing configuration: ${envData.missing?.join(", ")}`)
        return
      }

      // Test 2: Email Service Connection
      updateTest("Service Connection", "pending", "Testing connection to email service...")

      const connectionResponse = await fetch("/api/test/email-connection")
      const connectionData = await connectionResponse.json()

      if (connectionData.success) {
        updateTest("Service Connection", "success", "Successfully connected to email service")
      } else {
        updateTest("Service Connection", "error", `Connection failed: ${connectionData.error}`)
        return
      }

      // Test 3: Template Rendering
      updateTest("Template Rendering", "pending", "Testing email template rendering...")

      const templateResponse = await fetch("/api/test/email-templates")
      const templateData = await templateResponse.json()

      if (templateData.success) {
        updateTest(
          "Template Rendering",
          "success",
          `All ${templateData.templates.length} templates rendered successfully`,
          templateData.templates,
        )
      } else {
        updateTest("Template Rendering", "error", `Template rendering failed: ${templateData.error}`)
      }

      // Test 4: Database Token System
      updateTest("Token System", "pending", "Testing email token generation and storage...")

      const tokenResponse = await fetch("/api/test/email-tokens")
      const tokenData = await tokenResponse.json()

      if (tokenData.success) {
        updateTest("Token System", "success", "Email tokens generated and stored successfully", tokenData)
      } else {
        updateTest("Token System", "error", `Token system failed: ${tokenData.error}`)
      }

      // Test 5: Send Test Email (if recipient provided)
      if (emailTest.recipient) {
        updateTest("Email Delivery", "pending", `Sending test email to ${emailTest.recipient}...`)

        const deliveryResponse = await fetch("/api/test/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: emailTest.type,
            recipient: emailTest.recipient,
          }),
        })

        const deliveryData = await deliveryResponse.json()

        if (deliveryData.success) {
          updateTest(
            "Email Delivery",
            "success",
            `Test email sent successfully to ${emailTest.recipient}`,
            deliveryData,
          )
        } else {
          updateTest("Email Delivery", "error", `Email delivery failed: ${deliveryData.error}`)
        }
      }

      // Test 6: Email Queue Status (if applicable)
      updateTest("Queue Status", "pending", "Checking email queue status...")

      const queueResponse = await fetch("/api/test/email-queue")
      const queueData = await queueResponse.json()

      if (queueData.success) {
        updateTest("Queue Status", "success", "Email queue is operational", queueData)
      } else {
        updateTest("Queue Status", "error", `Queue check failed: ${queueData.error}`)
      }
    } catch (error) {
      console.error("Email system test error:", error)
      updateTest("System Error", "error", `Unexpected error: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  const sendCustomEmail = async () => {
    if (!customEmail.to || !customEmail.subject || !customEmail.content) {
      alert("Please fill in all fields for the custom email")
      return
    }

    setIsRunning(true)
    updateTest("Custom Email", "pending", `Sending custom email to ${customEmail.to}...`)

    try {
      const response = await fetch("/api/test/send-custom-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customEmail),
      })

      const data = await response.json()

      if (data.success) {
        updateTest("Custom Email", "success", `Custom email sent successfully`, data)
      } else {
        updateTest("Custom Email", "error", `Custom email failed: ${data.error}`)
      }
    } catch (error) {
      updateTest("Custom Email", "error", `Custom email error: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />
      default:
        return <TestTube className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>
      case "error":
        return <Badge variant="destructive">Failed</Badge>
      case "pending":
        return <Badge variant="secondary">Running</Badge>
      default:
        return <Badge variant="outline">Idle</Badge>
    }
  }

  const successCount = tests.filter((t) => t.status === "success").length
  const errorCount = tests.filter((t) => t.status === "error").length
  const totalTests = tests.length

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📧 Email System Test Suite</h1>
        <p className="text-gray-600">
          Comprehensive testing of the email service including configuration, templates, delivery, and token management.
        </p>
      </div>

      <Tabs defaultValue="automated" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="automated">Automated Tests</TabsTrigger>
          <TabsTrigger value="manual">Manual Testing</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        {/* Automated Tests Tab */}
        <TabsContent value="automated" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Automated Email System Tests</span>
              </CardTitle>
              <CardDescription>
                Run comprehensive tests to verify email service configuration and functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-recipient">Test Email Recipient (Optional)</Label>
                <Input
                  id="test-recipient"
                  type="email"
                  placeholder="your-email@example.com"
                  value={emailTest.recipient}
                  onChange={(e) => setEmailTest({ ...emailTest, recipient: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  If provided, a test email will be sent to verify actual delivery
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email Type to Test</Label>
                <div className="flex space-x-2">
                  {["verification", "password_reset", "welcome"].map((type) => (
                    <Button
                      key={type}
                      variant={emailTest.type === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEmailTest({ ...emailTest, type: type as any })}
                    >
                      {type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={runEmailSystemTests}
                disabled={isRunning}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                {isRunning ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Running Email Tests...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <TestTube className="h-4 w-4" />
                    <span>Run Email System Tests</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Test Summary */}
          {tests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{successCount}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{totalTests}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {totalTests > 0 ? Math.round((successCount / totalTests) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Manual Testing Tab */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Send Custom Test Email</span>
              </CardTitle>
              <CardDescription>Send a custom email to test the email service manually</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-to">Recipient Email</Label>
                <Input
                  id="custom-to"
                  type="email"
                  placeholder="recipient@example.com"
                  value={customEmail.to}
                  onChange={(e) => setCustomEmail({ ...customEmail, to: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-subject">Subject</Label>
                <Input
                  id="custom-subject"
                  placeholder="Test Email Subject"
                  value={customEmail.subject}
                  onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-content">Email Content (HTML)</Label>
                <Textarea
                  id="custom-content"
                  placeholder="<h1>Test Email</h1><p>This is a test email from Just The Damn Recipe.</p>"
                  rows={6}
                  value={customEmail.content}
                  onChange={(e) => setCustomEmail({ ...customEmail, content: e.target.value })}
                />
              </div>

              <Button
                onClick={sendCustomEmail}
                disabled={isRunning || !customEmail.to || !customEmail.subject || !customEmail.content}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4" />
                    <span>Send Custom Email</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Test Templates</CardTitle>
              <CardDescription>Click to populate the form with pre-made test templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCustomEmail({
                      to: "",
                      subject: "Test Email - Basic HTML",
                      content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h1 style="color: #ea580c;">Test Email</h1>
                      <p>This is a basic HTML test email from Just The Damn Recipe.</p>
                      <p>If you received this email, the email service is working correctly!</p>
                      <hr>
                      <p style="font-size: 12px; color: #666;">Sent at: ${new Date().toLocaleString()}</p>
                    </div>`,
                    })
                  }
                >
                  Basic HTML Template
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    setCustomEmail({
                      to: "",
                      subject: "Test Email - Rich Content",
                      content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
                      <div style="background: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1>🍳 Just The Damn Recipe</h1>
                      </div>
                      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
                        <h2>Email Service Test</h2>
                        <p>This is a rich content test email with:</p>
                        <ul>
                          <li>✅ HTML formatting</li>
                          <li>🎨 Styled content</li>
                          <li>📧 Professional layout</li>
                        </ul>
                        <div style="background: #fef3cd; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0;">
                          <strong>Success!</strong> If you can see this email, your email service is configured correctly.
                        </div>
                        <p>Test completed at: <strong>${new Date().toLocaleString()}</strong></p>
                      </div>
                    </div>`,
                    })
                  }
                >
                  Rich Content Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {tests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tests have been run yet. Switch to the "Automated Tests" tab to get started.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Detailed Test Results</h2>
              {tests.map((test, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(test.status)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900">{test.name}</h3>
                            {getStatusBadge(test.status)}
                            {test.timestamp && <span className="text-xs text-gray-500">{test.timestamp}</span>}
                          </div>
                          <p className="text-sm text-gray-600">{test.message}</p>
                          {test.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                Show Details
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(test.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Troubleshooting</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>Common Issues:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>
                    • <strong>Missing API Key:</strong> Ensure RESEND_API_KEY is set in environment variables
                  </li>
                  <li>
                    • <strong>Invalid Domain:</strong> Verify your domain is configured in Resend dashboard
                  </li>
                  <li>
                    • <strong>Rate Limits:</strong> Check if you've exceeded your email sending limits
                  </li>
                  <li>
                    • <strong>Spam Filters:</strong> Test emails might go to spam folder
                  </li>
                  <li>
                    • <strong>Database Issues:</strong> Ensure email_tokens table exists
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Required Environment Variables:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• RESEND_API_KEY</li>
                  <li>• FROM_EMAIL</li>
                  <li>• NEXT_PUBLIC_APP_URL</li>
                  <li>• DATABASE_URL</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Test Coverage:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Configuration validation</li>
                  <li>• Service connectivity</li>
                  <li>• Template rendering</li>
                  <li>• Token generation</li>
                  <li>• Email delivery</li>
                  <li>• Queue status</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
