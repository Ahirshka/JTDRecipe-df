import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-bold text-orange-400">
              JTDRecipe
            </Link>
            <p className="mt-4 text-gray-300 max-w-md">
              Just the damn recipe. No life stories, no endless scrolling, just the recipes you need to cook great food.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/search" className="text-gray-300 hover:text-orange-400 transition-colors">
                  Browse Recipes
                </Link>
              </li>
              <li>
                <Link href="/add-recipe" className="text-gray-300 hover:text-orange-400 transition-colors">
                  Add Recipe
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-300 hover:text-orange-400 transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-300 hover:text-orange-400 transition-colors">
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
                <Link href="/privacy" className="text-gray-300 hover:text-orange-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/termsandconditions" className="text-gray-300 hover:text-orange-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Just The Damn Recipe. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-2 md:mt-0">Made with ❤️ by Aaron Hirshka</p>
        </div>
      </div>
    </footer>
  )
}
