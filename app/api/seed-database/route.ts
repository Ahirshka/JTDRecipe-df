import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🌱 Starting database seeding...")

    // Hash passwords for sample users
    const defaultPassword = await bcrypt.hash("password123", 10)
    const ownerPassword = await bcrypt.hash("Morton2121", 10)

    // Clear existing data (except owner)
    await sql`DELETE FROM comments WHERE user_id != 1`
    await sql`DELETE FROM recipes WHERE user_id != 1`
    await sql`DELETE FROM users WHERE id != 1`

    // Insert sample users
    const users = [
      {
        username: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        password: defaultPassword,
        role: "user",
        verified: true,
        bio: "Professional chef with 15 years of experience in French cuisine.",
        avatar_url: "/placeholder-user.jpg",
      },
      {
        username: "Mike Rodriguez",
        email: "mike.rodriguez@email.com",
        password: defaultPassword,
        role: "user",
        verified: true,
        bio: "Home cook specializing in authentic Mexican dishes.",
        avatar_url: "/placeholder-user.jpg",
      },
      {
        username: "Emma Thompson",
        email: "emma.thompson@email.com",
        password: defaultPassword,
        role: "user",
        verified: true,
        bio: "Baking enthusiast and dessert specialist.",
        avatar_url: "/placeholder-user.jpg",
      },
      {
        username: "David Kim",
        email: "david.kim@email.com",
        password: defaultPassword,
        role: "user",
        verified: false,
        bio: "Asian fusion cooking enthusiast.",
        avatar_url: "/placeholder-user.jpg",
      },
      {
        username: "Lisa Brown",
        email: "lisa.brown@email.com",
        password: defaultPassword,
        role: "user",
        verified: true,
        bio: "Nutritionist focused on healthy, delicious meals.",
        avatar_url: "/placeholder-user.jpg",
      },
      {
        username: "TrollUser123",
        email: "troll@example.com",
        password: defaultPassword,
        role: "user",
        verified: false,
        bio: "Just here to cause trouble.",
        avatar_url: "/placeholder-user.jpg",
      },
    ]

    console.log("👥 Inserting sample users...")
    for (const user of users) {
      await sql`
        INSERT INTO users (username, email, password, role, verified, bio, avatar_url, created_at)
        VALUES (${user.username}, ${user.email}, ${user.password}, ${user.role}, ${user.verified}, ${user.bio}, ${user.avatar_url}, NOW())
      `
    }

    // Get user IDs for recipes
    const userIds = await sql`SELECT id, username FROM users WHERE id != 1 ORDER BY id`

    // Insert approved recipes
    const approvedRecipes = [
      {
        title: "Perfect Scrambled Eggs",
        description: "Gordon Ramsay's technique for the creamiest scrambled eggs.",
        ingredients: JSON.stringify([
          "3 large eggs",
          "1 tablespoon butter",
          "2 tablespoons crème fraîche",
          "Salt and pepper to taste",
          "Fresh chives for garnish",
        ]),
        instructions: JSON.stringify([
          "Crack eggs into a cold pan with butter",
          "Turn heat to medium-low and stir constantly",
          "Remove from heat when almost set",
          "Add crème fraîche and season",
          "Garnish with chives and serve immediately",
        ]),
        prep_time: 5,
        cook_time: 5,
        servings: 2,
        difficulty: "easy",
        category: "breakfast",
        tags: JSON.stringify(["eggs", "breakfast", "quick", "gordon-ramsay"]),
        image_url: "/placeholder.jpg",
        user_id: userIds[0].id,
        status: "approved",
        views: 1250,
        average_rating: 4.8,
      },
      {
        title: "Classic Chocolate Chip Cookies",
        description: "The ultimate chocolate chip cookie recipe that never fails.",
        ingredients: JSON.stringify([
          "2¼ cups all-purpose flour",
          "1 tsp baking soda",
          "1 tsp salt",
          "1 cup butter, softened",
          "¾ cup granulated sugar",
          "¾ cup brown sugar",
          "2 large eggs",
          "2 tsp vanilla extract",
          "2 cups chocolate chips",
        ]),
        instructions: JSON.stringify([
          "Preheat oven to 375°F",
          "Mix flour, baking soda, and salt in a bowl",
          "Cream butter and sugars until fluffy",
          "Beat in eggs and vanilla",
          "Gradually blend in flour mixture",
          "Stir in chocolate chips",
          "Drop rounded tablespoons onto ungreased cookie sheets",
          "Bake 9-11 minutes until golden brown",
        ]),
        prep_time: 15,
        cook_time: 10,
        servings: 48,
        difficulty: "easy",
        category: "dessert",
        tags: JSON.stringify(["cookies", "dessert", "chocolate", "baking"]),
        image_url: "/placeholder.jpg",
        user_id: userIds[2].id,
        status: "approved",
        views: 2100,
        average_rating: 4.9,
      },
      {
        title: "Authentic Beef Tacos",
        description: "Street-style beef tacos with homemade salsa.",
        ingredients: JSON.stringify([
          "1 lb ground beef",
          "1 onion, diced",
          "3 cloves garlic, minced",
          "1 tsp cumin",
          "1 tsp chili powder",
          "½ tsp paprika",
          "Salt and pepper",
          "Corn tortillas",
          "Fresh cilantro",
          "White onion, diced",
          "Lime wedges",
        ]),
        instructions: JSON.stringify([
          "Cook ground beef in a large skillet",
          "Add onion and garlic, cook until soft",
          "Season with cumin, chili powder, paprika, salt, and pepper",
          "Warm tortillas on a griddle",
          "Fill tortillas with beef mixture",
          "Top with cilantro and onion",
          "Serve with lime wedges",
        ]),
        prep_time: 10,
        cook_time: 15,
        servings: 4,
        difficulty: "medium",
        category: "dinner",
        tags: JSON.stringify(["tacos", "mexican", "beef", "street-food"]),
        image_url: "/placeholder.jpg",
        user_id: userIds[1].id,
        status: "approved",
        views: 890,
        average_rating: 4.7,
      },
      {
        title: "Mediterranean Quinoa Salad",
        description: "Fresh and healthy quinoa salad with Mediterranean flavors.",
        ingredients: JSON.stringify([
          "1 cup quinoa",
          "2 cups vegetable broth",
          "1 cucumber, diced",
          "2 tomatoes, diced",
          "½ red onion, thinly sliced",
          "½ cup kalamata olives",
          "½ cup feta cheese, crumbled",
          "¼ cup olive oil",
          "2 tbsp lemon juice",
          "2 tsp oregano",
          "Salt and pepper",
        ]),
        instructions: JSON.stringify([
          "Rinse quinoa and cook in vegetable broth",
          "Let quinoa cool completely",
          "Dice cucumber, tomatoes, and slice onion",
          "Whisk together olive oil, lemon juice, and oregano",
          "Combine quinoa with vegetables",
          "Add olives and feta cheese",
          "Toss with dressing and season",
          "Chill for 30 minutes before serving",
        ]),
        prep_time: 20,
        cook_time: 15,
        servings: 6,
        difficulty: "easy",
        category: "salad",
        tags: JSON.stringify(["quinoa", "mediterranean", "healthy", "vegetarian"]),
        image_url: "/placeholder.jpg",
        user_id: userIds[4].id,
        status: "approved",
        views: 650,
        average_rating: 4.6,
      },
      {
        title: "Creamy Chicken Alfredo",
        description: "Rich and creamy chicken alfredo pasta.",
        ingredients: JSON.stringify([
          "1 lb fettuccine pasta",
          "2 chicken breasts, sliced",
          "4 tbsp butter",
          "4 cloves garlic, minced",
          "2 cups heavy cream",
          "1½ cups parmesan cheese, grated",
          "¼ cup fresh parsley",
          "Salt and pepper",
          "Italian seasoning",
        ]),
        instructions: JSON.stringify([
          "Cook pasta according to package directions",
          "Season and cook chicken until golden",
          "Remove chicken and set aside",
          "Melt butter and sauté garlic",
          "Add heavy cream and simmer",
          "Stir in parmesan cheese until melted",
          "Add cooked chicken back to sauce",
          "Toss with pasta and garnish with parsley",
        ]),
        prep_time: 15,
        cook_time: 20,
        servings: 4,
        difficulty: "medium",
        category: "dinner",
        tags: JSON.stringify(["pasta", "chicken", "alfredo", "comfort-food"]),
        image_url: "/placeholder.jpg",
        user_id: userIds[0].id,
        status: "approved",
        views: 1450,
        average_rating: 4.5,
      },
    ]

    console.log("🍳 Inserting approved recipes...")
    for (const recipe of approvedRecipes) {
      await sql`
        INSERT INTO recipes (title, description, ingredients, instructions, prep_time, cook_time, servings, difficulty, category, tags, image_url, user_id, status, views, average_rating, created_at)
        VALUES (${recipe.title}, ${recipe.description}, ${recipe.ingredients}, ${recipe.instructions}, ${recipe.prep_time}, ${recipe.cook_time}, ${recipe.servings}, ${recipe.difficulty}, ${recipe.category}, ${recipe.tags}, ${recipe.image_url}, ${recipe.user_id}, ${recipe.status}, ${recipe.views}, ${recipe.average_rating}, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
      `
    }

    // Insert pending recipes
    const pendingRecipes = [
      {
        title: "Grandma's Secret Meatloaf",
        description: "Family recipe passed down for generations.",
        ingredients: JSON.stringify([
          "2 lbs ground beef",
          "1 cup breadcrumbs",
          "2 eggs",
          "1 onion, diced",
          "Secret spice blend",
          "Ketchup glaze",
        ]),
        instructions: JSON.stringify([
          "Mix all ingredients except glaze",
          "Form into loaf shape",
          "Bake at 350°F for 1 hour",
          "Apply glaze in last 15 minutes",
        ]),
        prep_time: 20,
        cook_time: 60,
        servings: 8,
        difficulty: "medium",
        category: "dinner",
        tags: JSON.stringify(["meatloaf", "comfort-food", "family-recipe"]),
        image_url: "/placeholder.jpg",
        user_id: userIds[1].id,
        status: "pending",
      },
      {
        title: "Spicy Korean Kimchi Fried Rice",
        description: "Authentic Korean fried rice with fermented kimchi.",
        ingredients: JSON.stringify([
          "3 cups cooked rice",
          "1 cup kimchi, chopped",
          "2 tbsp kimchi juice",
          "2 eggs",
          "2 green onions",
          "1 tbsp sesame oil",
          "1 tbsp soy sauce",
          "Sesame seeds",
        ]),
        instructions: JSON.stringify([
          "Heat oil in large pan",
          "Add kimchi and cook 2 minutes",
          "Add rice and kimchi juice",
          "Stir-fry until heated through",
          "Push rice to one side, scramble eggs",
          "Mix everything together",
          "Garnish with green onions and sesame seeds",
        ]),
        prep_time: 10,
        cook_time: 10,
        servings: 2,
        difficulty: "medium",
        category: "dinner",
        tags: JSON.stringify(["korean", "fried-rice", "kimchi", "spicy"]),
        image_url: "/placeholder.jpg",
        user_id: userIds[3].id,
        status: "pending",
      },
      {
        title: "Questionable Tuna Casserole",
        description: "This recipe might not be very good...",
        ingredients: JSON.stringify(["Canned tuna", "Noodles", "Some vegetables maybe", "Cheese if you have it"]),
        instructions: JSON.stringify(["Mix everything together", "Put in oven", "Cook until done"]),
        prep_time: 5,
        cook_time: 30,
        servings: 4,
        difficulty: "easy",
        category: "dinner",
        tags: JSON.stringify(["tuna", "casserole", "lazy"]),
        image_url: "/placeholder.jpg",
        user_id: userIds[5].id,
        status: "pending",
      },
    ]

    console.log("⏳ Inserting pending recipes...")
    for (const recipe of pendingRecipes) {
      await sql`
        INSERT INTO recipes (title, description, ingredients, instructions, prep_time, cook_time, servings, difficulty, category, tags, image_url, user_id, status, created_at)
        VALUES (${recipe.title}, ${recipe.description}, ${recipe.ingredients}, ${recipe.instructions}, ${recipe.prep_time}, ${recipe.cook_time}, ${recipe.servings}, ${recipe.difficulty}, ${recipe.category}, ${recipe.tags}, ${recipe.image_url}, ${recipe.user_id}, ${recipe.status}, NOW() - INTERVAL '${Math.floor(Math.random() * 7)} days')
      `
    }

    // Get recipe IDs for comments
    const recipes = await sql`SELECT id, title FROM recipes ORDER BY id`

    // Insert comments (some flagged)
    const comments = [
      {
        recipe_id: recipes[0].id,
        user_id: userIds[1].id,
        content: "These eggs are absolutely perfect! The technique really works.",
        rating: 5,
        flagged: false,
      },
      {
        recipe_id: recipes[0].id,
        user_id: userIds[2].id,
        content: "Great recipe, but I added a bit more butter.",
        rating: 4,
        flagged: false,
      },
      {
        recipe_id: recipes[1].id,
        user_id: userIds[0].id,
        content: "Best cookies I've ever made! Kids loved them.",
        rating: 5,
        flagged: false,
      },
      {
        recipe_id: recipes[1].id,
        user_id: userIds[5].id,
        content: "This recipe is garbage and the author is an idiot!",
        rating: 1,
        flagged: true,
      },
      {
        recipe_id: recipes[2].id,
        user_id: userIds[3].id,
        content: "Authentic flavors! Reminds me of street tacos in Mexico.",
        rating: 5,
        flagged: false,
      },
      {
        recipe_id: recipes[2].id,
        user_id: userIds[5].id,
        content: "Worst tacos ever. You people have no taste.",
        rating: 1,
        flagged: true,
      },
      {
        recipe_id: recipes[3].id,
        user_id: userIds[4].id,
        content: "Perfect for meal prep! Very nutritious.",
        rating: 4,
        flagged: false,
      },
      {
        recipe_id: recipes[4].id,
        user_id: userIds[5].id,
        content: "This is disgusting slop. I hate this website and everyone on it.",
        rating: 1,
        flagged: true,
      },
    ]

    console.log("💬 Inserting comments...")
    for (const comment of comments) {
      await sql`
        INSERT INTO comments (recipe_id, user_id, content, rating, flagged, created_at)
        VALUES (${comment.recipe_id}, ${comment.user_id}, ${comment.content}, ${comment.rating}, ${comment.flagged}, NOW() - INTERVAL '${Math.floor(Math.random() * 14)} days')
      `
    }

    // Update recipe ratings based on comments
    console.log("⭐ Updating recipe ratings...")
    for (const recipe of recipes) {
      const ratings = await sql`
        SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as review_count
        FROM comments 
        WHERE recipe_id = ${recipe.id} AND rating IS NOT NULL
      `

      if (ratings[0].review_count > 0) {
        await sql`
          UPDATE recipes 
          SET average_rating = ${ratings[0].avg_rating}, 
              review_count = ${ratings[0].review_count}
          WHERE id = ${recipe.id}
        `
      }
    }

    console.log("✅ Database seeding completed successfully!")

    return NextResponse.json({
      success: true,
      message: "Database seeded with sample data",
      data: {
        users: users.length + 1, // +1 for owner
        approvedRecipes: approvedRecipes.length,
        pendingRecipes: pendingRecipes.length,
        comments: comments.length,
        flaggedComments: comments.filter((c) => c.flagged).length,
      },
    })
  } catch (error) {
    console.error("❌ Database seeding failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed database",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to seed the database with sample data",
    endpoints: {
      seed: "POST /api/seed-database",
      clear: "POST /api/clear-database",
      init: "POST /api/init-db",
    },
  })
}
