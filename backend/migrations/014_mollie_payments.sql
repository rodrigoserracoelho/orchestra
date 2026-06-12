-- Track Mollie payment lifecycle (initiated, paid, failed).
-- season_payments remains the source of truth for "is the user paid".
CREATE TABLE IF NOT EXISTS mollie_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  season_id INT NOT NULL,
  mollie_payment_id VARCHAR(64) NOT NULL UNIQUE,
  amount DECIMAL(8,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  checkout_url TEXT,
  webhook_payload JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  failed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  INDEX idx_user_season (user_id, season_id),
  INDEX idx_status (status)
);
