-- Add color columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS color_palette jsonb,
ADD COLUMN IF NOT EXISTS color_primary text,
ADD COLUMN IF NOT EXISTS color_accent text,
ADD COLUMN IF NOT EXISTS color_mood text;

-- Update products with color data
UPDATE products SET 
  color_primary = '#2D1B3D',
  color_accent = '#D4AF37',
  color_palette = '["#2D1B3D", "#D4AF37", "#8B6C9C"]'::jsonb,
  color_mood = 'sophisticated'
WHERE name = 'Art of Implosion Coffee Blend';

UPDATE products SET 
  color_primary = '#FFD700',
  color_accent = '#00C9B7',
  color_palette = '["#FFD700", "#00C9B7", "#FFFFFF"]'::jsonb,
  color_mood = 'energetic'
WHERE name = 'Once Upon a Coconut';

UPDATE products SET 
  color_primary = '#3AB0FF',
  color_accent = '#87CEEB',
  color_palette = '["#3AB0FF", "#87CEEB", "#E8F4FF"]'::jsonb,
  color_mood = 'calm'
WHERE name = 'Prana Spring Water (500ml)';

UPDATE products SET 
  color_primary = '#7ED957',
  color_accent = '#A8E890',
  color_palette = '["#7ED957", "#A8E890", "#D4E8C1"]'::jsonb,
  color_mood = 'natural'
WHERE name LIKE '%SoSodium%Celery%';

UPDATE products SET 
  color_primary = '#D2691E',
  color_accent = '#F4A460',
  color_palette = '["#D2691E", "#F4A460", "#E8D5C4"]'::jsonb,
  color_mood = 'earthy'
WHERE name LIKE '%YALA%Kombucha%';

UPDATE products SET 
  color_primary = '#90C850',
  color_accent = '#B8E186',
  color_palette = '["#90C850", "#B8E186", "#E0F2D0"]'::jsonb,
  color_mood = 'natural'
WHERE name = 'Rite Greens';

UPDATE products SET 
  color_primary = '#1C1C1C',
  color_accent = '#8B7355',
  color_palette = '["#1C1C1C", "#8B7355", "#D4C4B0"]'::jsonb,
  color_mood = 'sophisticated'
WHERE name LIKE '%METÉ%';

UPDATE products SET 
  color_primary = '#FF8C42',
  color_accent = '#FFA654',
  color_palette = '["#FF8C42", "#FFA654", "#FFD4A3"]'::jsonb,
  color_mood = 'warm'
WHERE name = 'Rite Gut Health';

UPDATE products SET 
  color_primary = '#FF6B35',
  color_accent = '#FF8C69',
  color_palette = '["#FF6B35", "#FF8C69", "#FFD4C4"]'::jsonb,
  color_mood = 'energetic'
WHERE name LIKE '%Humantra%';

UPDATE products SET 
  color_primary = '#FFB347',
  color_accent = '#FFC872',
  color_palette = '["#FFB347", "#FFC872", "#FFE4B5"]'::jsonb,
  color_mood = 'warm'
WHERE name LIKE '%Ginger%Shot%';

UPDATE products SET 
  color_primary = '#FF69B4',
  color_accent = '#FF8C00',
  color_palette = '["#FF69B4", "#FF8C00", "#9370DB"]'::jsonb,
  color_mood = 'playful'
WHERE name LIKE '%Poppi%';

UPDATE products SET 
  color_primary = '#FFD700',
  color_accent = '#FFF8DC',
  color_palette = '["#FFD700", "#FFF8DC", "#F0E68C"]'::jsonb,
  color_mood = 'bright'
WHERE name LIKE '%Lemonjito%';

UPDATE products SET 
  color_primary = '#FF9B85',
  color_accent = '#FFB4A3',
  color_palette = '["#FF9B85", "#FFB4A3", "#00C896"]'::jsonb,
  color_mood = 'warm'
WHERE name LIKE '%Rosellini%';

UPDATE products SET 
  color_primary = '#B87333',
  color_accent = '#CD853F',
  color_palette = '["#B87333", "#CD853F", "#DEB887"]'::jsonb,
  color_mood = 'warm'
WHERE name LIKE '%Copper%Bottle%';

-- Verify updates
SELECT name, color_primary, color_accent, color_mood 
FROM products 
WHERE color_primary IS NOT NULL
ORDER BY name;
