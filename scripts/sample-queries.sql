-- Sample queries for the recipe database

-- Get all published recipes with author information
SELECT 
    r.id,
    r.title,
    r.description,
    r.category,
    r.difficulty,
    r.prep_time_minutes,
    r.cook_time_minutes,
    r.servings,
    r.rating,
    r.review_count,
    r.view_count,
    u.username as author_name,
    r.created_at
FROM recipes r
JOIN users u ON r.author_id = u.id
WHERE r.is_published = TRUE
ORDER BY r.created_at DESC;

-- Get recipe with all details (ingredients, instructions, tags)
SELECT 
    r.*,
    u.username as author_name,
    GROUP_CONCAT(DISTINCT ri.ingredient ORDER BY ri.order_index) as ingredients,
    GROUP_CONCAT(DISTINCT inst.instruction ORDER BY inst.step_number) as instructions,
    GROUP_CONCAT(DISTINCT rt.tag) as tags
FROM recipes r
JOIN users u ON r.author_id = u.id
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN recipe_instructions inst ON r.id = inst.recipe_id
LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
WHERE r.id = 'recipe1'
GROUP BY r.id;

-- Get user's favorite recipes
SELECT 
    r.id,
    r.title,
    r.category,
    r.rating,
    u.username as author_name
FROM user_favorites uf
JOIN recipes r ON uf.recipe_id = r.id
JOIN users u ON r.author_id = u.id
WHERE uf.user_id = 'user1'
ORDER BY uf.created_at DESC;

-- Get recipes by category with ratings
SELECT 
    r.id,
    r.title,
    r.description,
    r.difficulty,
    r.prep_time_minutes + r.cook_time_minutes as total_time,
    r.rating,
    r.review_count,
    u.username as author_name
FROM recipes r
JOIN users u ON r.author_id = u.id
WHERE r.category = 'Desserts' 
    AND r.is_published = TRUE
ORDER BY r.rating DESC, r.review_count DESC;

-- Get top rated recipes
SELECT 
    r.id,
    r.title,
    r.category,
    r.rating,
    r.review_count,
    u.username as author_name
FROM recipes r
JOIN users u ON r.author_id = u.id
WHERE r.is_published = TRUE 
    AND r.review_count >= 5
ORDER BY r.rating DESC, r.review_count DESC
LIMIT 10;

-- Get user statistics
SELECT 
    u.username,
    COUNT(DISTINCT r.id) as recipes_created,
    COUNT(DISTINCT uf.recipe_id) as favorites_count,
    COUNT(DISTINCT ur.recipe_id) as ratings_given,
    AVG(ur.rating) as avg_rating_given
FROM users u
LEFT JOIN recipes r ON u.id = r.author_id AND r.is_published = TRUE
LEFT JOIN user_favorites uf ON u.id = uf.user_id
LEFT JOIN user_ratings ur ON u.id = ur.user_id
WHERE u.id = 'user1'
GROUP BY u.id, u.username;

-- Search recipes by title or ingredients
SELECT DISTINCT
    r.id,
    r.title,
    r.category,
    r.rating,
    u.username as author_name
FROM recipes r
JOIN users u ON r.author_id = u.id
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
WHERE r.is_published = TRUE
    AND (
        r.title LIKE '%chocolate%' 
        OR r.description LIKE '%chocolate%'
        OR ri.ingredient LIKE '%chocolate%'
    )
ORDER BY r.rating DESC;

-- Get recent activity (new recipes and ratings)
SELECT 
    'recipe' as activity_type,
    r.id as item_id,
    r.title as item_title,
    u.username as user_name,
    r.created_at as activity_date
FROM recipes r
JOIN users u ON r.author_id = u.id
WHERE r.is_published = TRUE

UNION ALL

SELECT 
    'rating' as activity_type,
    ur.recipe_id as item_id,
    r.title as item_title,
    u.username as user_name,
    ur.created_at as activity_date
FROM user_ratings ur
JOIN recipes r ON ur.recipe_id = r.id
JOIN users u ON ur.user_id = u.id
WHERE r.is_published = TRUE

ORDER BY activity_date DESC
LIMIT 20;
