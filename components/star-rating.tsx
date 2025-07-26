"use client"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface StarRatingProps {
  recipeId: string
  currentRating: number
  reviewCount: number
  onRatingUpdate?: (newRating: number, newReviewCount: number) => void
}

export function StarRating({ recipeId, currentRating, reviewCount, onRatingUpdate }: StarRatingProps) {
  const { user, isAuthenticated } = useAuth()
  const [userRating, setUserRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [displayRating, setDisplayRating] = useState(currentRating || 0)
  const [displayReviewCount, setDisplayReviewCount] = useState(reviewCount || 0)

  // Fetch user's existing rating
  useEffect(() => {
    if (isAuthenticated && user && recipeId) {
      fetchUserRating()
    }
  }, [isAuthenticated, user, recipeId])

  const fetchUserRating = async () => {
    try {
      const response = await fetch(`/api/ratings/${recipeId}/user`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.rating) {
          setUserRating(data.rating.rating)
        }
      }
    } catch (error) {
      console.error("Error fetching user rating:", error)
    }
  }

  const submitRating = async (rating: number) => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to rate recipes")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          recipe_id: recipeId,
          rating: rating,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setUserRating(rating)
        setDisplayRating(data.newAverageRating)
        setDisplayReviewCount(data.newReviewCount)

        // Call the callback to update parent component
        if (onRatingUpdate) {
          onRatingUpdate(data.newAverageRating, data.newReviewCount)
        }

        toast.success("Rating submitted successfully!")
      } else {
        toast.error(data.message || "Failed to submit rating")
      }
    } catch (error) {
      console.error("Error submitting rating:", error)
      toast.error("Failed to submit rating")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStarClick = (rating: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to rate recipes")
      return
    }
    submitRating(rating)
  }

  const handleStarHover = (rating: number) => {
    if (isAuthenticated) {
      setHoveredRating(rating)
    }
  }

  const handleMouseLeave = () => {
    setHoveredRating(0)
  }

  const getStarColor = (starIndex: number) => {
    const effectiveRating = hoveredRating || userRating

    if (isAuthenticated && effectiveRating >= starIndex) {
      return "text-yellow-400 fill-yellow-400"
    } else if (!isAuthenticated && displayRating >= starIndex) {
      return "text-yellow-400 fill-yellow-400"
    } else {
      return "text-gray-300"
    }
  }

  if (!recipeId) {
    return null
  }

  if (!isAuthenticated) {
    // Display-only version for non-authenticated users
    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-6 h-6 ${displayRating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
            />
          ))}
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {displayRating > 0 ? (
              <>
                {displayRating.toFixed(1)} out of 5 stars
                {displayReviewCount > 0 && (
                  <span className="text-gray-500">
                    {" "}
                    ({displayReviewCount} review{displayReviewCount !== 1 ? "s" : ""})
                  </span>
                )}
              </>
            ) : (
              "No ratings yet"
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            <Button variant="link" className="p-0 h-auto text-xs">
              Sign in to rate this recipe
            </Button>
          </p>
        </div>
      </div>
    )
  }

  // Interactive version for authenticated users
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex items-center space-x-1" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            disabled={isSubmitting}
            className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
          >
            <Star className={`w-6 h-6 transition-colors ${getStarColor(star)}`} />
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          {displayRating > 0 ? (
            <>
              {displayRating.toFixed(1)} out of 5 stars
              {displayReviewCount > 0 && (
                <span className="text-gray-500">
                  {" "}
                  ({displayReviewCount} review{displayReviewCount !== 1 ? "s" : ""})
                </span>
              )}
            </>
          ) : (
            "No ratings yet"
          )}
        </p>

        {userRating > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            You rated this {userRating} star{userRating !== 1 ? "s" : ""}
          </p>
        )}

        {hoveredRating > 0 && (
          <p className="text-xs text-orange-600 mt-1">
            Click to rate {hoveredRating} star{hoveredRating !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  )
}

export default StarRating
