-- Add venue fields to seasons and move concerts to separate table

ALTER TABLE seasons ADD COLUMN venue VARCHAR(255) AFTER name;
ALTER TABLE seasons ADD COLUMN venue_address TEXT AFTER venue;

-- Create concerts table (N concerts per season)
CREATE TABLE IF NOT EXISTS concerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  season_id INT NOT NULL,
  concert_date DATE NOT NULL,
  label VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  INDEX idx_season_id (season_id),
  INDEX idx_concert_date (concert_date)
);

-- Migrate existing concert_date data into concerts table
INSERT INTO concerts (season_id, concert_date)
  SELECT id, concert_date FROM seasons WHERE concert_date IS NOT NULL;

-- Drop old concert_date column
ALTER TABLE seasons DROP INDEX idx_concert_date;
ALTER TABLE seasons DROP COLUMN concert_date;
