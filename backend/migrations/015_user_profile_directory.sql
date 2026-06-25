-- Musician directory: each user can show themselves with a picture and short bio.
-- profile_picture is base64-encoded image stored inline (same pattern as news cover images).
ALTER TABLE users
  ADD COLUMN profile_picture MEDIUMTEXT NULL AFTER phone,
  ADD COLUMN bio TEXT NULL AFTER profile_picture,
  ADD COLUMN show_in_directory BOOLEAN NOT NULL DEFAULT TRUE AFTER bio;
