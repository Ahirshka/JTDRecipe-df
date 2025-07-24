import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">JTDRecipe</h3>
            <p className="text-sm text-muted-foreground">No life-stories, no fluff, just recipes that work.</p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <Link href="/" className="block text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/search" className="block text-muted-foreground hover:text-foreground transition-colors">
                Search Recipes
              </Link>
              <Link href="/add-recipe" className="block text-muted-foreground hover:text-foreground transition-colors">
                Add Recipe
              </Link>
              <Link href="/profile" className="block text-muted-foreground hover:text-foreground transition-colors">
                Profile
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <div className="space-y-2 text-sm">
              <Link href="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link
                href="/termsandconditions"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms & Conditions
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="mailto:contact@justthedamnrecipe.net" className="block hover:text-foreground transition-colors">
                contact@justthedamnrecipe.net
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">© 2025 JTDRecipe. All rights reserved.</p>
          <div className="flex space-x-4 text-sm">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/termsandconditions" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
