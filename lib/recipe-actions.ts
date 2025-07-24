"use server"

import { revalidatePath } from "next/cache"
import { sql, initializeDatabase } from "@/lib/neon"

export interface Recipe {
  id: string
  title: string
  description?: string
  author_id: string
  author_username: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url?: string
  rating: number
  review_count: number
  view_count: number
  moderation_status: string
  moderation_notes?: string
  is_published: boolean
  created_at: string
  updated_at: string
  ingredients?: Array<{ ingredient: string; amount: string; unit: string }>
  instructions?: Array<{ instruction: string; step_number: number }>
  tags?: string[]
}

export interface CreateRecipeData {
  title: string
  description?: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url?: string
  ingredients: Array<{ ingredient: string; amount: string; unit: string }>
  instructions: Array<{ instruction: string; step_number: number }>
  tags: string[]
}

// Get all approved and published recipes for the website
export async function getApprovedRecipes(): Promise<Recipe[]> {
  try {
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

    return recipes.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      author_id: row.author_id,
      author_username: row.author_username,
      category: row.category,
      difficulty: row.difficulty,
      prep_time_minutes: row.prep_time_minutes || 0,
      cook_time_minutes: row.cook_time_minutes || 0,
      servings: row.servings || 1,
      image_url: row.image_url,
      rating: Number.parseFloat(row.rating) || 0,
      review_count: Number.parseInt(row.review_count) || 0,
      view_count: Number.parseInt(row.view_count) || 0,
      moderation_status: row.moderation_status,
      moderation_notes: row.moderation_notes,
      is_published: row.is_published,
      created_at: row.created_at,
      updated_at: row.updated_at,
      ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
      instructions: Array.isArray(row.instructions) ? row.instructions : [],
      tags: Array.isArray(row.tags) ? row.tags : [],
    }))
  } catch (error) {
    console.error("Get approved recipes error:", error)
    return []
  }
}

// Get pending recipes for moderation
export async function getPendingRecipes(): Promise<Recipe[]> {
  try {
    await initializeDatabase()

    const recipes = await sql`
      SELECT 
        r.*,
        u.username as author_username,
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
      WHERE r.moderation_status = 'pending'
      GROUP BY r.id, u.username
      ORDER BY r.created_at ASC
    `

    return recipes.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      author_id: row.author_id,
      author_username: row.author_username,
      category: row.category,
      difficulty: row.difficulty,
      prep_time_minutes: row.prep_time_minutes || 0,
      cook_time_minutes: row.cook_time_minutes || 0,
      servings: row.servings || 1,
      image_url: row.image_url,
      rating: 0,
      review_count: 0,
      view_count: 0,
      moderation_status: row.moderation_status,
      moderation_notes: row.moderation_notes,
      is_published: false,
      created_at: row.created_at,
      updated_at: row.updated_at,
      ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
      instructions: Array.isArray(row.instructions) ? row.instructions : [],
      tags: Array.isArray(row.tags) ? row.tags : [],
    }))
  } catch (error) {
    console.error("Get pending recipes error:", error)
    return []
  }
}

