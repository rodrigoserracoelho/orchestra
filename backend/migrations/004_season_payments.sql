-- Add active and season_fee to seasons
ALTER TABLE seasons ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE AFTER maestro;
ALTER TABLE seasons ADD COLUMN season_fee DECIMAL(8,2) DEFAULT NULL AFTER active;

-- Season payments tracking
CREATE TABLE IF NOT EXISTS season_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  season_id INT NOT NULL,
  user_id INT NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMP NULL,
  marked_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_season_user (season_id, user_id)
);
