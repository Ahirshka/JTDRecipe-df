"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react"

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("No verification token provided")
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage("Your email has been verified successfully!")

        // Redirect to home page after 3 seconds
        setTimeout(() => {
          router.push("/")
        }, 3000)
      } else {
        setStatus("error")
        setMessage(data.error || "Email verification failed")
      }
    } catch (error) {
      console.error("Verification error:", error)
      setStatus("error")
      setMessage("An error occurred during verification")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              {status === "loading" && (
                <div className="p-3 bg-blue-100 rounded-full">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              )}
              {status === "success" && (
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              )}
              {status === "error" && (
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              )}
            </div>

            <CardTitle className="text-2xl font-bold text-gray-900">
              {status === "loading" && "Verifying Email..."}
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
            </CardTitle>

            <CardDescription className="text-gray-600">{message}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {status === "success" && (
              <div className="text-center space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your account is now fully activated. You'll be redirected to the homepage in a few seconds.
                  </AlertDescription>
                </Alert>

                <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                  <Link href="/">
                    Continue to Homepage
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="text-center space-y-4">
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/resend-verification">
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </Link>
                  </Button>

                  <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                    <Link href="/login">Back to Login</Link>
                  </Button>
                </div>
              </div>
            )}

            {status === "loading" && (
              <div className="text-center">
                <p className="text-sm text-gray-600">Please wait while we verify your email address...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
