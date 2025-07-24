import Link from "next/link"
import { ChefHat, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <ChefHat className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold">Just The Damn Recipe</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              No life stories, no endless scrolling, no ads. Just simple, straightforward recipes that work.
            </p>
            <div className="flex items-center text-sm text-gray-400">
              <span>Made with</span>
              <Heart className="h-4 w-4 mx-1 text-red-500" />
              <span>by Aaron Hirshka</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-gray-300 hover:text-white transition-colors">
                  Browse Recipes
                </Link>
              </li>
              <li>
                <Link href="/add-recipe" className="text-gray-300 hover:text-white transition-colors">
                  Add Recipe
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-300 hover:text-white transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/termsandconditions" className="text-gray-300 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/database-setup" className="text-gray-300 hover:text-white transition-colors">
                  Database Setup
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Just The Damn Recipe. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                Contact
              </Link>
              <Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                About
              </Link>
              <Link href="/help" className="text-gray-400 hover:text-white text-sm transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
