import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { getAllRecipes, getPendingRecipes, createRecipe, getRecipeById } from "@/lib/neon"
import { addLog } from "../server-logs/route"

export async function GET(request: NextRequest) {
  try {
    addLog("info", "[RECIPE-DEBUG] Starting recipe system debug")

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      authentication: {
        user: null,
        authenticated: false,
      },
      recipes: {
        total: 0,
        pending: 0,
        approved: 0,
        sampleRecipes: [],
      },
      database: {
        connected: false,
        error: null,
      },
    }

    // Check authentication
    try {
      const currentUser = await getCurrentUserFromRequest(request)
      debugInfo.authentication.authenticated = !!currentUser
      debugInfo.authentication.user = currentUser
        ? {
            id: currentUser.id,
            username: currentUser.username,
            role: currentUser.role,
            status: currentUser.status,
          }
        : null

      addLog("info", "[RECIPE-DEBUG] Authentication check", {
        authenticated: !!currentUser,
        userId: currentUser?.id,
        role: currentUser?.role,
      })
    } catch (authError) {
      debugInfo.authentication.error = authError instanceof Error ? authError.message : "Unknown error"
      addLog("error", "[RECIPE-DEBUG] Authentication check failed", { error: authError })
    }

    // Test recipe database operations
    try {
      // Get all recipes
      const allRecipes = await getAllRecipes()
      debugInfo.recipes.total = allRecipes.length
      debugInfo.recipes.approved = allRecipes.filter((r) => r.moderation_status === "approved").length

      // Get pending recipes
      const pendingRecipes = await getPendingRecipes()
      debugInfo.recipes.pending = pendingRecipes.length

      // Sample recipes (first 3)
      debugInfo.recipes.sampleRecipes = allRecipes.slice(0, 3).map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        author_username: recipe.author_username,
        category: recipe.category,
        moderation_status: recipe.moderation_status,
        created_at: recipe.created_at,
      }))

      debugInfo.database.connected = true

      addLog("info", "[RECIPE-DEBUG] Recipe database operations", {
        totalRecipes: allRecipes.length,
        pendingRecipes: pendingRecipes.length,
        approvedRecipes: debugInfo.recipes.approved,
      })
    } catch (dbError) {
      debugInfo.database.connected = false
      debugInfo.database.error = dbError instanceof Error ? dbError.message : "Unknown error"
      addLog("error", "[RECIPE-DEBUG] Database operations failed", { error: dbError })
    }

    // Test recipe creation (if authenticated)
    if (debugInfo.authentication.authenticated && debugInfo.authentication.user) {
      try {
        const testRecipeData = {
          title: `Test Recipe ${Date.now()}`,
          description: "This is a test recipe created by the debug endpoint",
          author_id: debugInfo.authentication.user.id,
          author_username: debugInfo.authentication.user.username,
          category: "Test",
          difficulty: "Easy",
          prep_time_minutes: 10,
          cook_time_minutes: 20,
          servings: 4,
          ingredients: ["Test ingredient 1", "Test ingredient 2"],
          instructions: ["Test instruction 1", "Test instruction 2"],
          image_url: null,
        }

        const createdRecipe = await createRecipe(testRecipeData)
        debugInfo.recipes.testRecipeCreated = {
          id: createdRecipe.id,
          title: createdRecipe.title,
          moderation_status: createdRecipe.moderation_status,
        }

        addLog("info", "[RECIPE-DEBUG] Test recipe created", {
          recipeId: createdRecipe.id,
          title: createdRecipe.title,
        })
      } catch (createError) {
        debugInfo.recipes.testRecipeError = createError instanceof Error ? createError.message : "Unknown error"
        addLog("error", "[RECIPE-DEBUG] Test recipe creation failed", { error: createError })
      }
    }

    addLog("info", "[RECIPE-DEBUG] Debug completed", {
      authenticated: debugInfo.authentication.authenticated,
      databaseConnected: debugInfo.database.connected,
      totalRecipes: debugInfo.recipes.total,
    })

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      summary: {
        systemHealthy:
          debugInfo.database.connected &&
          !debugInfo.database.error &&
          (debugInfo.recipes.total >= 0 || debugInfo.recipes.pending >= 0),
        issues: [
          !debugInfo.database.connected && "Database connection failed",
          debugInfo.database.error && `Database error: ${debugInfo.database.error}`,
          !debugInfo.authentication.authenticated && "User not authenticated (optional for viewing recipes)",
        ].filter(Boolean),
      },
    })
  } catch (error) {
    addLog("error", "[RECIPE-DEBUG] Debug process failed", { error })
    console.error("❌ [RECIPE-DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Recipe debug process failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    addLog("info", "[RECIPE-DEBUG] Manual recipe test requested")

    const currentUser = await getCurrentUserFromRequest(request)
    if (!currentUser) {
      addLog("error", "[RECIPE-DEBUG] Authentication required for recipe creation test")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { action, recipeId } = body

    const testResult: any = {
      action,
      success: false,
      data: null,
      error: null,
    }

    try {
      switch (action) {
        case "create":
          const testRecipe = await createRecipe({
            title: `Manual Test Recipe ${Date.now()}`,
            description: "Created via manual recipe debug test",
            author_id: currentUser.id,
            author_username: currentUser.username,
            category: "Test",
            difficulty: "Easy",
            prep_time_minutes: 15,
            cook_time_minutes: 30,
            servings: 2,
            ingredients: ["Manual test ingredient"],
            instructions: ["Manual test instruction"],
          })
          testResult.success = true
          testResult.data = {
            id: testRecipe.id,
            title: testRecipe.title,
            moderation_status: testRecipe.moderation_status,
          }
          break

        case "get":
          if (!recipeId) {
            throw new Error("Recipe ID required for get action")
          }
          const recipe = await getRecipeById(recipeId)
          testResult.success = !!recipe
          testResult.data = recipe
            ? {
                id: recipe.id,
                title: recipe.title,
                author_username: recipe.author_username,
                moderation_status: recipe.moderation_status,
              }
            : null
          break

        case "list":
          const recipes = await getAllRecipes()
          testResult.success = true
          testResult.data = {
            count: recipes.length,
            recipes: recipes.slice(0, 5).map((r) => ({
              id: r.id,
              title: r.title,
              author_username: r.author_username,
            })),
          }
          break

        default:
          throw new Error(`Unknown action: ${action}`)
      }

      addLog("info", "[RECIPE-DEBUG] Manual test completed", {
        action,
        success: testResult.success,
        userId: currentUser.id,
      })
    } catch (error) {
      testResult.error = error instanceof Error ? error.message : "Unknown error"
      addLog("error", "[RECIPE-DEBUG] Manual test failed", { action, error })
    }

    return NextResponse.json({
      success: true,
      test: testResult,
    })
  } catch (error) {
    addLog("error", "[RECIPE-DEBUG] Manual test process failed", { error })
    console.error("❌ [RECIPE-DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Manual recipe test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
