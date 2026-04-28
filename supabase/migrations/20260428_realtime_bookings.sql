-- ============================================================
-- WK-141 — enable realtime on the bookings table
-- WK-141's confirm screen subscribes to UPDATE events so a walker
-- sees their pending → confirmed / declined transition the moment
-- the host taps Accept (WK-132).
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
