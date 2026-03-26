-- Add concert_id to rehearsals so concerts can have attendance tracking
ALTER TABLE rehearsals ADD COLUMN concert_id INT DEFAULT NULL AFTER notes;
ALTER TABLE rehearsals ADD CONSTRAINT fk_rehearsal_concert FOREIGN KEY (concert_id) REFERENCES concerts(id) ON DELETE CASCADE;
ALTER TABLE rehearsals ADD UNIQUE KEY unique_concert (concert_id);

-- Create rehearsal entries for all existing concerts
INSERT INTO rehearsals (season_id, title, location, rehearsal_date, duration_minutes, concert_id)
SELECT c.season_id, COALESCE(c.label, 'Concert'), c.venue, c.concert_date, 180, c.id
FROM concerts c;
