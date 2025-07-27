import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"

export default function ManageRecipesLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="w-32" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-full md:w-48 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-full md:w-48 h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Loading Indicator */}
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading recipes...</p>
        </div>
      </div>
    </div>
  )
}
