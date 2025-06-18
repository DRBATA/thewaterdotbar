-- Seed products (drinks)
INSERT INTO products (name, description, price, image_url, tags) VALUES
('Alkaline Water', 'Pure, ionized water for optimal hydration.', 3.50, '/alkaline-water-lemon.png', ARRAY['hydrating', 'pure', 'alkaline']),
('Cucumber Mint Infusion', 'Refreshing water infused with fresh cucumber and mint.', 4.00, '/cucumber-mint-water.png', ARRAY['refreshing', 'cool', 'minty', 'cucumber']),
('Berry Antioxidant Blend', 'Water infused with mixed berries for a healthy boost.', 4.50, '/berry-infused-water.png', ARRAY['antioxidant', 'berry', 'sweet', 'healthy']),
('Ginger Lemon Detox', 'Zesty water with ginger and lemon for cleansing.', 4.25, '/placeholder-sfk2h.png', ARRAY['detox', 'zesty', 'ginger', 'lemon', 'cleansing']);

-- Seed wellness experiences
INSERT INTO experiences (name, description, price, image_url, duration_minutes, tags) VALUES
('Hydro-Massage Session', '20-minute relaxing water jet massage.', 25.00, '/serene-hydro-massage.png', 20, ARRAY['relaxing', 'massage', 'water_therapy', 'rejuvenating']),
('Aromatherapy Steam', '15-minute steam session with essential oils.', 20.00, '/placeholder.svg?height=200&width=300', 15, ARRAY['aromatherapy', 'steam', 'relaxing', 'detox']),
('Guided Meditation', '30-minute guided meditation with calming water sounds.', 15.00, '/placeholder.svg?height=200&width=300', 30, ARRAY['meditation', 'calming', 'mindfulness', 'stress_relief']),
('Mineral Foot Soak', '10-minute rejuvenating foot soak with mineral salts.', 18.00, '/placeholder.svg?height=200&width=300', 10, ARRAY['rejuvenating', 'foot_care', 'relaxing', 'minerals']);
