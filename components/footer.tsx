import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-orange-600">JTDRecipe</div>
            </div>
            <p className="mt-2 text-gray-600 max-w-md">
              Discover, share, and enjoy delicious recipes from our community of food lovers. From quick weeknight
              dinners to special occasion treats.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Quick Links</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/" className="text-base text-gray-500 hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/add-recipe" className="text-base text-gray-500 hover:text-gray-900">
                  Add Recipe
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-base text-gray-500 hover:text-gray-900">
                  Search Recipes
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-base text-gray-500 hover:text-gray-900">
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/privacy" className="text-base text-gray-500 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/termsandconditions" className="text-base text-gray-500 hover:text-gray-900">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-base text-gray-400">&copy; {new Date().getFullYear()} JTDRecipe. All rights reserved.</p>
            <p className="text-base text-gray-400 mt-2 md:mt-0">Made with ❤️ by the JTDRecipe Team</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
