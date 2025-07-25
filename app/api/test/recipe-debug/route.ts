import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { findUserById, sql } from "@/lib/neon"
import { addLog } from "../server-logs/route"

export async function POST(request: NextRequest) {
  try {
    addLog("info", "[RECIPE-DEBUG] Starting recipe submission test")

    // Get auth token from request cookies
    const authToken = request.cookies.get("auth-token")?.value || request.cookies.get("auth_token")?.value

    if (!authToken) {
      addLog("error", "[RECIPE-DEBUG] No authentication token found")
      return NextResponse.json(
        {
          success: false,
          error: "No authentication token found",
          step: "authentication",
        },
        { status: 401 },
      )
    }

    addLog("info", "[RECIPE-DEBUG] Found auth token", { tokenPreview: authToken.substring(0, 20) + "..." })

    // Verify the token
    const decoded = verifyToken(authToken)
    if (!decoded) {
      addLog("error", "[RECIPE-DEBUG] Token verification failed")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token",
          step: "token_verification",
        },
        { status: 401 },
      )
    }

    addLog("info", "[RECIPE-DEBUG] Token verified", { userId: decoded.id, role: decoded.role })

    // Get user from database
    const dbUser = await findUserById(decoded.id)
    if (!dbUser) {
      addLog("error", "[RECIPE-DEBUG] User not found in database", { userId: decoded.id })
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          step: "user_lookup",
        },
        { status: 404 },
      )
    }

    addLog("info", "[RECIPE-DEBUG] User found", {
      id: dbUser.id,
      username: dbUser.username,
      role: dbUser.role,
      status: dbUser.status,
    })

    // Check user status
    if (dbUser.status !== "active") {
      addLog("error", "[RECIPE-DEBUG] User account not active", { status: dbUser.status })
      return NextResponse.json(
        {
          success: false,
          error: "Account not active",
          step: "user_status_check",
        },
        { status: 403 },
      )
    }

    // Get request body
    const body = await request.json()
    const { title, category, difficulty, ingredients, instructions, description, prepTime, cookTime, servings } = body

    addLog("info", "[RECIPE-DEBUG] Recipe data received", {
      title,
      category,
      difficulty,
      ingredientsCount: ingredients?.length || 0,
      instructionsCount: instructions?.length || 0,
    })

    // Validate required fields
    if (!title || !category || !difficulty || !ingredients || !instructions) {
      addLog("error", "[RECIPE-DEBUG] Missing required fields", {
        hasTitle: !!title,
        hasCategory: !!category,
        hasDifficulty: !!difficulty,
        hasIngredients: !!ingredients,
        hasInstructions: !!instructions,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          step: "validation",
        },
        { status: 400 },
      )
    }

    // Test database connection
    try {
      addLog("info", "[RECIPE-DEBUG] Testing database connection")
      const testQuery = await sql`SELECT 1 as test`
      addLog("info", "[RECIPE-DEBUG] Database connection successful", { result: testQuery })
    } catch (dbError) {
      addLog("error", "[RECIPE-DEBUG] Database connection failed", { error: dbError })
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          step: "database_connection",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }

    // Check recipes table structure
    try {
      addLog("info", "[RECIPE-DEBUG] Checking recipes table structure")
      const tableStructure = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes'
        ORDER BY ordinal_position
      `

      addLog("info", "[RECIPE-DEBUG] Recipes table structure", { columns: tableStructure })

      if (tableStructure.length === 0) {
        addLog("error", "[RECIPE-DEBUG] Recipes table does not exist")
        return NextResponse.json(
          {
            success: false,
            error: "Recipes table does not exist",
            step: "table_check",
          },
          { status: 500 },
        )
      }
    } catch (tableError) {
      addLog("error", "[RECIPE-DEBUG] Error checking recipes table", { error: tableError })
      return NextResponse.json(
        {
          success: false,
          error: "Error checking recipes table",
          step: "table_check",
          details: tableError instanceof Error ? tableError.message : "Unknown table error",
        },
        { status: 500 },
      )
    }

    // Try to insert the recipe using the correct column names
    try {
      addLog("info", "[RECIPE-DEBUG] Attempting to insert recipe")

      // Generate a unique recipe ID
      const recipeId = `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      // Process ingredients and instructions
      const processedIngredients = Array.isArray(ingredients) ? ingredients : [ingredients]
      const processedInstructions = Array.isArray(instructions) ? instructions : [instructions]

      const result = await sql`
        INSERT INTO recipes (
          id,
          title,
          description,
          author_id,
          category,
          difficulty,
          prep_time_minutes,
          cook_time_minutes,
          servings,
          moderation_status,
          is_published,
          created_at,
          updated_at
        ) VALUES (
          ${recipeId},
          ${title},
          ${description || ""},
          ${dbUser.id},
          ${category},
          ${difficulty},
          ${Number.parseInt(prepTime) || 0},
          ${Number.parseInt(cookTime) || 0},
          ${Number.parseInt(servings) || 1},
          ${"pending"},
          ${false},
          NOW(),
          NOW()
        ) RETURNING id, title, moderation_status
      `

      addLog("info", "[RECIPE-DEBUG] Recipe inserted successfully", { result })

      // Insert ingredients if we have a separate ingredients table
      try {
        for (let i = 0; i < processedIngredients.length; i++) {
          await sql`
            INSERT INTO recipe_ingredients (recipe_id, ingredient, step_number)
            VALUES (${recipeId}, ${processedIngredients[i]}, ${i + 1})
          `
        }
        addLog("info", "[RECIPE-DEBUG] Ingredients inserted", { count: processedIngredients.length })
      } catch (ingredientError) {
        addLog("warn", "[RECIPE-DEBUG] Could not insert ingredients (table may not exist)", { error: ingredientError })
      }

      // Insert instructions if we have a separate instructions table
      try {
        for (let i = 0; i < processedInstructions.length; i++) {
          await sql`
            INSERT INTO recipe_instructions (recipe_id, instruction, step_number)
            VALUES (${recipeId}, ${processedInstructions[i]}, ${i + 1})
          `
        }
        addLog("info", "[RECIPE-DEBUG] Instructions inserted", { count: processedInstructions.length })
      } catch (instructionError) {
        addLog("warn", "[RECIPE-DEBUG] Could not insert instructions (table may not exist)", {
          error: instructionError,
        })
      }

      return NextResponse.json({
        success: true,
        message: "Recipe submitted successfully",
        recipe: result[0],
        step: "complete",
      })
    } catch (insertError) {
      addLog("error", "[RECIPE-DEBUG] Error inserting recipe", { error: insertError })
      return NextResponse.json(
        {
          success: false,
          error: "Error inserting recipe",
          step: "recipe_insertion",
          details: insertError instanceof Error ? insertError.message : "Unknown insertion error",
          sqlError: insertError,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    addLog("error", "[RECIPE-DEBUG] Unexpected error", { error })
    console.error("❌ [RECIPE-DEBUG] Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error occurred",
        step: "unexpected_error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
