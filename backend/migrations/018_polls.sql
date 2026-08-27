-- Date polls ("Doodle"): the organiser proposes several slots, the musicians
-- mark their availability, and closing the poll on the winning slot turns it
-- into a real rehearsal.
CREATE TABLE IF NOT EXISTS polls (
  id INT PRIMARY KEY AUTO_INCREMENT,
  season_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  rehearsal_type ENUM('tutti','sectionelle') NOT NULL DEFAULT 'tutti',
  location_id INT NULL,
  duration_minutes INT NOT NULL DEFAULT 120,
  -- 'all' polls the whole orchestra; 'instrument' polls one section only.
  audience ENUM('all','instrument') NOT NULL DEFAULT 'all',
  audience_instrument VARCHAR(100) NULL,
  status ENUM('open','closed') NOT NULL DEFAULT 'open',
  closes_at DATETIME NULL,
  winning_option_id INT NULL,
  rehearsal_id INT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  FOREIGN KEY (rehearsal_id) REFERENCES rehearsals(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_polls_season (season_id),
  INDEX idx_polls_status (status)
);

CREATE TABLE IF NOT EXISTS poll_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  poll_id INT NOT NULL,
  option_date DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_poll_option (poll_id, option_date)
);

-- Added after poll_options exists: polls and poll_options reference each other.
ALTER TABLE polls
  ADD CONSTRAINT fk_polls_winning_option
  FOREIGN KEY (winning_option_id) REFERENCES poll_options(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS poll_votes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  option_id INT NOT NULL,
  user_id INT NOT NULL,
  availability ENUM('yes','maybe','no') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_option_user (option_id, user_id),
  INDEX idx_poll_votes_user (user_id)
);
