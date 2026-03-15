-- Email send log
CREATE TABLE IF NOT EXISTS email_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  method ENUM('smtp', 'resend', 'console') NOT NULL,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recipient (recipient),
  INDEX idx_created_at (created_at)
);

-- User sessions (online status tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
