-- Insert sample users
INSERT OR IGNORE INTO users (
    id, username, email, password, role, status, is_verified, 
    created_at, updated_at
) VALUES 
('user1', 'BakingMaster', 'baker@example.com', 'password123', 'user', 'active', TRUE, 
 datetime('now'), datetime('now')),
('user2', 'QuickCook', 'quick@example.com', 'password123', 'user', 'active', TRUE, 
 datetime('now'), datetime('now')),
('user3', 'HealthyEats', 'healthy@example.com', 'password123', 'user', 'active', TRUE, 
 datetime('now'), datetime('now')),
('owner1', 'Owner', 'owner@justthedamnrecipe.net', 'owner123', 'owner', 'active', TRUE, 
 datetime('now'), datetime('now'));

-- Insert sample recipes
INSERT OR IGNORE INTO recipes (
    id, title, description, author_id, category, difficulty, 
    prep_time_minutes, cook_time_minutes, servings, image_url, 
    rating, review_count, view_count, created_at, updated_at
) VALUES 
('recipe1', 'Perfect Chocolate Chip Cookies', 
 'These are the most perfect chocolate chip cookies you''ll ever make. Crispy edges, chewy centers, and loaded with chocolate chips.',
 'user1', 'Desserts', 'Easy', 15, 25, 24, '/placeholder.svg?height=400&width=600',
 4.9, 234, 1250, datetime('now', '-5 days'), datetime('now', '-5 days')),

('recipe2', 'One-Pot Chicken Alfredo',
 'Creamy, delicious chicken alfredo made in just one pot for easy cleanup.',
 'user2', 'Main Dishes', 'Medium', 10, 30, 4, '/placeholder.svg?height=400&width=600',
 4.8, 189, 980, datetime('now', '-10 days'), datetime('now', '-10 days')),

('recipe3', 'Fresh Garden Salad',
 'A refreshing garden salad with crisp vegetables and homemade vinaigrette.',
 'user3', 'Salads', 'Easy', 10, 0, 4, '/placeholder.svg?height=400&width=600',
 4.7, 156, 750, datetime('now', '-15 days'), datetime('now', '-15 days'));

-- Insert ingredients for Chocolate Chip Cookies
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient, order_index, created_at) VALUES
('ing1_1', 'recipe1', '2¼ cups all-purpose flour', 1, datetime('now')),
('ing1_2', 'recipe1', '1 tsp baking soda', 2, datetime('now')),
('ing1_3', 'recipe1', '1 tsp salt', 3, datetime('now')),
('ing1_4', 'recipe1', '1 cup butter, softened', 4, datetime('now')),
('ing1_5', 'recipe1', '¾ cup granulated sugar', 5, datetime('now')),
('ing1_6', 'recipe1', '¾ cup packed brown sugar', 6, datetime('now')),
('ing1_7', 'recipe1', '2 large eggs', 7, datetime('now')),
('ing1_8', 'recipe1', '2 tsp vanilla extract', 8, datetime('now')),
('ing1_9', 'recipe1', '2 cups chocolate chips', 9, datetime('now'));

-- Insert instructions for Chocolate Chip Cookies
INSERT OR IGNORE INTO recipe_instructions (id, recipe_id, instruction, step_number, created_at) VALUES
('inst1_1', 'recipe1', 'Preheat oven to 375°F (190°C).', 1, datetime('now')),
('inst1_2', 'recipe1', 'In a medium bowl, whisk together flour, baking soda, and salt.', 2, datetime('now')),
('inst1_3', 'recipe1', 'In a large bowl, cream together butter and both sugars until light and fluffy.', 3, datetime('now')),
('inst1_4', 'recipe1', 'Beat in eggs one at a time, then stir in vanilla.', 4, datetime('now')),
('inst1_5', 'recipe1', 'Gradually blend in flour mixture.', 5, datetime('now')),
('inst1_6', 'recipe1', 'Stir in chocolate chips.', 6, datetime('now')),
('inst1_7', 'recipe1', 'Drop rounded tablespoons of dough onto ungreased cookie sheets.', 7, datetime('now')),
('inst1_8', 'recipe1', 'Bake for 9-11 minutes or until golden brown.', 8, datetime('now')),
('inst1_9', 'recipe1', 'Cool on baking sheet for 2 minutes; remove to wire rack.', 9, datetime('now'));

-- Insert ingredients for Chicken Alfredo
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient, order_index, created_at) VALUES
('ing2_1', 'recipe2', '1 lb chicken breast, cubed', 1, datetime('now')),
('ing2_2', 'recipe2', '12 oz fettuccine pasta', 2, datetime('now')),
('ing2_3', 'recipe2', '2 cups heavy cream', 3, datetime('now')),
('ing2_4', 'recipe2', '1 cup parmesan cheese', 4, datetime('now')),
('ing2_5', 'recipe2', '3 cloves garlic, minced', 5, datetime('now')),
('ing2_6', 'recipe2', '2 tbsp olive oil', 6, datetime('now')),
('ing2_7', 'recipe2', 'Salt and pepper to taste', 7, datetime('now')),
('ing2_8', 'recipe2', 'Fresh parsley for garnish', 8, datetime('now'));

