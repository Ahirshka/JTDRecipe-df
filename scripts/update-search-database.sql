-- Add search-optimized indexes and views
CREATE INDEX IF NOT EXISTS idx_recipes_search ON recipes(title, category, difficulty);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_search ON recipe_tags(tag);
CREATE INDEX IF NOT EXISTS idx_recipes_published ON recipes(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes(rating DESC, review_count DESC);

-- Create a view for search results with aggregated data
CREATE VIEW IF NOT EXISTS recipe_search_view AS
SELECT 
    r.id,
    r.title,
    r.description,
    r.author_id,
    r.category,
    r.difficulty,
    r.prep_time_minutes,
    r.cook_time_minutes,
    r.servings,
    r.image_url,
    r.rating,
    r.review_count,
    r.view_count,
    r.created_at,
    u.username as author_username,
    GROUP_CONCAT(rt.tag, ', ') as tags_string,
    COUNT(rt.tag) as tag_count
FROM recipes r
LEFT JOIN users u ON r.author_id = u.id
LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
WHERE r.is_published = true
GROUP BY r.id, r.title, r.description, r.author_id, r.category, r.difficulty, 
         r.prep_time_minutes, r.cook_time_minutes, r.servings, r.image_url, 
         r.rating, r.review_count, r.view_count, r.created_at, u.username;

-- Add full-text search capabilities (if supported)
-- This would be database-specific implementation
