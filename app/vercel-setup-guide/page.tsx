"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, ExternalLink, AlertCircle, Database, Mail, Globe, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function VercelSetupGuidePage() {
  const [copiedValues, setCopiedValues] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedValues({ ...copiedValues, [key]: true })
      toast({
        title: "Copied!",
        description: `${key} copied to clipboard`,
      })
      setTimeout(() => {
        setCopiedValues({ ...copiedValues, [key]: false })
      }, 2000)
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the value manually",
        variant: "destructive",
      })
    }
  }

  const environmentVariables = [
    {
      name: "DATABASE_URL",
      value:
        "postgresql://neondb_owner:npg_XNsY8WRioeC9@ep-restless-glitter-a4wrq0fc-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
      description: "Neon PostgreSQL database connection string",
      icon: <Database className="h-5 w-5 text-green-600" />,
      required: true,
    },
    {
      name: "RESEND_API_KEY",
      value: "re_xxxxxxxxx",
      description: "Get your actual API key from resend.com/api-keys",
      icon: <Mail className="h-5 w-5 text-purple-600" />,
      required: true,
      needsReplacement: true,
    },
    {
      name: "FROM_EMAIL",
      value: "contact@justthedamnrecipe.net",
      description: "Email address for sending system emails",
      icon: <Mail className="h-5 w-5 text-purple-600" />,
      required: true,
    },
    {
      name: "JWT_SECRET",
      value: "your_super_secret_jwt_key_minimum_32_characters_long_random_string_here_2024",
      description: "Secret key for JWT token signing (minimum 32 characters)",
      icon: <Shield className="h-5 w-5 text-blue-600" />,
      required: true,
    },
    {
      name: "NEXT_PUBLIC_APP_URL",
      value: "https://justthedamnrecipe.net",
      description: "Public URL of your application",
      icon: <Globe className="h-5 w-5 text-orange-600" />,
      required: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vercel Environment Setup Guide</h1>
          <p className="text-gray-600">
            Complete step-by-step guide to configure your environment variables and fix the loading issue
          </p>
        </div>

        <Tabs defaultValue="variables" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="variables">Environment Variables</TabsTrigger>
            <TabsTrigger value="steps">Setup Steps</TabsTrigger>
            <TabsTrigger value="troubleshoot">Troubleshooting</TabsTrigger>
          </TabsList>

          <TabsContent value="variables" className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                <strong>Important:</strong> Copy these exact values to your Vercel environment variables. Make sure to
                get your actual Resend API key from{" "}
                <a href="https://resend.com/api-keys" className="underline" target="_blank" rel="noopener noreferrer">
                  resend.com/api-keys
                </a>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {environmentVariables.map((envVar) => (
                <Card key={envVar.name} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {envVar.icon}
                        <div>
                          <CardTitle className="text-lg">{envVar.name}</CardTitle>
                          <CardDescription>{envVar.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {envVar.required && <Badge className="bg-red-100 text-red-800">Required</Badge>}
                        {envVar.needsReplacement && (
                          <Badge className="bg-yellow-100 text-yellow-800">Replace Value</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-3 bg-gray-100 rounded font-mono text-sm break-all">{envVar.value}</div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(envVar.value, envVar.name)}
                          className="flex-shrink-0"
                        >
                          {copiedValues[envVar.name] ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {envVar.needsReplacement && (
                        <Alert className="border-yellow-200 bg-yellow-50">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-yellow-800">
                            <strong>Action Required:</strong> Replace "re_xxxxxxxxx" with your actual Resend API key
                            from{" "}
                            <a
                              href="https://resend.com/api-keys"
                              className="underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              resend.com/api-keys
                            </a>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="steps" className="space-y-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    Access Vercel Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-gray-600">Go to your Vercel dashboard and find your project</p>
                    <Button asChild variant="outline">
                      <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Vercel Dashboard
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    Navigate to Environment Variables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <ul className="space-y-2 text-gray-600">
                      <li>• Click on your project (JTDRecipe or similar)</li>
                      <li>• Click the "Settings" tab</li>
                      <li>• Click "Environment Variables" in the left sidebar</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    Add Environment Variables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-gray-600">For each variable above:</p>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Click "Add New"</li>
                      <li>• Enter the Name (e.g., DATABASE_URL)</li>
                      <li>• Paste the Value from the Variables tab</li>
                      <li>• Select: Production, Preview, Development</li>
                      <li>• Click "Save"</li>
                    </ul>
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-800">
                        <strong>Critical:</strong> Make sure to get your actual RESEND_API_KEY from resend.com/api-keys
                        - don't use the placeholder "re_xxxxxxxxx"
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    Force Redeployment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-gray-600">Environment variables only take effect after redeployment:</p>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Go to "Deployments" tab</li>
                      <li>• Find the latest deployment</li>
                      <li>• Click the "..." menu next to it</li>
                      <li>• Click "Redeploy"</li>
                      <li>• Wait for "Ready" status (1-2 minutes)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      5
                    </div>
                    Test Your Fix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-gray-600">Verify everything is working:</p>
                    <div className="flex gap-3">
                      <Button asChild>
                        <a href="/test-connection">Test Connection</a>
                      </Button>
                      <Button asChild variant="outline">
                        <a href="https://justthedamnrecipe.net" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Test Homepage
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="troubleshoot" className="space-y-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <strong>Still showing "Loading..."?</strong> Here are the most common issues and solutions.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Variables Not Saved Properly</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">
                    Sometimes Vercel doesn't save environment variables correctly on the first try.
                  </p>
                  <ul className="space-y-1 text-gray-600 text-sm">
                    <li>• Go back to Settings → Environment Variables</li>
                    <li>• Verify all 5 variables are listed with values</li>
                    <li>• If any are missing, add them again</li>
                    <li>• Make sure they're enabled for Production</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">No Redeployment After Adding Variables</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">Environment variables only work after a successful redeployment.</p>
                  <ul className="space-y-1 text-gray-600 text-sm">
                    <li>• Check Deployments tab for recent activity</li>
                    <li>• Look for "Ready" status with green checkmark</li>
                    <li>• If no recent deployment, manually redeploy</li>
                    <li>• Wait for deployment to complete before testing</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Wrong RESEND_API_KEY</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">Using the placeholder instead of your actual API key.</p>
                  <ul className="space-y-1 text-gray-600 text-sm">
                    <li>• Visit resend.com/api-keys to get your real key</li>
                    <li>• Replace "re_xxxxxxxxx" with actual key starting with "re_"</li>
                    <li>• Make sure the key has proper permissions</li>
                    <li>• Test the key works in Resend dashboard</li>
                  </ul>
                  <Button asChild variant="outline" className="mt-3 bg-transparent">
                    <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Get Resend API Key
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Build or Runtime Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">Check for errors in your deployment logs.</p>
                  <ul className="space-y-1 text-gray-600 text-sm">
                    <li>• Go to Deployments → Click latest deployment</li>
                    <li>• Check "Build Logs" for red error messages</li>
                    <li>• Look for "Function Logs" for runtime errors</li>
                    <li>• Common issues: missing dependencies, syntax errors</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