-- Insert instructions for Chicken Alfredo
INSERT OR IGNORE INTO recipe_instructions (id, recipe_id, instruction, step_number, created_at) VALUES
('inst2_1', 'recipe2', 'Heat olive oil in a large pot over medium-high heat.', 1, datetime('now')),
('inst2_2', 'recipe2', 'Add chicken and cook until golden brown.', 2, datetime('now')),
('inst2_3', 'recipe2', 'Add garlic and cook for 1 minute.', 3, datetime('now')),
('inst2_4', 'recipe2', 'Add pasta, cream, and 2 cups water.', 4, datetime('now')),
('inst2_5', 'recipe2', 'Bring to a boil, then reduce heat and simmer for 15 minutes.', 5, datetime('now')),
('inst2_6', 'recipe2', 'Stir in parmesan cheese until melted.', 6, datetime('now')),
('inst2_7', 'recipe2', 'Season with salt and pepper.', 7, datetime('now')),
('inst2_8', 'recipe2', 'Garnish with fresh parsley and serve.', 8, datetime('now'));

-- Insert ingredients for Garden Salad
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient, order_index, created_at) VALUES
('ing3_1', 'recipe3', '6 cups mixed greens', 1, datetime('now')),
('ing3_2', 'recipe3', '1 cucumber, sliced', 2, datetime('now')),
('ing3_3', 'recipe3', '2 tomatoes, chopped', 3, datetime('now')),
('ing3_4', 'recipe3', '1 red onion, thinly sliced', 4, datetime('now')),
('ing3_5', 'recipe3', '1 bell pepper, chopped', 5, datetime('now')),
('ing3_6', 'recipe3', '¼ cup olive oil', 6, datetime('now')),
('ing3_7', 'recipe3', '2 tbsp balsamic vinegar', 7, datetime('now')),
('ing3_8', 'recipe3', '1 tsp Dijon mustard', 8, datetime('now')),
('ing3_9', 'recipe3', 'Salt and pepper to taste', 9, datetime('now'));

-- Insert instructions for Garden Salad
INSERT OR IGNORE INTO recipe_instructions (id, recipe_id, instruction, step_number, created_at) VALUES
('inst3_1', 'recipe3', 'Wash and dry all vegetables.', 1, datetime('now')),
('inst3_2', 'recipe3', 'Combine greens, cucumber, tomatoes, onion, and bell pepper in a large bowl.', 2, datetime('now')),
('inst3_3', 'recipe3', 'In a small bowl, whisk together olive oil, balsamic vinegar, and Dijon mustard.', 3, datetime('now')),
('inst3_4', 'recipe3', 'Season dressing with salt and pepper.', 4, datetime('now')),
('inst3_5', 'recipe3', 'Drizzle dressing over salad just before serving.', 5, datetime('now')),
('inst3_6', 'recipe3', 'Toss gently and serve immediately.', 6, datetime('now'));

-- Insert tags
INSERT OR IGNORE INTO recipe_tags (id, recipe_id, tag, created_at) VALUES
('tag1_1', 'recipe1', 'cookies', datetime('now')),
('tag1_2', 'recipe1', 'dessert', datetime('now')),
('tag1_3', 'recipe1', 'chocolate', datetime('now')),
('tag1_4', 'recipe1', 'baking', datetime('now')),
('tag1_5', 'recipe1', 'easy', datetime('now')),
('tag2_1', 'recipe2', 'chicken', datetime('now')),
('tag2_2', 'recipe2', 'pasta', datetime('now')),
('tag2_3', 'recipe2', 'one-pot', datetime('now')),
('tag2_4', 'recipe2', 'dinner', datetime('now')),
('tag2_5', 'recipe2', 'creamy', datetime('now')),
('tag3_1', 'recipe3', 'salad', datetime('now')),
('tag3_2', 'recipe3', 'healthy', datetime('now')),
('tag3_3', 'recipe3', 'vegetarian', datetime('now')),
('tag3_4', 'recipe3', 'fresh', datetime('now')),
('tag3_5', 'recipe3', 'quick', datetime('now'));

-- Insert sample ratings
INSERT OR IGNORE INTO user_ratings (id, user_id, recipe_id, rating, review, created_at, updated_at) VALUES
('rating1', 'user2', 'recipe1', 5, 'Amazing cookies! My family loved them.', datetime('now', '-2 days'), datetime('now', '-2 days')),
('rating2', 'user3', 'recipe1', 5, 'Perfect recipe, followed exactly and they were delicious!', datetime('now', '-1 day'), datetime('now', '-1 day')),
('rating3', 'user1', 'recipe2', 5, 'So creamy and delicious!', datetime('now', '-3 days'), datetime('now', '-3 days')),
('rating4', 'user1', 'recipe3', 4, 'Fresh and healthy, great for summer!', datetime('now', '-4 days'), datetime('now', '-4 days'));

-- Insert sample favorites
INSERT OR IGNORE INTO user_favorites (id, user_id, recipe_id, created_at) VALUES
('fav1', 'user2', 'recipe1', datetime('now', '-2 days')),
('fav2', 'user3', 'recipe1', datetime('now', '-1 day')),
('fav3', 'user1', 'recipe2', datetime('now', '-3 days')),
('fav4', 'user1', 'recipe3', datetime('now', '-4 days'));
