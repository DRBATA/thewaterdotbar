-- Create a table for products (drinks)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'drink', -- To distinguish from experiences if merged later, or for filtering
  tags TEXT[], -- For AI searching, e.g., ['refreshing', 'citrus', 'detox']
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a table for wellness experiences
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'wellness',
  duration_minutes INTEGER, -- e.g., 20
  tags TEXT[], -- For AI searching, e.g., ['relaxing', 'meditative', 'rejuvenating']
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Create a table for chat history if you want to persist conversations
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Link to a user table if you add authentication
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an RLS policy to allow public read access to products and experiences
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to products" ON products FOR SELECT USING (true);

ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to experiences" ON experiences FOR SELECT USING (true);

-- Note: RLS for chat_messages would need to be more restrictive, typically user-specific.
-- For now, we'll handle chat without persisting messages to DB in this step to simplify.
