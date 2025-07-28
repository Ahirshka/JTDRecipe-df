import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("📋 [ADMIN-PENDING-RECIPES] Getting pending recipes")

  try {
    // Check authentication
    const sessionToken = request.cookies.get("session_token")?.value
    console.log("🔍 [ADMIN-PENDING-RECIPES] Session token present:", !!sessionToken)

    if (!sessionToken) {
      console.log("❌ [ADMIN-PENDING-RECIPES] No session token found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Verify session and get user
    const userResult = await sql`
      SELECT u.id, u.username, u.email, u.role, u.status
      FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
        AND u.status = 'active'
    `

    if (userResult.length === 0) {
      console.log("❌ [ADMIN-PENDING-RECIPES] Invalid or expired session")
      return NextResponse.json({ success: false, error: "Invalid or expired session" }, { status: 401 })
    }

    const user = userResult[0]
    console.log("✅ [ADMIN-PENDING-RECIPES] User found:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Check if user has admin privileges
    const adminRoles = ["admin", "owner", "moderator"]
    if (!adminRoles.includes(user.role)) {
      console.log("❌ [ADMIN-PENDING-RECIPES] User does not have admin privileges:", user.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ [ADMIN-PENDING-RECIPES] Admin access verified")

    // Ensure tables exist
    await sql`
      CREATE TABLE IF NOT EXISTS pending_recipes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ingredients JSONB,
        instructions JSONB,
        prep_time INTEGER,
        cook_time INTEGER,
        servings INTEGER,
        difficulty VARCHAR(50),
        tags JSONB,
        image_url VARCHAR(500),
        author_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Get pending recipes from both tables
    console.log("📋 [ADMIN-PENDING-RECIPES] Fetching pending recipes...")

    // Get from pending_recipes table
    const pendingRecipes = await sql`
      SELECT 
        pr.id,
        pr.title,
        pr.description,
        pr.ingredients,
        pr.instructions,
        pr.prep_time,
        pr.cook_time,
        pr.servings,
        pr.difficulty,
        pr.tags,
        pr.image_url,
        pr.status,
        pr.created_at,
        pr.updated_at,
        u.username as author_name,
        u.email as author_email
      FROM pending_recipes pr
      LEFT JOIN users u ON pr.author_id = u.id
      WHERE pr.status = 'pending'
      ORDER BY pr.created_at DESC
    `

    // Get from main recipes table
    const mainPendingRecipes = await sql`
      SELECT 
        r.id,
        r.title,
        r.description,
        r.ingredients,
        r.instructions,
        r.prep_time,
        r.cook_time,
        r.servings,
        r.difficulty,
        r.tags,
        r.image_url,
        r.status,
        r.created_at,
        r.updated_at,
        u.username as author_name,
        u.email as author_email
      FROM recipes r
      LEFT JOIN users u ON r.author_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `

    // Combine and format recipes
    const allPendingRecipes = [...pendingRecipes, ...mainPendingRecipes]

    const formattedRecipes = allPendingRecipes.map((recipe: any) => {
      // Parse JSON fields safely
      let ingredients = []
      let instructions = []
      let tags = []

      try {
        ingredients = typeof recipe.ingredients === "string" ? JSON.parse(recipe.ingredients) : recipe.ingredients || []
      } catch (e) {
        console.log("⚠️ [ADMIN-PENDING-RECIPES] Failed to parse ingredients for recipe:", recipe.id)
        ingredients = []
      }

      try {
        instructions =
          typeof recipe.instructions === "string" ? JSON.parse(recipe.instructions) : recipe.instructions || []
      } catch (e) {
        console.log("⚠️ [ADMIN-PENDING-RECIPES] Failed to parse instructions for recipe:", recipe.id)
        instructions = []
      }

      try {
        tags = typeof recipe.tags === "string" ? JSON.parse(recipe.tags) : recipe.tags || []
      } catch (e) {
        console.log("⚠️ [ADMIN-PENDING-RECIPES] Failed to parse tags for recipe:", recipe.id)
        tags = []
      }

      return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        ingredients,
        instructions,
        prepTime: recipe.prep_time,
        cookTime: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        tags,
        imageUrl: recipe.image_url,
        status: recipe.status,
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at,
        author: {
          name: recipe.author_name,
          email: recipe.author_email,
        },
      }
    })

    console.log("✅ [ADMIN-PENDING-RECIPES] Found pending recipes:", formattedRecipes.length)

    return NextResponse.json({
      success: true,
      recipes: formattedRecipes,
      count: formattedRecipes.length,
      message: "Pending recipes retrieved successfully",
    })
  } catch (error) {
    console.error("❌ [ADMIN-PENDING-RECIPES] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get pending recipes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
