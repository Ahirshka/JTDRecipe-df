import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Just The Damn Recipe",
  description: "Simple, straightforward recipes without the life stories",
  authors: [{ name: "Aaron Hirshka" }],
  generator: "v0.dev",
  keywords: ["recipes", "cooking", "food", "simple recipes", "quick meals"],
  creator: "Aaron Hirshka",
  publisher: "Just The Damn Recipe",
  robots: "index, follow",
  googlebot: "index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1",
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  verification: {
    google: "your-google-verification-code",
  },
  openGraph: {
    title: "Just The Damn Recipe",
    description: "Simple, straightforward recipes without the life stories",
    url: "https://www.justhtedamnrecipe.net",
    siteName: "Just The Damn Recipe",
    locale: "en_US",
    images: [
      {
        url: "https://www.justhtedamnrecipe.net/placeholder-logo.png",
        width: 1200,
        height: 630,
        alt: "Just The Damn Recipe",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Just The Damn Recipe",
    description: "Simple, straightforward recipes without the life stories",
    images: ["https://www.justhtedamnrecipe.net/placeholder-logo.png"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <Navigation />
            {children}
            <Footer />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
