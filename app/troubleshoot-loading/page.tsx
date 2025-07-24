"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, ExternalLink, Play, CheckCircle } from "lucide-react"

export default function TroubleshootLoadingPage() {
  const [checkingStatus, setCheckingStatus] = useState(false)

  const troubleshootingSteps = [
    {
      title: "Force Redeploy Your Application",
      description: "Environment variables only work after redeployment",
      action: "Redeploy Now",
      link: "https://vercel.com/dashboard",
      priority: "critical",
      details: [
        "Go to your Vercel project → Deployments tab",
        "Find the latest deployment (should be recent)",
        "Click the '...' menu next to the deployment",
        "Click 'Redeploy' and wait for 'Ready' status",
        "This forces Vercel to use your new environment variables",
      ],
    },
    {
      title: "Verify Environment Variables Were Saved",
      description: "Check if all 5 variables are actually in Vercel",
      action: "Check Variables",
      link: "https://vercel.com/dashboard",
      priority: "high",
      details: [
        "Go to your project → Settings → Environment Variables",
        "Verify all 5 variables are listed: DATABASE_URL, RESEND_API_KEY, FROM_EMAIL, JWT_SECRET, NEXT_PUBLIC_APP_URL",
        "Check that each variable has a value (not empty)",
        "Ensure they're enabled for Production, Preview, and Development",
        "Look for any red error indicators next to variables",
      ],
    },
    {
      title: "Check Deployment Status and Logs",
      description: "Look for build errors or deployment failures",
      action: "Check Logs",
      link: "https://vercel.com/dashboard",
      priority: "high",
      details: [
        "Go to your project → Deployments tab",
        "Click on the latest deployment",
        "Check 'Build Logs' for any red error messages",
        "Look at 'Function Logs' for runtime errors",
        "Ensure deployment status shows 'Ready' with green checkmark",
      ],
    },
    {
      title: "Test Individual Components",
      description: "Run diagnostic tests to see what's still failing",
      action: "Run Tests",
      link: "/test-connection",
      priority: "medium",
      details: [
        "Click 'Run All Tests' to see detailed results",
        "Environment test should now pass (green checkmark)",
        "Database test should pass if DATABASE_URL is correct",
        "Email test should pass if RESEND_API_KEY is valid",
        "Domain test should pass if site is accessible",
      ],
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-red-500 bg-red-50"
      case "high":
        return "border-orange-500 bg-orange-50"
      case "medium":
        return "border-blue-500 bg-blue-50"
      default:
        return "border-gray-500 bg-gray-50"
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">CRITICAL</span>
      case "high":
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">HIGH</span>
      case "medium":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">MEDIUM</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">LOW</span>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fix: Build Not Redeploying</h1>
          <p className="text-gray-600">
            Your environment variables won't work until your application is successfully redeployed. Let's fix this.
          </p>
        </div>

        {/* Critical Alert */}
        <Alert className="mb-8 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>Root Cause Identified:</strong> Your build is not being redeployed after adding environment
            variables. Environment variables only take effect after a successful redeployment in Vercel.
          </AlertDescription>
        </Alert>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Immediate Actions Required</CardTitle>
            <CardDescription>Do these steps in order to fix the loading issue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button asChild className="bg-red-600 hover:bg-red-700 h-auto p-4">
                <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                  <div className="text-center">
                    <Play className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-semibold">Force Redeploy</p>
                    <p className="text-xs opacity-90">Go to Vercel → Deployments → Redeploy</p>
                  </div>
                </a>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
                <a href="/test-connection">
                  <div className="text-center">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-semibold">Test After Redeploy</p>
                    <p className="text-xs text-gray-600">Run tests to verify fix</p>
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step-by-Step Guide */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Step-by-Step Fix</h2>

          {troubleshootingSteps.map((step, index) => (
            <Card key={index} className={`border-l-4 ${getPriorityColor(step.priority)}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {step.title}
                        {getPriorityBadge(step.priority)}
                      </CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <a href={step.link} target={step.link.startsWith("http") ? "_blank" : undefined}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {step.action}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How to Force Redeploy */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-red-600">🚨 How to Force Redeploy in Vercel</CardTitle>
            <CardDescription>Detailed instructions for forcing a redeployment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-900 mb-2">Method 1: Redeploy Existing Deployment</h3>
                <ol className="space-y-1 text-sm text-red-800 list-decimal list-inside">
                  <li>Go to your Vercel dashboard</li>
                  <li>Click on your project</li>
                  <li>Click the "Deployments" tab</li>
                  <li>Find the latest deployment</li>
                  <li>Click the "..." (three dots) menu next to it</li>
                  <li>Click "Redeploy"</li>
                  <li>Wait for "Ready" status (1-2 minutes)</li>
                </ol>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Method 2: Trigger New Deployment</h3>
                <ol className="space-y-1 text-sm text-blue-800 list-decimal list-inside">
                  <li>Make a small change to your code (add a comment)</li>
                  <li>Commit and push to your GitHub repository</li>
                  <li>Vercel will automatically deploy the new commit</li>
                  <li>This ensures environment variables are loaded</li>
                </ol>
              </div>

              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-800">
                  <strong>After Redeployment:</strong> Your site should load properly instead of showing "Loading...".
                  Run the connection tests to verify all systems are working.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* What to Expect */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What to Expect After Redeployment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">✅ Success Indicators</h3>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>• Homepage loads instead of "Loading..."</li>
                    <li>• Connection tests show green checkmarks</li>
                    <li>• Environment variables test passes</li>
                    <li>• Database connection works</li>
                    <li>• Email service is configured</li>
                  </ul>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2">❌ Still Having Issues?</h3>
                  <ul className="space-y-1 text-sm text-red-800">
                    <li>• Check deployment logs for errors</li>
                    <li>• Verify all 5 environment variables exist</li>
                    <li>• Ensure RESEND_API_KEY is not placeholder</li>
                    <li>• Try removing and re-adding variables</li>
                    <li>• Contact support if build keeps failing</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
