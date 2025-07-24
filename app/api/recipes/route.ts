import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"
import { getCurrentUser } from "@/lib/server-auth"

export async function GET() {
  try {
    console.log("🔍 Fetching all approved recipes...")
    await initializeDatabase()

    const recipes = await sql`
      SELECT 
        r.*,
        u.username as author_username,
        COALESCE(r.rating, 0) as rating,
        COALESCE(r.review_count, 0) as review_count,
        COALESCE(r.view_count, 0) as view_count,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'ingredient', ri.ingredient,
              'amount', ri.amount,
              'unit', ri.unit
            )
          ) FILTER (WHERE ri.ingredient IS NOT NULL), 
          '[]'::json
        ) as ingredients,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'instruction', inst.instruction,
              'step_number', inst.step_number
            )
            ORDER BY inst.step_number
          ) FILTER (WHERE inst.instruction IS NOT NULL), 
          '[]'::json
        ) as instructions,
        COALESCE(
          array_agg(DISTINCT rt.tag) FILTER (WHERE rt.tag IS NOT NULL), 
          ARRAY[]::text[]
        ) as tags
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN recipe_instructions inst ON r.id = inst.recipe_id
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      WHERE r.moderation_status = 'approved' 
        AND r.is_published = true
      GROUP BY r.id, u.username
      ORDER BY r.created_at DESC
    `

    console.log(`✅ Found ${recipes.length} approved recipes`)

    return NextResponse.json({
      success: true,
      recipes: recipes || [],
    })
  } catch (error) {
    console.error("❌ Error fetching recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recipes",
        recipes: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Creating new recipe...")
    await initializeDatabase()

    // Debug: Log all cookies
    const cookieStore = await request.cookies
    console.log(
      "🍪 Available cookies:",
      Array.from(cookieStore.entries()).map(([name, cookie]) => ({
        name,
        value: cookie.value?.substring(0, 20) + "...",
      })),
    )

    // Get authenticated user using server-side auth
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ No authenticated user found")

      // Additional debugging - check if user is in auth context
      const authHeader = request.headers.get("authorization")
      console.log("🔍 Auth header:", authHeader ? "Present" : "Missing")

      return NextResponse.json(
        {
          success: false,
          error: "Authentication required. Please log in to submit recipes.",
          debug: {
            cookiesFound: Array.from(cookieStore.entries()).length,
            authHeader: !!authHeader,
          },
        },
        { status: 401 },
      )
    }

    console.log(`✅ Authenticated user: ${user.username} (ID: ${user.id}) - Role: ${user.role}`)

    // All authenticated users can submit recipes - no role restriction needed
    if (user.status !== "active") {
      console.log(`❌ User account not active: ${user.status}`)
      return NextResponse.json(
        {
          success: false,
          error: "Your account is not active. Please contact support.",
        },
        { status: 403 },
      )
    }

    // Parse request body
    const body = await request.json()
    console.log("📝 Recipe data received:", {
      title: body.title,
      category: body.category,
      difficulty: body.difficulty,
      ingredientCount: Array.isArray(body.ingredients) ? body.ingredients.length : 0,
      instructionCount: Array.isArray(body.instructions) ? body.instructions.length : 0,
    })

    // Validate required fields
    const requiredFields = ["title", "category", "difficulty", "ingredients", "instructions"]
    for (const field of requiredFields) {
      if (!body[field]) {
        console.log(`❌ Missing required field: ${field}`)
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 },
        )
      }
    }

    // Parse ingredients and instructions if they're strings
    let ingredients = body.ingredients
    let instructions = body.instructions

    if (typeof ingredients === "string") {
      ingredients = ingredients
        .split("\n")
        .filter((line) => line.trim())
        .map((line, index) => ({
          ingredient: line.trim(),
          amount: "",
          unit: "",
        }))
    }

    if (typeof instructions === "string") {
      instructions = instructions
        .split("\n")
        .filter((line) => line.trim())
        .map((line, index) => ({
          instruction: line.trim(),
          step_number: index + 1,
        }))
    }

    // Validate ingredients and instructions arrays
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one ingredient is required",
        },
        { status: 400 },
      )
    }

    if (!Array.isArray(instructions) || instructions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one instruction is required",
        },
        { status: 400 },
      )
    }

    // Generate unique recipe ID
    const recipeId = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log("🔄 Creating recipe with ID:", recipeId)

    // Use database transaction to ensure data consistency
    await sql.begin(async (sql) => {
      // Insert main recipe record
      console.log("📝 Inserting main recipe...")
      await sql`
        INSERT INTO recipes (
          id, title, description, author_id, category, difficulty,
          prep_time_minutes, cook_time_minutes, servings, image_url,
          moderation_status, is_published, created_at, updated_at
        ) VALUES (
          ${recipeId}, 
          ${body.title}, 
          ${body.description || ""}, 
          ${user.id},
          ${body.category}, 
          ${body.difficulty}, 
          ${Number(body.prep_time_minutes) || 0}, 
          ${Number(body.cook_time_minutes) || 0}, 
          ${Number(body.servings) || 1}, 
          ${body.image_url || null}, 
          'pending', 
          false, 
          NOW(), 
          NOW()
        )
      `

      // Insert ingredients
      console.log("🥕 Inserting ingredients...")
      for (const ingredient of ingredients) {
        const ingredientText = typeof ingredient === "string" ? ingredient : ingredient.ingredient
        if (ingredientText && ingredientText.trim()) {
          await sql`
            INSERT INTO recipe_ingredients (recipe_id, ingredient, amount, unit)
            VALUES (
              ${recipeId}, 
              ${ingredientText.trim()}, 
              ${typeof ingredient === "object" ? ingredient.amount || "" : ""}, 
              ${typeof ingredient === "object" ? ingredient.unit || "" : ""}
            )
          `
        }
      }

      // Insert instructions
      console.log("📋 Inserting instructions...")
      for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i]
        const instructionText = typeof instruction === "string" ? instruction : instruction.instruction
        if (instructionText && instructionText.trim()) {
          await sql`
            INSERT INTO recipe_instructions (recipe_id, instruction, step_number)
            VALUES (
              ${recipeId}, 
              ${instructionText.trim()}, 
              ${i + 1}
            )
          `
        }
      }

      // Insert tags
      if (body.tags && Array.isArray(body.tags)) {
        console.log("🏷️ Inserting tags...")
        for (const tag of body.tags) {
          if (tag && tag.trim()) {
            await sql`
              INSERT INTO recipe_tags (recipe_id, tag)
              VALUES (${recipeId}, ${tag.trim()})
            `
          }
        }
      }
    })

    console.log("✅ Recipe created successfully and sent for moderation")

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully and is pending moderation",
      recipe: {
        id: recipeId,
        title: body.title,
        moderation_status: "pending",
        author_username: user.username,
        author_id: user.id,
      },
    })
  } catch (error) {
    console.error("❌ Error creating recipe:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
