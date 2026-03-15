-- Add new roles: maestro and section_leader
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'maestro', 'section_leader', 'musician') NOT NULL DEFAULT 'musician';

-- Add maestro_id foreign key to seasons (links to a user with role='maestro')
ALTER TABLE seasons ADD COLUMN maestro_id INT DEFAULT NULL AFTER maestro;
ALTER TABLE seasons ADD CONSTRAINT fk_seasons_maestro FOREIGN KEY (maestro_id) REFERENCES users(id) ON DELETE SET NULL;
