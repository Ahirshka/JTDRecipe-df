import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { checkAndInitializeDatabase } from "@/lib/auto-init"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Just The Damn Recipe",
  description: "Simple, clean recipes without the life stories",
  keywords: ["recipes", "cooking", "food", "simple recipes"],
  authors: [{ name: "Aaron Hirshka" }],
  openGraph: {
    title: "Just The Damn Recipe",
    description: "Simple, clean recipes without the life stories",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Just The Damn Recipe",
    description: "Simple, clean recipes without the life stories",
  },
    generator: 'v0.dev'
}

// Initialize database on app startup
checkAndInitializeDatabase().catch(console.error)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <Navigation />
          <main>{children}</main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
