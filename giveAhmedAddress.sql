-- Query 2: Insert an address for Ahmed Hassan in a different location
-- This will place him in a different area of Casablanca

INSERT INTO addresses (
  user_id,
  title,
  address_line_1,
  address_line_2,
  city,
  state,
  postal_code,
  country,
  latitude,
  longitude,
  is_default
) VALUES (
  '95ce7a7b-fb01-4941-a385-1ee6b9b4f7b1',
  'Ahmed Professional Car Wash - Main Location',
  'Boulevard Mohammed V, Quartier Administratif',
  'Near Hassan II Mosque',
  'Casablanca',
  'Casablanca-Settat',
  '20250',
  'Morocco',
  33.5975,  -- Different latitude (Hassan II Mosque area)
  -7.6185,  -- Different longitude  
  true
);

-- Also update the worker profile base_location to match
UPDATE worker_profiles 
SET base_location = ST_GeomFromText('POINT(-7.6185 33.5975)', 4326),
    current_location = ST_GeomFromText('POINT(-7.6185 33.5975)', 4326),
    updated_at = NOW()
WHERE user_id = '95ce7a7b-fb01-4941-a385-1ee6b9b4f7b1';

-- Optional: Verify the update
SELECT 
  p.full_name,
  a.title,
  a.address_line_1,
  a.city,
  a.latitude,
  a.longitude,
  ST_AsText(wp.base_location) as worker_base_location
FROM addresses a
JOIN profiles p ON a.user_id = p.id
JOIN worker_profiles wp ON wp.user_id = p.id
WHERE a.user_id = '95ce7a7b-fb01-4941-a385-1ee6b9b4f7b1';