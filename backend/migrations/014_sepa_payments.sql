-- SEPA bank-transfer payment intents. The Belgian "structured communication"
-- is the join key between a payment in our DB and a transaction parsed from
-- a CODA bank statement. season_payments.paid remains the source of truth.
CREATE TABLE IF NOT EXISTS sepa_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  season_id INT NOT NULL,
  amount DECIMAL(8,2) NOT NULL,
  structured_communication CHAR(12) NOT NULL UNIQUE,
  status ENUM('pending','paid','canceled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  coda_transaction_ref VARCHAR(64) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_season_pending (user_id, season_id, status),
  INDEX idx_structured (structured_communication)
);
