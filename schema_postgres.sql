-- ==============================================================================
-- EcoTrack PostgreSQL RLS Policies & Initial Seed Data
-- Run this in the Supabase SQL Editor to allow public submissions and insert initial routes
-- ==============================================================================

-- 1. Create Row Level Security (RLS) Policies for Public Anon Access
CREATE POLICY "Public full access tickets" ON public.tickets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access ticket_steps" ON public.ticket_steps FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access fleet_routes" ON public.fleet_routes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access reminders" ON public.reminders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Seed Initial Fleet Routes
INSERT INTO public.fleet_routes (id, sector, waste_stream, driver, progress, status)
VALUES
    ('TRK-101', 'LPU Boys Hostels (BH-1 to BH-4)', 'Hostel Mess Food Waste', 'Ram Singh & Team', 85, 'On Route'),
    ('TRK-102', 'Law Gate', 'Street Bins & Plastic', 'Harpreet & Team', 70, 'On Route'),
    ('TRK-103', 'Uni-Mall', 'Mixed Waste', 'Sukhwinder', 100, 'Completed'),
    ('TRK-104', 'Phagwara GT Road', 'Packaging & Dry', 'Gurpreet Singh', 55, 'On Route')
ON CONFLICT (id) DO UPDATE SET
    sector = EXCLUDED.sector,
    waste_stream = EXCLUDED.waste_stream,
    driver = EXCLUDED.driver,
    progress = EXCLUDED.progress,
    status = EXCLUDED.status;

-- 3. Seed Initial Service Alerts
INSERT INTO public.notifications (title, message, type, zone, time_str, is_unread)
VALUES
    ('Route #1 Completed', 'Hostel organic waste pickup at LPU Boys Hostels finished early.', 'green', 'LPU Boys Hostels', '22 mins ago', 1),
    ('Upcoming Pickup', 'Dry Recyclables collection tomorrow morning at 08:00 AM.', 'orange', 'Law Gate', '1 hr ago', 1),
    ('Weather Advisory', 'Normal collection schedules unaffected by light rain.', 'blue', 'Campus Wide', 'Yesterday', 0)
ON CONFLICT DO NOTHING;
