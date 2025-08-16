-- Add infrared sauna and ice bath experiences for Ice House venue
-- First add the experiences to the experiences table

INSERT INTO experiences (name, description, price, category, duration_minutes, tags) VALUES
('Infrared Sauna', '20-minute reflexology of head and neck therapeutic massage using moderate pressure to relax muscles, boost circulation, and relieve tension', 25.00, 'wellness', 20, ARRAY['relaxing', 'therapeutic', 'heat', 'recovery']),
('Ice Bath', 'Energizing cold immersion at 4°C. Guided breath + pacing turn cold stress into calm alertness. Expert a sharp catecholamine release', 30.00, 'wellness', 15, ARRAY['energizing', 'cold', 'recovery', 'performance']);

-- Now link these experiences to the Ice House venue
-- (Assuming Ice House venue exists - replace venue_id with actual Ice House venue ID)

-- Get the experience IDs we just created
WITH new_experiences AS (
  SELECT id, name FROM experiences 
  WHERE name IN ('Infrared Sauna', 'Ice Bath')
),
ice_house_venue AS (
  SELECT id FROM venues WHERE name ILIKE '%ice house%' LIMIT 1
)
INSERT INTO venue_experiences (venue_id, experience_id, is_available, max_capacity, current_bookings, booking_url)
SELECT 
  iv.id as venue_id,
  ne.id as experience_id,
  true as is_available,
  CASE 
    WHEN ne.name = 'Infrared Sauna' THEN 4  -- 4 people max in sauna
    WHEN ne.name = 'Ice Bath' THEN 2        -- 2 people max in ice bath
  END as max_capacity,
  0 as current_bookings,
  'https://icehouse.book.now' as booking_url  -- Replace with actual booking URL
FROM ice_house_venue iv
CROSS JOIN new_experiences ne;
