"use client"

import { Star, Heart, Settings, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { getRecipesByIds, getAllRecipes, getRecipesByAuthorId } from "@/lib/recipes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [favoriteRecipes, setFavoriteRecipes] = useState<any[]>([])
  const [ratedRecipes, setRatedRecipes] = useState<any[]>([])
  const [myRecipes, setMyRecipes] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
      return
    }

    if (user) {
      // Get favorite recipes
      const favorites = getRecipesByIds(user.favorites || [])
      setFavoriteRecipes(favorites)

      // Get rated recipes
      const allRecipes = getAllRecipes()
      const rated = allRecipes
        .filter((recipe) => user.ratings?.some((rating) => rating.recipeId === recipe.id))
        .map((recipe) => ({
          ...recipe,
          userRating: user.ratings?.find((rating) => rating.recipeId === recipe.id)?.rating || 0,
        }))
      setRatedRecipes(rated)

      // Get user's created recipes
      const userCreatedRecipes = getRecipesByAuthorId(user.id)
      setMyRecipes(userCreatedRecipes)
    }
  }, [user, isAuthenticated, loading, router])

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-orange-600">
              JTDRecipe
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/add-recipe">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Recipe
                </Button>
              </Link>
              <Link href="/profile/settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src="/placeholder.svg?height=96&width=96" alt={user.username} />
              <AvatarFallback className="text-2xl">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.username}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <p className="text-gray-600">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                {user.provider && user.provider !== "email" && (
                  <Badge variant="outline" className="text-xs">
                    {user.provider === "google" && "🔍 Google"}
                    {user.provider === "facebook" && "📘 Facebook"}
                    {user.provider === "instagram" && "📷 Instagram"}
                    {user.provider === "tiktok" && "🎵 TikTok"}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
                <div className="text-center">
                  <div className="font-bold text-xl text-orange-600">{myRecipes.length}</div>
                  <div className="text-gray-500">Recipes</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl text-orange-600">{user.favorites?.length || 0}</div>
                  <div className="text-gray-500">Favorites</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl text-orange-600">{user.ratings?.length || 0}</div>
                  <div className="text-gray-500">Rated</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl text-orange-600">
                    {user.ratings?.length
                      ? (user.ratings.reduce((sum, r) => sum + r.rating, 0) / user.ratings.length).toFixed(1)
                      : "0"}
                  </div>
                  <div className="text-gray-500">Avg Rating Given</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">Edit Profile</Button>
              <Button variant="outline">Share</Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="rated">Rated Recipes</TabsTrigger>
            <TabsTrigger value="my-recipes">My Recipes</TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Favorite Recipes</h2>
              <p className="text-gray-600">Recipes you've saved for later</p>
            </div>

            {favoriteRecipes.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                <p className="text-gray-600 mb-4">Start exploring recipes and save your favorites!</p>
                <Link href="/">
                  <Button>Browse Recipes</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteRecipes.map((recipe) => (
                  <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="relative">
                        <Image
                          src={recipe.image || "/placeholder.svg"}
                          alt={recipe.title}
                          width={200}
                          height={150}
                          className="w-full h-40 object-cover rounded-t-lg"
                        />
                        <Badge className="absolute top-2 right-2 bg-white text-gray-900">{recipe.category}</Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{recipe.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {recipe.author}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-sm">{recipe.rating}</span>
                          <span className="text-sm text-gray-500">({recipe.reviews})</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rated" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Rated Recipes</h2>
              <p className="text-gray-600">Recipes you've rated and reviewed</p>
            </div>

            {ratedRecipes.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No ratings yet</h3>
                <p className="text-gray-600 mb-4">Try some recipes and share your thoughts!</p>
                <Link href="/">
                  <Button>Browse Recipes</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ratedRecipes.map((recipe) => (
                  <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="relative">
                        <Image
                          src={recipe.image || "/placeholder.svg"}
                          alt={recipe.title}
                          width={200}
                          height={150}
                          className="w-full h-40 object-cover rounded-t-lg"
                        />
                        <Badge className="absolute top-2 right-2 bg-white text-gray-900">{recipe.category}</Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{recipe.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {recipe.author}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium text-sm">{recipe.rating}</span>
                            <span className="text-sm text-gray-500">({recipe.reviews})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-600">Your rating:</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= recipe.userRating ? "fill-orange-400 text-orange-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-recipes" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Recipes</h2>
                <p className="text-gray-600">Recipes you've shared with the community</p>
              </div>
              <Link href="/add-recipe">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Recipe
                </Button>
              </Link>
            </div>

            {myRecipes.length === 0 ? (
              <div className="text-center py-12">
                <Plus className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes yet</h3>
                <p className="text-gray-600 mb-4">Share your favorite recipes with the community!</p>
                <Link href="/add-recipe">
                  <Button>Create Your First Recipe</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myRecipes.map((recipe) => (
                  <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="relative">
                        <Image
                          src={recipe.image || "/placeholder.svg"}
                          alt={recipe.title}
                          width={200}
                          height={150}
                          className="w-full h-40 object-cover rounded-t-lg"
                        />
                        <Badge className="absolute top-2 right-2 bg-white text-gray-900">{recipe.category}</Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{recipe.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {recipe.author}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium text-sm">{recipe.rating}</span>
                            <span className="text-sm text-gray-500">({recipe.reviews})</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <span>{recipe.views} views</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
