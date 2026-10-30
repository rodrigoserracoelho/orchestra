-- Concerts only ever stored a date, so the linked rehearsal (the row that
-- carries attendance) sat at 00:00 on the day. Give a concert its own clock
-- times: when the audience hears the first note, and when the players are
-- called in for the warm-up (raccord). Both optional.
ALTER TABLE concerts
  ADD COLUMN concert_time TIME NULL AFTER concert_date,
  ADD COLUMN warmup_time TIME NULL AFTER concert_time;

-- An admin may have set a real time on the mirror rehearsal by hand; that is
-- the only place a concert time could have been recorded until now.
UPDATE concerts c
  JOIN rehearsals r ON r.concert_id = c.id
   SET c.concert_time = TIME(r.rehearsal_date)
 WHERE TIME(r.rehearsal_date) <> '00:00:00';
