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

    // Try to insert the recipe using integer ID (auto-generated by database)
    try {
      addLog("info", "[RECIPE-DEBUG] Attempting to insert recipe")

      // Process ingredients and instructions
      const processedIngredients = Array.isArray(ingredients)
        ? ingredients.filter((i) => i.trim())
        : ingredients.split("\n").filter((i) => i.trim())

      const processedInstructions = Array.isArray(instructions)
        ? instructions.filter((i) => i.trim())
        : instructions.split("\n").filter((i) => i.trim())

      addLog("info", "[RECIPE-DEBUG] Processed data", {
        ingredientsCount: processedIngredients.length,
        instructionsCount: processedInstructions.length,
        ingredients: processedIngredients,
        instructions: processedInstructions,
      })

      // Insert recipe with auto-generated integer ID
      const result = await sql`
        INSERT INTO recipes (
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

      const recipeId = result[0].id

      // Store ingredients and instructions as JSON in the recipe record or separate tables
      try {
        // Try to update the recipe with ingredients and instructions if columns exist
        await sql`
          UPDATE recipes 
          SET 
            ingredients = ${JSON.stringify(processedIngredients)},
            instructions = ${JSON.stringify(processedInstructions)}
          WHERE id = ${recipeId}
        `
        addLog("info", "[RECIPE-DEBUG] Updated recipe with ingredients and instructions")
      } catch (updateError) {
        addLog("warn", "[RECIPE-DEBUG] Could not update recipe with ingredients/instructions", { error: updateError })

        // If that fails, the columns might not exist, so the recipe is still valid without them
        addLog("info", "[RECIPE-DEBUG] Recipe created successfully without ingredients/instructions columns")
      }

      return NextResponse.json({
        success: true,
        message: "Recipe submitted successfully",
        recipe: {
          id: recipeId,
          title: result[0].title,
          status: result[0].moderation_status,
          ingredients: processedIngredients,
          instructions: processedInstructions,
        },
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
