-- Orchestra Attendance Database Schema
-- Note: When using Docker, the database is created automatically by MYSQL_DATABASE env var.
-- The CREATE DATABASE / USE statements below are kept for non-Docker setups.

CREATE DATABASE IF NOT EXISTS orchestra_attendance;
USE orchestra_attendance;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  instrument VARCHAR(100),
  part ENUM('I', 'II', 'Solo'),
  birthdate DATE,
  phone VARCHAR(30),
  role ENUM('admin', 'musician') NOT NULL DEFAULT 'musician',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Login codes table (passwordless auth)
CREATE TABLE IF NOT EXISTS login_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  INDEX idx_email_code (email, code),
  INDEX idx_expires_at (expires_at)
);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  maestro VARCHAR(255),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  season_fee DECIMAL(8,2) DEFAULT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Concerts table (N concerts per season)
CREATE TABLE IF NOT EXISTS concerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  season_id INT NOT NULL,
  concert_date DATE NOT NULL,
  label VARCHAR(255),
  venue VARCHAR(255),
  venue_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  INDEX idx_season_id (season_id),
  INDEX idx_concert_date (concert_date)
);

-- Rehearsals table
CREATE TABLE IF NOT EXISTS rehearsals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  season_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  rehearsal_date DATETIME NOT NULL,
  duration_minutes INT DEFAULT 120,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  INDEX idx_season_id (season_id),
  INDEX idx_rehearsal_date (rehearsal_date)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rehearsal_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('attending', 'not_attending', 'maybe') NOT NULL,
  notes VARCHAR(500),
  response_date TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rehearsal_id) REFERENCES rehearsals(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (rehearsal_id, user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Season payments table
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

-- Messages (inbox)
CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  cover_image VARCHAR(500) DEFAULT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS message_reads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  message_id INT NOT NULL,
  user_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_read (message_id, user_id)
);

-- News articles (blog-like rich content)
CREATE TABLE IF NOT EXISTS news (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  cover_image MEDIUMTEXT DEFAULT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS news_reads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  news_id INT NOT NULL,
  user_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_news_read (news_id, user_id)
);

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