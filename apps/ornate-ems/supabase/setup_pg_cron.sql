-- =====================================================
-- Supabase pg_cron Setup for Daily Analytics Snapshots
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Step 1: Enable pg_cron extension (if not already enabled)
-- Go to Database > Extensions in Supabase Dashboard and enable pg_cron

-- Step 2: Create the function to capture daily analytics snapshot
CREATE OR REPLACE FUNCTION capture_daily_analytics_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_online_registrations INT;
    v_total_offline_registrations INT;
    v_confirmed_registrations INT;
    v_pending_registrations INT;
    v_waitlist_registrations INT;
    v_cancelled_registrations INT;  
    v_total_attendance INT;
    v_avg_attendance_rate FLOAT;
    v_active_participants INT;
    v_total_revenue FLOAT;
    v_pending_revenue FLOAT;
    v_total_events INT;
    v_total_regs INT;
BEGIN
    -- Count total online registrations (including all statuses)
    SELECT COUNT(*) INTO v_total_online_registrations
    FROM "Registration";
    
    -- Offline registrations (currently not tracked in schema, so 0)
    v_total_offline_registrations := 0;

    -- Detailed status counts
    SELECT COUNT(*) INTO v_confirmed_registrations
    FROM "Registration"
    WHERE status = 'CONFIRMED';

    SELECT COUNT(*) INTO v_pending_registrations
    FROM "Registration"
    WHERE status IN ('PENDING', 'PENDING_PAYMENT');

    SELECT COUNT(*) INTO v_waitlist_registrations
    FROM "Registration"
    WHERE status = 'WAITLISTED';

    SELECT COUNT(*) INTO v_cancelled_registrations
    FROM "Registration"
    WHERE status IN ('CANCELLED', 'REJECTED');
    
    -- Count total attendance
    SELECT COUNT(*) INTO v_total_attendance
    FROM "Registration"
    WHERE status = 'ATTENDED';
    
    -- Calculate total revenue from paid registrations
    SELECT COALESCE(SUM(amount), 0) INTO v_total_revenue
    FROM "Registration"
    WHERE "paymentStatus" = 'PAID';

    -- Calculate pending revenue
    SELECT COALESCE(SUM(amount), 0) INTO v_pending_revenue
    FROM "Registration"
    WHERE "paymentStatus" = 'PENDING';
    
    -- Count total events
    SELECT COUNT(*) INTO v_total_events
    FROM "Event";
    
    -- Calculate average attendance rate / completion rate
    v_total_regs := v_total_online_registrations + v_total_offline_registrations;
    IF v_total_regs > 0 THEN
        v_avg_attendance_rate := (v_total_attendance::FLOAT / v_total_regs::FLOAT) * 100;
    ELSE
        v_avg_attendance_rate := 0;
    END IF;

    -- Active participants = confirmed + attended
    v_active_participants := v_confirmed_registrations + v_total_attendance;
    
    -- Insert or update today's snapshot (upsert)
    INSERT INTO "AnalyticsSnapshot" (
        id,
        "snapshotDate",
        "totalEvents",
        "totalOnlineRegistrations",
        "totalOfflineRegistrations",
        "confirmedRegistrations",
        "pendingRegistrations",
        "waitlistRegistrations",
        "cancelledRegistrations",
        "totalAttendance",
        "avgAttendanceRate",
        "activeParticipants",
        "totalRevenue",
        "pendingRevenue",
        "completionRate",
        "createdAt"
    )
    VALUES (
        gen_random_uuid()::text,
        CURRENT_DATE,
        v_total_events,
        v_total_online_registrations,
        v_total_offline_registrations,
        v_confirmed_registrations,
        v_pending_registrations,
        v_waitlist_registrations,
        v_cancelled_registrations,
        v_total_attendance,
        v_avg_attendance_rate,
        v_active_participants,
        v_total_revenue,
        v_pending_revenue,
        v_avg_attendance_rate, -- completionRate matches attendance rate in our current logic
        NOW()
    )
    ON CONFLICT ("snapshotDate") 
    DO UPDATE SET
        "totalEvents" = EXCLUDED."totalEvents",
        "totalOnlineRegistrations" = EXCLUDED."totalOnlineRegistrations",
        "totalOfflineRegistrations" = EXCLUDED."totalOfflineRegistrations",
        "confirmedRegistrations" = EXCLUDED."confirmedRegistrations",
        "pendingRegistrations" = EXCLUDED."pendingRegistrations",
        "waitlistRegistrations" = EXCLUDED."waitlistRegistrations",
        "cancelledRegistrations" = EXCLUDED."cancelledRegistrations",
        "totalAttendance" = EXCLUDED."totalAttendance",
        "avgAttendanceRate" = EXCLUDED."avgAttendanceRate",
        "activeParticipants" = EXCLUDED."activeParticipants",
        "totalRevenue" = EXCLUDED."totalRevenue",
        "pendingRevenue" = EXCLUDED."pendingRevenue",
        "completionRate" = EXCLUDED."completionRate";
        
    RAISE NOTICE 'Analytics snapshot captured for %', CURRENT_DATE;
END;
$$;

-- Step 3: Test the function manually (run this to verify it works)
-- SELECT capture_daily_analytics_snapshot();

-- Step 4: Schedule the cron job to run daily at midnight (UTC)
-- This will run every day at 00:00 UTC
SELECT cron.schedule(
    'daily-analytics-snapshot',           -- Job name
    '0 0 * * *',                          -- Cron expression: every day at midnight UTC
    'SELECT capture_daily_analytics_snapshot()'
);

-- =====================================================
-- Useful commands for managing the cron job:
-- =====================================================

-- View all scheduled jobs:
-- SELECT * FROM cron.job;

-- View job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Unschedule a job:
-- SELECT cron.unschedule('daily-analytics-snapshot');

-- Run the function manually to create today's snapshot:
-- SELECT capture_daily_analytics_snapshot();

-- View all snapshots:
-- SELECT * FROM "AnalyticsSnapshot" ORDER BY "snapshotDate" DESC;
