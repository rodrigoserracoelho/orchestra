-- Rehearsals are either a full-orchestra run (tutti) or a single-section
-- sectional (sectionelle). Existing rows are all full-orchestra rehearsals.
ALTER TABLE rehearsals
  ADD COLUMN rehearsal_type ENUM('tutti','sectionelle') NOT NULL DEFAULT 'tutti' AFTER title;
