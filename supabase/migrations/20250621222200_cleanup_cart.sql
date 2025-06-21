-- Add an index on inserted_at for faster cleanup operations
CREATE INDEX IF NOT EXISTS idx_cart_inserted_at ON cart(inserted_at);

-- Delete cart entries older than 24 hours
DELETE FROM cart 
WHERE inserted_at < NOW() - INTERVAL '24 hours';

-- Add a trigger to automatically delete old cart items daily
CREATE OR REPLACE FUNCTION cleanup_old_cart_items()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM cart
  WHERE inserted_at < NOW() - INTERVAL '24 hours';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_cleanup_old_cart_items ON cart;

-- Create a trigger that runs once a day to clean up old cart items
CREATE TRIGGER trigger_cleanup_old_cart_items
  AFTER INSERT ON cart
  EXECUTE PROCEDURE cleanup_old_cart_items();

-- Comment explaining this migration
COMMENT ON FUNCTION cleanup_old_cart_items() IS 'Automatically cleans up cart items older than 24 hours';
