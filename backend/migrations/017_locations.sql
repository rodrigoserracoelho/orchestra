-- Rehearsal locations become a managed list instead of free text, so admins
-- pick a venue from a combo box rather than retyping (and misspelling) it.
CREATE TABLE IF NOT EXISTS locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  address VARCHAR(255),
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO locations (name) VALUES ('Ecole du Longchamp');

ALTER TABLE rehearsals
  ADD COLUMN location_id INT NULL AFTER location,
  ADD CONSTRAINT fk_rehearsals_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

-- Backfill: every distinct venue already typed on a real rehearsal becomes a
-- location, then the rehearsals are linked to it. Concert rows are skipped —
-- their venue lives on the concert record.
INSERT IGNORE INTO locations (name)
  SELECT DISTINCT TRIM(location) FROM rehearsals
  WHERE concert_id IS NULL AND location IS NOT NULL AND TRIM(location) <> '';

UPDATE rehearsals r
  JOIN locations l ON l.name = TRIM(r.location)
  SET r.location_id = l.id
  WHERE r.concert_id IS NULL AND r.location_id IS NULL;
