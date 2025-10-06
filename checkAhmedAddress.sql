-- Query 1: Check if Ahmed Hassan has an address
SELECT 
  a.id,
  a.title,
  a.address_line_1,
  a.address_line_2,
  a.city,
  a.latitude,
  a.longitude,
  a.is_default,
  p.full_name
FROM addresses a
JOIN profiles p ON a.user_id = p.id
WHERE a.user_id = '95ce7a7b-fb01-4941-a385-1ee6b9b4f7b1';

-- Alternative: Check both worker profile location and addresses
SELECT 
  'Worker Profile Location' as source,
  wp.base_location,
  wp.current_location,
  p.full_name
FROM worker_profiles wp
JOIN profiles p ON wp.user_id = p.id
WHERE wp.user_id = '95ce7a7b-fb01-4941-a385-1ee6b9b4f7b1'

UNION ALL

SELECT 
  'Address Table' as source,
  CONCAT('POINT(', a.longitude, ' ', a.latitude, ')') as base_location,
  NULL as current_location,
  p.full_name
FROM addresses a
JOIN profiles p ON a.user_id = p.id
WHERE a.user_id = '95ce7a7b-fb01-4941-a385-1ee6b9b4f7b1';