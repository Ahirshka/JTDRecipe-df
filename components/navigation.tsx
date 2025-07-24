"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Settings, LogOut, Shield } from "lucide-react"

interface UserInterface {
  id: string
  username: string
  email: string
  role: string
  avatar?: string
}

export function Navigation() {
  const [user, setUser] = useState<UserInterface | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const getUserInitials = (username: string) => {
    return username
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const isAdmin = user?.role === "admin" || user?.role === "owner"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">JTD</span>
          </div>
          <span className="font-bold text-xl">Just The Damn Recipe</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium hover:text-orange-500 transition-colors">
            Home
          </Link>
          <Link href="/search" className="text-sm font-medium hover:text-orange-500 transition-colors">
            Browse Recipes
          </Link>
          {user && (
            <Link href="/add-recipe" className="text-sm font-medium hover:text-orange-500 transition-colors">
              Add Recipe
            </Link>
          )}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {isLoading ? (
            <div className="h-9 w-20 bg-gray-200 animate-pulse rounded-md" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                    <AvatarFallback>{getUserInitials(user.username)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <p className="text-xs leading-none text-orange-500 capitalize">{user.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-4">
                <Link
                  href="/"
                  className="text-lg font-medium hover:text-orange-500 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/search"
                  className="text-lg font-medium hover:text-orange-500 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Browse Recipes
                </Link>
                {user && (
                  <Link
                    href="/add-recipe"
                    className="text-lg font-medium hover:text-orange-500 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Add Recipe
                  </Link>
                )}

                <div className="border-t pt-4">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                          <AvatarFallback>{getUserInitials(user.username)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-orange-500 capitalize">{user.role}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Link
                          href="/profile"
                          className="flex items-center space-x-2 text-lg font-medium hover:text-orange-500 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          href="/profile/settings"
                          className="flex items-center space-x-2 text-lg font-medium hover:text-orange-500 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center space-x-2 text-lg font-medium hover:text-orange-500 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Shield className="h-4 w-4" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            handleLogout()
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center space-x-2 text-lg font-medium hover:text-orange-500 transition-colors w-full text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Log out</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button variant="ghost" asChild className="w-full justify-start">
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                          Login
                        </Link>
                      </Button>
                      <Button asChild className="w-full">
                        <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