// Get recipe by ID with full details
export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
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
      WHERE r.id = ${id} 
        AND r.moderation_status = 'approved' 
        AND r.is_published = true
      GROUP BY r.id, u.username
    `

    if (recipes.length === 0) {
      return null
    }

    const row = recipes[0]

    // Increment view count
    await sql`
      UPDATE recipes 
      SET view_count = COALESCE(view_count, 0) + 1 
      WHERE id = ${id}
    `

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      author_id: row.author_id,
      author_username: row.author_username,
      category: row.category,
      difficulty: row.difficulty,
      prep_time_minutes: row.prep_time_minutes || 0,
      cook_time_minutes: row.cook_time_minutes || 0,
      servings: row.servings || 1,
      image_url: row.image_url,
      rating: Number.parseFloat(row.rating) || 0,
      review_count: Number.parseInt(row.review_count) || 0,
      view_count: Number.parseInt(row.view_count) || 0,
      moderation_status: row.moderation_status,
      moderation_notes: row.moderation_notes,
      is_published: row.is_published,
      created_at: row.created_at,
      updated_at: row.updated_at,
      ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
      instructions: Array.isArray(row.instructions) ? row.instructions : [],
      tags: Array.isArray(row.tags) ? row.tags : [],
    }
  } catch (error) {
    console.error("Get recipe by ID error:", error)
    return null
  }
}

// Moderate recipe (approve/reject)
export async function moderateRecipe(
  recipeId: string,
  status: "approved" | "rejected",
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await initializeDatabase()

    await sql`
      UPDATE recipes 
      SET 
        moderation_status = ${status}, 
        is_published = ${status === "approved"},
        moderation_notes = ${notes || null},
        updated_at = NOW()
      WHERE id = ${recipeId}
    `

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath("/search")

    return { success: true }
  } catch (error) {
    console.error("Moderate recipe error:", error)
    return { success: false, error: "Failed to moderate recipe" }
  }
}

// Create a new recipe (for user submission)
export async function createRecipe(
  recipeData: CreateRecipeData,
  authorId: string,
): Promise<{ success: boolean; error?: string; recipeId?: string }> {
  try {
    await initializeDatabase()

    const recipeId = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await sql.begin(async (sql) => {
      // Insert main recipe
      await sql`
        INSERT INTO recipes (
          id, title, description, author_id, category, difficulty,
          prep_time_minutes, cook_time_minutes, servings, image_url,
          moderation_status, is_published, created_at, updated_at
        ) VALUES (
          ${recipeId}, ${recipeData.title}, ${recipeData.description}, ${authorId},
          ${recipeData.category}, ${recipeData.difficulty}, ${recipeData.prep_time_minutes},
          ${recipeData.cook_time_minutes}, ${recipeData.servings}, ${recipeData.image_url},
          'pending', false, NOW(), NOW()
        )
      `

      // Insert ingredients
      for (const ingredient of recipeData.ingredients) {
        await sql`
          INSERT INTO recipe_ingredients (recipe_id, ingredient, amount, unit)
          VALUES (${recipeId}, ${ingredient.ingredient}, ${ingredient.amount}, ${ingredient.unit})
        `
      }

      // Insert instructions
      for (const instruction of recipeData.instructions) {
        await sql`
          INSERT INTO recipe_instructions (recipe_id, instruction, step_number)
          VALUES (${recipeId}, ${instruction.instruction}, ${instruction.step_number})
        `
      }

      // Insert tags
      for (const tag of recipeData.tags) {
        await sql`
          INSERT INTO recipe_tags (recipe_id, tag)
          VALUES (${recipeId}, ${tag})
        `
      }
    })

    revalidatePath("/admin")

    return { success: true, recipeId }
  } catch (error) {
    console.error("Create recipe error:", error)
    return { success: false, error: "Failed to create recipe" }
  }
}

// Update recipe
export async function updateRecipe(
  id: string,
  recipeData: Partial<CreateRecipeData>,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Updating recipe:", id)

    revalidatePath("/")
    revalidatePath(`/recipe/${id}`)

    return { success: true }
  } catch (error) {
    console.error("Update recipe error:", error)
    return { success: false, error: "Failed to update recipe" }
  }
}

// Delete recipe
export async function deleteRecipe(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Deleting recipe:", id)

    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Delete recipe error:", error)
    return { success: false, error: "Failed to delete recipe" }
  }
}

// Get recipes by category
export async function getRecipesByCategory(category: string): Promise<Recipe[]> {
  try {
    const allRecipes = await getApprovedRecipes()
    return allRecipes.filter((recipe) => recipe.category.toLowerCase() === category.toLowerCase())
  } catch (error) {
    console.error("Get recipes by category error:", error)
    return []
  }
}

// Search recipes
export async function searchRecipes(query: string): Promise<Recipe[]> {
  try {
    await initializeDatabase()

    const recipes = await sql`
      SELECT 
        r.*,
        u.username as author_username,
        COALESCE(r.rating, 0) as rating,
        COALESCE(r.review_count, 0) as review_count,
        COALESCE(r.view_count, 0) as view_count,
        ts_rank(search_vector, plainto_tsquery('english', ${query})) as rank
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.moderation_status = 'approved' 
        AND r.is_published = true
        AND (
          search_vector @@ plainto_tsquery('english', ${query})
          OR title ILIKE ${"%" + query + "%"}
          OR description ILIKE ${"%" + query + "%"}
          OR category ILIKE ${"%" + query + "%"}
        )
      ORDER BY rank DESC, r.created_at DESC
      LIMIT 50
    `

    return recipes.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      author_id: row.author_id,
      author_username: row.author_username,
      category: row.category,
      difficulty: row.difficulty,
      prep_time_minutes: row.prep_time_minutes || 0,
      cook_time_minutes: row.cook_time_minutes || 0,
      servings: row.servings || 1,
      image_url: row.image_url,
      rating: Number.parseFloat(row.rating) || 0,
      review_count: Number.parseInt(row.review_count) || 0,
      view_count: Number.parseInt(row.view_count) || 0,
      moderation_status: row.moderation_status,
      moderation_notes: row.moderation_notes,
      is_published: row.is_published,
      created_at: row.created_at,
      updated_at: row.updated_at,
      ingredients: [],
      instructions: [],
      tags: [],
    }))
  } catch (error) {
    console.error("Search recipes error:", error)
    return []
  }
}
