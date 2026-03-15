-- Move venue/venue_address from seasons to concerts, add maestro to seasons

-- Add venue fields to concerts
ALTER TABLE concerts ADD COLUMN venue VARCHAR(255) AFTER label;
ALTER TABLE concerts ADD COLUMN venue_address TEXT AFTER venue;

-- Add maestro to seasons
ALTER TABLE seasons ADD COLUMN maestro VARCHAR(255) AFTER name;

-- Drop venue fields from seasons
ALTER TABLE seasons DROP COLUMN venue;
ALTER TABLE seasons DROP COLUMN venue_address;
