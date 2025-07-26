import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">JTD</span>
              </div>
              <span className="text-xl font-bold text-gray-900">JTD Recipe</span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Discover, share, and create amazing recipes with our community of food lovers. From quick weeknight
              dinners to elaborate weekend feasts, find your next favorite dish.
            </p>
            <div className="flex space-x-4">
              <Link href="/about" className="text-gray-500 hover:text-gray-700 transition-colors">
                About Us
              </Link>
              <Link href="/contact" className="text-gray-500 hover:text-gray-700 transition-colors">
                Contact
              </Link>
              <Link href="/blog" className="text-gray-500 hover:text-gray-700 transition-colors">
                Blog
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/recipes" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Browse Recipes
                </Link>
              </li>
              <li>
                <Link href="/add-recipe" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Add Recipe
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="text-gray-600 hover:text-gray-900 transition-colors">
                  My Favorites
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/termsandconditions" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Report Content
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} JTD Recipe Team. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-gray-500 text-sm">Made with ❤️ for food lovers</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Add default export
export default Footer
