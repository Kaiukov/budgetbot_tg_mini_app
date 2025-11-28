-- Template for creating usage tracking view in Firefly project
-- 90-day rolling window pattern with LEFT JOIN for complete coverage

-- ============================================
-- PATTERN: Usage View with Personal + Community Stats
-- ============================================

CREATE OR REPLACE VIEW example_usage_view AS
WITH 
-- Step 1: Calculate personal usage (per user)
user_usage AS (
    SELECT 
        user_name,
        item_id,
        category_id,
        COUNT(*) as usage_count,
        MIN(date) as first_used_at,
        MAX(date) as last_used_at
    FROM transactions
    WHERE 
        type = 'withdrawal'  -- or 'deposit' depending on context
        AND date >= CURRENT_DATE - INTERVAL '90 days'
        AND item_id IS NOT NULL
    GROUP BY user_name, item_id, category_id
),

-- Step 2: Calculate global usage (all users)
community_usage AS (
    SELECT 
        item_id,
        category_id,
        COUNT(*) as global_usage
    FROM transactions
    WHERE 
        type = 'withdrawal'
        AND date >= CURRENT_DATE - INTERVAL '90 days'
        AND item_id IS NOT NULL
    GROUP BY item_id, category_id
)

-- Step 3: Join with master table (ALL items returned)
SELECT 
    COALESCE(u.user_name, i.default_user) as user_name,
    i.id as item_id,
    i.name as item_name,
    c.category_id,
    c.category_name,
    COALESCE(u.usage_count, 0) as usage_count,
    COALESCE(g.global_usage, 0) as global_usage,
    (COALESCE(u.usage_count, 0) > 0) as user_has_used,
    u.first_used_at,
    u.last_used_at
FROM items i
LEFT JOIN categories c ON i.category_id = c.category_id
LEFT JOIN user_usage u ON i.id = u.item_id AND i.category_id = u.category_id
LEFT JOIN community_usage g ON i.id = g.item_id AND i.category_id = g.category_id
WHERE i.active = true
ORDER BY 
    user_has_used DESC,
    usage_count DESC,
    global_usage DESC,
    item_name ASC;


-- ============================================
-- PATTERN: Type-Aware View (withdrawal/deposit/service)
-- ============================================

CREATE OR REPLACE VIEW categories_with_type AS
WITH parsed_types AS (
    SELECT 
        category_id,
        name,
        notes,
        -- Parse type from JSON notes field
        CASE 
            WHEN notes::jsonb ? 'type' THEN 
                LOWER(notes::jsonb->>'type')
            ELSE 'unknown'
        END as type
    FROM categories
    WHERE active = true
)
SELECT * FROM parsed_types;


-- ============================================
-- INDEXES for Performance
-- ============================================

-- Always index foreign keys
CREATE INDEX IF NOT EXISTS idx_transactions_user_name 
ON transactions(user_name);

CREATE INDEX IF NOT EXISTS idx_transactions_date 
ON transactions(date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_item_id 
ON transactions(item_id) 
WHERE item_id IS NOT NULL;

-- Composite index for common filters
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
ON transactions(user_name, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_type_date 
ON transactions(type, date DESC);


-- ============================================
-- USAGE NOTES
-- ============================================

/*
Key Principles:
1. Use LEFT JOIN to return ALL items (even unused)
2. COALESCE for zero-fill when no usage
3. 90-day window for recency balance
4. Separate CTEs for personal vs community stats
5. Boolean user_has_used for client sorting

Query Pattern:
- Personal usage first (user_has_used=true)
- Sort by usage_count DESC within used
- Community popularity for unused items
- Alphabetical fallback

Performance:
- Indexes on user_name, date, foreign keys
- Composite indexes for common filters
- View calculates on-demand (no caching)
*/
