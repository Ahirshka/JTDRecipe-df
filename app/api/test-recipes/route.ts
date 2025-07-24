import { NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"

export async function POST() {
  try {
    await initializeDatabase()

    // Get or create a test user
    let testUser = await sql`SELECT id FROM users WHERE email = 'testuser@jtdrecipe.com' LIMIT 1`

    if (testUser.length === 0) {
      testUser = await sql`
        INSERT INTO users (username, email, role, is_verified)
        VALUES ('testuser', 'testuser@jtdrecipe.com', 'user', true)
        RETURNING id
      `
    }

    const userId = testUser[0].id

    // Add an approved test recipe
    const approvedRecipe = await sql`
      INSERT INTO recipes (
        title, description, author_id, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, image_url,
        moderation_status, is_published, rating, review_count, view_count
      ) VALUES (
        'Test Approved Recipe - Spaghetti Carbonara',
        'A classic Italian pasta dish with eggs, cheese, and pancetta. This is a test recipe to verify the database is working correctly.',
        ${userId}, 'Main Dishes', 'Medium',
        10, 15, 4, '/placeholder.svg?height=300&width=400&text=Spaghetti+Carbonara',
        'approved', true, 4.7, 23, 456
      ) RETURNING id
    `

    // Add ingredients for approved recipe
    await sql`
      INSERT INTO recipe_ingredients (recipe_id, ingredient, amount, unit, order_index)
      VALUES 
        (${approvedRecipe[0].id}, 'Spaghetti pasta', '400', 'g', 0),
        (${approvedRecipe[0].id}, 'Pancetta or guanciale', '150', 'g', 1),
        (${approvedRecipe[0].id}, 'Large eggs', '3', 'whole', 2),
        (${approvedRecipe[0].id}, 'Pecorino Romano cheese, grated', '100', 'g', 3),
        (${approvedRecipe[0].id}, 'Black pepper', '1', 'tsp', 4),
        (${approvedRecipe[0].id}, 'Salt', 'to taste', '', 5)
    `

    // Add instructions for approved recipe
    await sql`
      INSERT INTO recipe_instructions (recipe_id, instruction, step_number)
      VALUES 
        (${approvedRecipe[0].id}, 'Bring a large pot of salted water to boil and cook spaghetti according to package directions.', 1),
        (${approvedRecipe[0].id}, 'While pasta cooks, cut pancetta into small cubes and cook in a large skillet until crispy.', 2),
        (${approvedRecipe[0].id}, 'In a bowl, whisk together eggs, grated cheese, and black pepper.', 3),
        (${approvedRecipe[0].id}, 'Reserve 1 cup of pasta cooking water, then drain the pasta.', 4),
        (${approvedRecipe[0].id}, 'Add hot pasta to the skillet with pancetta and toss.', 5),
        (${approvedRecipe[0].id}, 'Remove from heat and quickly stir in the egg mixture, adding pasta water as needed.', 6),
        (${approvedRecipe[0].id}, 'Serve immediately with extra cheese and black pepper.', 7)
    `

    // Add tags for approved recipe
    await sql`
      INSERT INTO recipe_tags (recipe_id, tag)
      VALUES 
        (${approvedRecipe[0].id}, 'pasta'),
        (${approvedRecipe[0].id}, 'italian'),
        (${approvedRecipe[0].id}, 'dinner'),
        (${approvedRecipe[0].id}, 'quick')
    `

    // Add a pending test recipe
    const pendingRecipe = await sql`
      INSERT INTO recipes (
        title, description, author_id, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, image_url,
        moderation_status, is_published
      ) VALUES (
        'Test Pending Recipe - Homemade Pizza',
        'A delicious homemade pizza recipe with fresh dough and toppings. This recipe is pending approval for testing the moderation system.',
        ${userId}, 'Main Dishes', 'Hard',
        30, 25, 6, '/placeholder.svg?height=300&width=400&text=Homemade+Pizza',
        'pending', false
      ) RETURNING id
    `

    // Add ingredients for pending recipe
    await sql`
      INSERT INTO recipe_ingredients (recipe_id, ingredient, amount, unit, order_index)
      VALUES 
        (${pendingRecipe[0].id}, 'All-purpose flour', '3', 'cups', 0),
        (${pendingRecipe[0].id}, 'Warm water', '1', 'cup', 1),
        (${pendingRecipe[0].id}, 'Active dry yeast', '1', 'packet', 2),
        (${pendingRecipe[0].id}, 'Olive oil', '2', 'tbsp', 3),
        (${pendingRecipe[0].id}, 'Salt', '1', 'tsp', 4),
        (${pendingRecipe[0].id}, 'Sugar', '1', 'tsp', 5),
        (${pendingRecipe[0].id}, 'Pizza sauce', '1/2', 'cup', 6),
        (${pendingRecipe[0].id}, 'Mozzarella cheese, shredded', '2', 'cups', 7),
        (${pendingRecipe[0].id}, 'Pepperoni slices', '20', 'slices', 8)
    `

    // Add instructions for pending recipe
    await sql`
      INSERT INTO recipe_instructions (recipe_id, instruction, step_number)
      VALUES 
        (${pendingRecipe[0].id}, 'In a small bowl, dissolve yeast and sugar in warm water. Let stand for 5 minutes until foamy.', 1),
        (${pendingRecipe[0].id}, 'In a large bowl, combine flour and salt. Make a well in center and add yeast mixture and olive oil.', 2),
        (${pendingRecipe[0].id}, 'Mix until a soft dough forms. Knead on floured surface for 8-10 minutes until smooth.', 3),
        (${pendingRecipe[0].id}, 'Place dough in greased bowl, cover, and let rise for 1 hour until doubled.', 4),
        (${pendingRecipe[0].id}, 'Preheat oven to 475°F (245°C). Punch down dough and roll out to fit pizza pan.', 5),
        (${pendingRecipe[0].id}, 'Spread sauce over dough, leaving 1-inch border for crust.', 6),
        (${pendingRecipe[0].id}, 'Sprinkle with cheese and add pepperoni slices.', 7),
        (${pendingRecipe[0].id}, 'Bake for 12-15 minutes until crust is golden and cheese is bubbly.', 8),
        (${pendingRecipe[0].id}, 'Let cool for 5 minutes before slicing and serving.', 9)
    `

    // Add tags for pending recipe
    await sql`
      INSERT INTO recipe_tags (recipe_id, tag)
      VALUES 
        (${pendingRecipe[0].id}, 'pizza'),
        (${pendingRecipe[0].id}, 'homemade'),
        (${pendingRecipe[0].id}, 'italian'),
        (${pendingRecipe[0].id}, 'dinner'),
        (${pendingRecipe[0].id}, 'weekend')
    `

    return NextResponse.json({
      success: true,
      message: "Test recipes added successfully",
      data: {
        approvedRecipe: {
          id: approvedRecipe[0].id,
          title: "Test Approved Recipe - Spaghetti Carbonara",
          status: "approved",
        },
        pendingRecipe: {
          id: pendingRecipe[0].id,
          title: "Test Pending Recipe - Homemade Pizza",
          status: "pending",
        },
      },
    })
  } catch (error) {
    console.error("Failed to add test recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add test recipes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return POST() // Allow GET requests too for easier testing
}
