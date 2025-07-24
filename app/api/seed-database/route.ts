import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import bcrypt from "bcryptjs"

export async function POST() {
  try {
    console.log("🌱 Starting database seeding...")

    // Create sample users
    const users = [
      {
        username: "Aaron Hirshka",
        email: "aaronhirshka@gmail.com",
        password: "Morton2121",
        role: "owner",
        is_verified: true,
        bio: "Founder of Just The Damn Recipe - making cooking simple again!",
        location: "San Francisco, CA",
      },
      {
        username: "Sarah Johnson",
        email: "sarah.chef@example.com",
        password: "password123",
        role: "user",
        is_verified: true,
        bio: "Professional chef with 15 years experience. Love sharing family recipes!",
        location: "New York, NY",
      },
      {
        username: "Mike Rodriguez",
        email: "mike.cooking@example.com",
        password: "password123",
        role: "user",
        is_verified: true,
        bio: "Home cook passionate about Mexican cuisine and BBQ.",
        location: "Austin, TX",
      },
      {
        username: "Emma Thompson",
        email: "emma.bakes@example.com",
        password: "password123",
        role: "user",
        is_verified: true,
        bio: "Baking enthusiast and food blogger. Specializing in desserts and pastries.",
        location: "Portland, OR",
      },
      {
        username: "David Kim",
        email: "david.asian@example.com",
        password: "password123",
        role: "user",
        is_verified: false,
        bio: "Exploring Asian fusion cooking and traditional Korean recipes.",
        location: "Los Angeles, CA",
      },
      {
        username: "Lisa Brown",
        email: "lisa.healthy@example.com",
        password: "password123",
        role: "user",
        is_verified: true,
        bio: "Nutritionist and healthy cooking advocate. Plant-based recipe creator.",
        location: "Denver, CO",
      },
      {
        username: "TrollUser123",
        email: "troll@example.com",
        password: "password123",
        role: "user",
        is_verified: false,
        bio: "Just here to cause trouble",
        location: "Unknown",
      },
    ]

    const createdUsers = []
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 12)

      const result = await sql`
        INSERT INTO users (
          username, email, password_hash, role, is_verified, is_profile_verified, 
          bio, location, status, created_at, updated_at
        ) VALUES (
          ${user.username}, ${user.email}, ${passwordHash}, ${user.role}, 
          ${user.is_verified}, ${user.is_verified}, ${user.bio}, ${user.location}, 
          'active', NOW(), NOW()
        ) 
        ON CONFLICT (email) DO UPDATE SET
          username = EXCLUDED.username,
          bio = EXCLUDED.bio,
          location = EXCLUDED.location
        RETURNING id, username, email, role
      `
      createdUsers.push(result[0])
    }

    console.log(`✅ Created ${createdUsers.length} users`)

    // Create approved recipes
    const approvedRecipes = [
      {
        title: "Perfect Scrambled Eggs",
        description:
          "Creamy, fluffy scrambled eggs made the Gordon Ramsay way. The secret is low heat and constant stirring.",
        author_username: "Aaron Hirshka",
        category: "Breakfast",
        difficulty: "Easy",
        prep_time: 2,
        cook_time: 5,
        servings: 2,
        ingredients: `• 3 large eggs
• 2 tablespoons butter
• 2 tablespoons heavy cream
• Salt and freshly ground black pepper
• Fresh chives for garnish (optional)`,
        instructions: `1. Crack eggs into a cold pan (no heat yet)
2. Add butter and cream to the pan with eggs
3. Turn heat to medium-low and start stirring immediately
4. Keep stirring constantly with a rubber spatula
5. When eggs start to thicken, remove from heat for 10 seconds
6. Return to heat and continue stirring
7. Repeat the on/off heat process until eggs are creamy
8. Season with salt and pepper, garnish with chives`,
        image_url: "/placeholder.svg?height=400&width=600&text=Perfect+Scrambled+Eggs",
      },
      {
        title: "Classic Chocolate Chip Cookies",
        description:
          "The ultimate chocolate chip cookie recipe - crispy edges, chewy centers, and loaded with chocolate chips.",
        author_username: "Emma Thompson",
        category: "Desserts",
        difficulty: "Easy",
        prep_time: 15,
        cook_time: 12,
        servings: 24,
        ingredients: `• 2¼ cups all-purpose flour
• 1 tsp baking soda
• 1 tsp salt
• 1 cup butter, softened
• ¾ cup granulated sugar
• ¾ cup packed brown sugar
• 2 large eggs
• 2 tsp vanilla extract
• 2 cups chocolate chips`,
        instructions: `1. Preheat oven to 375°F (190°C)
2. Mix flour, baking soda, and salt in a bowl
3. Cream butter and both sugars until fluffy
4. Beat in eggs one at a time, then vanilla
5. Gradually mix in flour mixture
6. Stir in chocolate chips
7. Drop rounded tablespoons onto ungreased baking sheets
8. Bake 9-11 minutes until golden brown
9. Cool on baking sheet for 2 minutes, then transfer to wire rack`,
        image_url: "/placeholder.svg?height=400&width=600&text=Chocolate+Chip+Cookies",
      },
      {
        title: "Authentic Beef Tacos",
        description: "Traditional Mexican street tacos with perfectly seasoned ground beef and fresh toppings.",
        author_username: "Mike Rodriguez",
        category: "Main Dishes",
        difficulty: "Medium",
        prep_time: 20,
        cook_time: 15,
        servings: 4,
        ingredients: `• 1 lb ground beef (80/20)
• 1 onion, diced
• 3 cloves garlic, minced
• 2 tsp chili powder
• 1 tsp cumin
• 1 tsp paprika
• ½ tsp oregano
• Salt and pepper to taste
• 8 corn tortillas
• Diced onion, cilantro, lime wedges for serving`,
        instructions: `1. Heat a large skillet over medium-high heat
2. Add ground beef and cook, breaking it up as it browns
3. Add diced onion and cook until softened
4. Add garlic and cook for 1 minute
5. Add all spices and cook for 2 minutes
6. Season with salt and pepper
7. Warm tortillas in a dry skillet or over open flame
8. Fill tortillas with beef mixture
9. Top with diced onion, cilantro, and serve with lime`,
        image_url: "/placeholder.svg?height=400&width=600&text=Beef+Tacos",
      },
      {
        title: "Mediterranean Quinoa Salad",
        description: "Fresh, healthy quinoa salad packed with Mediterranean flavors and colorful vegetables.",
        author_username: "Lisa Brown",
        category: "Salads",
        difficulty: "Easy",
        prep_time: 25,
        cook_time: 15,
        servings: 6,
        ingredients: `• 1 cup quinoa
• 2 cups vegetable broth
• 1 cucumber, diced
• 2 tomatoes, diced
• ½ red onion, thinly sliced
• ½ cup kalamata olives, pitted
• ½ cup feta cheese, crumbled
• ¼ cup olive oil
• 2 tbsp lemon juice
• 2 tsp dried oregano
• Salt and pepper to taste
• Fresh parsley for garnish`,
        instructions: `1. Rinse quinoa in cold water until water runs clear
2. Bring vegetable broth to boil, add quinoa
3. Reduce heat, cover and simmer 15 minutes
4. Remove from heat, let stand 5 minutes, then fluff with fork
5. Let quinoa cool completely
6. Mix cucumber, tomatoes, onion, olives, and feta in large bowl
7. Whisk olive oil, lemon juice, oregano, salt and pepper
8. Add cooled quinoa to vegetables
9. Pour dressing over salad and toss gently
10. Garnish with fresh parsley before serving`,
        image_url: "/placeholder.svg?height=400&width=600&text=Mediterranean+Quinoa+Salad",
      },
      {
        title: "Creamy Chicken Alfredo",
        description: "Rich and creamy chicken alfredo pasta made from scratch with real parmesan cheese.",
        author_username: "Sarah Johnson",
        category: "Main Dishes",
        difficulty: "Medium",
        prep_time: 15,
        cook_time: 25,
        servings: 4,
        ingredients: `• 1 lb fettuccine pasta
• 2 chicken breasts, sliced thin
• 4 tbsp butter
• 4 cloves garlic, minced
• 2 cups heavy cream
• 1½ cups freshly grated parmesan
• Salt and pepper to taste
• Fresh parsley for garnish
• 2 tbsp olive oil`,
        instructions: `1. Cook pasta according to package directions, reserve 1 cup pasta water
2. Season chicken with salt and pepper
3. Heat olive oil in large skillet, cook chicken until golden
4. Remove chicken, set aside
5. In same pan, melt butter and sauté garlic for 1 minute
6. Add heavy cream, bring to gentle simmer
7. Gradually whisk in parmesan cheese
8. Add cooked pasta and chicken back to pan
9. Toss everything together, adding pasta water if needed
10. Garnish with parsley and serve immediately`,
        image_url: "/placeholder.svg?height=400&width=600&text=Chicken+Alfredo",
      },
    ]

    const createdApprovedRecipes = []
    for (const recipe of approvedRecipes) {
      const author = createdUsers.find((u) => u.username === recipe.author_username)
      if (author) {
        const result = await sql`
          INSERT INTO recipes (
            title, description, author_id, author_username, category, difficulty,
            prep_time_minutes, cook_time_minutes, servings, ingredients, instructions,
            image_url, moderation_status, is_published, rating, rating_count, view_count,
            created_at, updated_at
          ) VALUES (
            ${recipe.title}, ${recipe.description}, ${author.id}, ${recipe.author_username},
            ${recipe.category}, ${recipe.difficulty}, ${recipe.prep_time}, ${recipe.cook_time},
            ${recipe.servings}, ${recipe.ingredients}, ${recipe.instructions}, ${recipe.image_url},
            'approved', true, ${4.0 + Math.random()}, ${Math.floor(Math.random() * 50) + 10},
            ${Math.floor(Math.random() * 500) + 100}, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days', NOW()
          ) RETURNING id, title
        `
        createdApprovedRecipes.push(result[0])
      }
    }

    console.log(`✅ Created ${createdApprovedRecipes.length} approved recipes`)

    // Create pending recipes
    const pendingRecipes = [
      {
        title: "Grandma's Secret Meatloaf",
        description: "My grandmother's famous meatloaf recipe that's been in our family for generations.",
        author_username: "David Kim",
        category: "Main Dishes",
        difficulty: "Medium",
        prep_time: 20,
        cook_time: 60,
        servings: 6,
        ingredients: `• 2 lbs ground beef
• 1 cup breadcrumbs
• 2 eggs
• 1 onion, diced
• 2 cloves garlic, minced
• ½ cup ketchup
• 2 tbsp Worcestershire sauce
• Salt and pepper to taste`,
        instructions: `1. Preheat oven to 350°F
2. Mix all ingredients in large bowl
3. Shape into loaf and place in baking dish
4. Bake for 1 hour until internal temp reaches 160°F
5. Let rest 10 minutes before slicing`,
        image_url: "/placeholder.svg?height=400&width=600&text=Meatloaf",
      },
      {
        title: "Spicy Korean Kimchi Fried Rice",
        description: "Authentic Korean kimchi fried rice with a perfect balance of spicy and savory flavors.",
        author_username: "David Kim",
        category: "Main Dishes",
        difficulty: "Easy",
        prep_time: 10,
        cook_time: 15,
        servings: 2,
        ingredients: `• 2 cups day-old cooked rice
• 1 cup kimchi, chopped
• 2 tbsp kimchi juice
• 2 tbsp vegetable oil
• 2 eggs
• 2 green onions, sliced
• 1 tbsp soy sauce
• 1 tsp sesame oil
• Sesame seeds for garnish`,
        instructions: `1. Heat oil in large skillet or wok over high heat
2. Add kimchi and stir-fry for 2 minutes
3. Add rice and kimchi juice, stir-fry for 5 minutes
4. Push rice to one side, scramble eggs on other side
5. Mix eggs into rice, add soy sauce and sesame oil
6. Garnish with green onions and sesame seeds`,
        image_url: "/placeholder.svg?height=400&width=600&text=Kimchi+Fried+Rice",
      },
      {
        title: "Questionable Tuna Casserole",
        description: "This might be good or might be terrible. I'm not really sure about the measurements.",
        author_username: "TrollUser123",
        category: "Main Dishes",
        difficulty: "Easy",
        prep_time: 5,
        cook_time: 30,
        servings: 4,
        ingredients: `• Some tuna cans
• Noodles (any kind)
• Cheese (whatever you have)
• Maybe some vegetables
• Salt I guess`,
        instructions: `1. Cook the noodles or whatever
2. Mix everything together
3. Put it in the oven
4. Cook until it looks done
5. Hope for the best`,
        image_url: "/placeholder.svg?height=400&width=600&text=Tuna+Casserole",
      },
    ]

    const createdPendingRecipes = []
    for (const recipe of pendingRecipes) {
      const author = createdUsers.find((u) => u.username === recipe.author_username)
      if (author) {
        const result = await sql`
          INSERT INTO recipes (
            title, description, author_id, author_username, category, difficulty,
            prep_time_minutes, cook_time_minutes, servings, ingredients, instructions,
            image_url, moderation_status, is_published, created_at, updated_at
          ) VALUES (
            ${recipe.title}, ${recipe.description}, ${author.id}, ${recipe.author_username},
            ${recipe.category}, ${recipe.difficulty}, ${recipe.prep_time}, ${recipe.cook_time},
            ${recipe.servings}, ${recipe.ingredients}, ${recipe.instructions}, ${recipe.image_url},
            'pending', false, NOW() - INTERVAL '${Math.floor(Math.random() * 7)} days', NOW()
          ) RETURNING id, title
        `
        createdPendingRecipes.push(result[0])
      }
    }

    console.log(`✅ Created ${createdPendingRecipes.length} pending recipes`)

    // Create comments (some will be flagged)
    const comments = [
      {
        recipe_title: "Perfect Scrambled Eggs",
        username: "Sarah Johnson",
        content: "This is exactly how I make my scrambled eggs! The low heat technique is key.",
        status: "approved",
        is_flagged: false,
      },
      {
        recipe_title: "Classic Chocolate Chip Cookies",
        username: "Mike Rodriguez",
        content: "Made these for my kids and they absolutely loved them. Perfect recipe!",
        status: "approved",
        is_flagged: false,
      },
      {
        recipe_title: "Perfect Scrambled Eggs",
        username: "TrollUser123",
        content: "This recipe is absolute garbage and the author is an idiot. What a waste of time!",
        status: "pending",
        is_flagged: true,
        flag_reason: "Inappropriate language and personal attacks",
      },
      {
        recipe_title: "Authentic Beef Tacos",
        username: "Emma Thompson",
        content: "Love the spice blend! I added a bit more cumin and it was perfect.",
        status: "approved",
        is_flagged: false,
      },
      {
        recipe_title: "Mediterranean Quinoa Salad",
        username: "David Kim",
        content: "Great healthy option! I meal prepped this for the whole week.",
        status: "approved",
        is_flagged: false,
      },
      {
        recipe_title: "Creamy Chicken Alfredo",
        username: "TrollUser123",
        content:
          "Why would anyone make this crap when you can just buy it from the store? Stupid recipe for stupid people.",
        status: "pending",
        is_flagged: true,
        flag_reason: "Offensive language and unhelpful criticism",
      },
      {
        recipe_title: "Classic Chocolate Chip Cookies",
        username: "Lisa Brown",
        content: "I substituted coconut oil for butter and used dark chocolate chips - amazing results!",
        status: "approved",
        is_flagged: false,
      },
      {
        recipe_title: "Perfect Scrambled Eggs",
        username: "TrollUser123",
        content: "Anyone who follows this recipe is a complete moron. This is the worst cooking advice I've ever seen.",
        status: "pending",
        is_flagged: true,
        flag_reason: "Personal attacks and inappropriate language",
      },
    ]

    const createdComments = []
    for (const comment of comments) {
      const recipe = createdApprovedRecipes.find((r) => r.title === comment.recipe_title)
      const user = createdUsers.find((u) => u.username === comment.username)
      const flagger = createdUsers.find((u) => u.username === "Aaron Hirshka") // Owner flags inappropriate comments

      if (recipe && user) {
        const result = await sql`
          INSERT INTO comments (
            recipe_id, user_id, username, content, status, is_flagged, 
            flagged_by, flagged_at, flag_reason, created_at, updated_at
          ) VALUES (
            ${recipe.id}, ${user.id}, ${comment.username}, ${comment.content}, 
            ${comment.status}, ${comment.is_flagged}, 
            ${comment.is_flagged ? flagger?.id : null}, 
            ${comment.is_flagged ? "NOW()" : null},
            ${comment.flag_reason || null}, 
            NOW() - INTERVAL '${Math.floor(Math.random() * 14)} days', NOW()
          ) RETURNING id, content
        `
        createdComments.push(result[0])
      }
    }

    console.log(`✅ Created ${createdComments.length} comments`)

    // Create some ratings
    const ratingsData = []
    for (const recipe of createdApprovedRecipes) {
      const numRatings = Math.floor(Math.random() * 8) + 3 // 3-10 ratings per recipe
      for (let i = 0; i < numRatings; i++) {
        const randomUser = createdUsers[Math.floor(Math.random() * (createdUsers.length - 1))] // Exclude troll user
        if (randomUser.username !== "TrollUser123") {
          ratingsData.push({
            recipe_id: recipe.id,
            user_id: randomUser.id,
            rating: Math.floor(Math.random() * 2) + 4, // 4-5 star ratings mostly
          })
        }
      }
    }

    for (const rating of ratingsData) {
      await sql`
        INSERT INTO ratings (recipe_id, user_id, rating, created_at, updated_at)
        VALUES (${rating.recipe_id}, ${rating.user_id}, ${rating.rating}, NOW(), NOW())
        ON CONFLICT (recipe_id, user_id) DO NOTHING
      `
    }

    console.log(`✅ Created ${ratingsData.length} ratings`)

    // Update recipe ratings based on actual ratings
    for (const recipe of createdApprovedRecipes) {
      const ratings = await sql`
        SELECT AVG(rating)::DECIMAL(3,2) as avg_rating, COUNT(*) as count
        FROM ratings WHERE recipe_id = ${recipe.id}
      `

      if (ratings[0].count > 0) {
        await sql`
          UPDATE recipes 
          SET rating = ${ratings[0].avg_rating}, rating_count = ${ratings[0].count}
          WHERE id = ${recipe.id}
        `
      }
    }

    console.log("✅ Updated recipe ratings")

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      data: {
        users: createdUsers.length,
        approvedRecipes: createdApprovedRecipes.length,
        pendingRecipes: createdPendingRecipes.length,
        comments: createdComments.length,
        ratings: ratingsData.length,
        flaggedComments: comments.filter((c) => c.is_flagged).length,
      },
    })
  } catch (error) {
    console.error("Database seeding error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
