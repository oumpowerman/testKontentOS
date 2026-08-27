


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."content_pillar" AS ENUM (
    'EDUCATION',
    'ENTERTAINMENT',
    'LIFESTYLE',
    'PROMO',
    'OTHER'
);


ALTER TYPE "public"."content_pillar" OWNER TO "postgres";


CREATE TYPE "public"."platform_type" AS ENUM (
    'YOUTUBE',
    'TIKTOK',
    'FACEBOOK',
    'INSTAGRAM',
    'OTHER'
);


ALTER TYPE "public"."platform_type" OWNER TO "postgres";


CREATE TYPE "public"."task_priority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE "public"."task_priority" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'TODO',
    'DOING',
    'DONE',
    'BLOCKED'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."task_type" AS ENUM (
    'CONTENT',
    'TASK',
    'PLAN'
);


ALTER TYPE "public"."task_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'ADMIN',
    'MEMBER'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_in_reminder_cron"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    cur_date DATE;
    profile_rec RECORD;
    has_checkin BOOLEAN;
    on_leave BOOLEAN;
    start_time_val TEXT := '10:00';
    shifts_enabled_val TEXT := 'false';
    shifts_list_val TEXT := '';
    temp_start_val TEXT;
    late_buffer_val TEXT := '15';
    late_alert_mode_val TEXT := 'AFTER_LIMIT';
    late_alert_offset_val TEXT := '5';
    late_alert_target_roles_val TEXT := 'BOTH';
    start_time_parsed TIME;
    late_buffer_minutes INT;
    grace_limit_time TIME;
    grace_limit_str TEXT;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Determine current date in Thailand (Asia/Bangkok timezone) to remain server-independent
    cur_date := (timezone('Asia/Bangkok'::text, now()))::DATE;

    -- Fetch WORK_CONFIGs from master_options
    SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
    IF start_time_val IS NULL THEN
        start_time_val := '10:00';
    END IF;

    SELECT label INTO shifts_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_ENABLED' LIMIT 1;
    IF LOWER(TRIM(shifts_enabled_val)) = 'true' THEN
        SELECT label INTO shifts_list_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_LIST' LIMIT 1;
        IF shifts_list_val IS NOT NULL AND TRIM(shifts_list_val) <> '' THEN
            BEGIN
                SELECT left(max(NULLIF(trim(s), '')::TIME)::text, 5) INTO temp_start_val
                FROM unnest(string_to_array(shifts_list_val, ',')) s
                WHERE NULLIF(trim(s), '') IS NOT NULL 
                  AND NULLIF(trim(s), '') ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$';
                
                IF temp_start_val IS NOT NULL THEN
                    start_time_val := temp_start_val;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- Fallback to original START_TIME if parsing fails
            END;
        END IF;
    END IF;

    SELECT label INTO late_buffer_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_BUFFER' LIMIT 1;
    IF late_buffer_val IS NULL THEN
        late_buffer_val := '15';
    END IF;

    SELECT label INTO late_alert_mode_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_ALERT_MODE' LIMIT 1;
    IF late_alert_mode_val IS NULL THEN
        late_alert_mode_val := 'AFTER_LIMIT';
    END IF;

    SELECT label INTO late_alert_offset_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_ALERT_OFFSET' LIMIT 1;
    IF late_alert_offset_val IS NULL THEN
        late_alert_offset_val := '5';
    END IF;

    SELECT label INTO late_alert_target_roles_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_ALERT_TARGET_ROLES' LIMIT 1;
    IF late_alert_target_roles_val IS NULL THEN
        late_alert_target_roles_val := 'BOTH';
    END IF;

    -- Parse start time and buffer
    BEGIN
        start_time_parsed := start_time_val::TIME;
    EXCEPTION WHEN OTHERS THEN
        start_time_parsed := '10:00'::TIME;
    END;

    BEGIN
        late_buffer_minutes := late_buffer_val::INT;
    EXCEPTION WHEN OTHERS THEN
        late_buffer_minutes := 15;
    END;

    -- Calculate grace limit time
    grace_limit_time := start_time_parsed + (late_buffer_minutes || ' minutes')::INTERVAL;
    grace_limit_str := left(grace_limit_time::text, 5);

    -- Setup dynamic title & message
    IF late_alert_mode_val = 'BEFORE_LIMIT' THEN
        notification_title := '⏰ รีบลงเวลางานน้า (ใกล้หมดเวลาผ่อนปรน)';
        notification_message := 'อีก ' || late_alert_offset_val || ' นาทีจะสิ้นสุดช่วงผ่อนปรนลงเวลาเข้างานแล้วนะคะ รีบเช็คอินก่อน ' || grace_limit_str || ' น้า~ 😊 เข้าแอปมาเช็คอินตอนนี้เลยเพื่อรักษาพลังชีวิต (HP) กันค่ะ';
    ELSE
        notification_title := '⏰ ลืมลงเวลาทำงานหรือเปล่าเอ่ย?';
        notification_message := 'เลยเวลาเริ่มงานของวันนี้ (' || start_time_val || ') และหมดช่วงผ่อนปรนแล้ว (' || grace_limit_str || ') ระบบยังไม่พบบันทึกการตอกบัตรเข้างานของคุณ รีบเข้าแอปมาลงเวลาก่อนถูกหักพลังชีวิต (HP) นะคะ';
    END IF;

    -- Loop through active profiles
    FOR profile_rec IN 
        SELECT id, full_name 
        FROM public.profiles 
        WHERE is_active = TRUE
          AND (
            late_alert_target_roles_val = 'BOTH' OR
            (late_alert_target_roles_val = 'ADMIN' AND role = 'ADMIN') OR
            (late_alert_target_roles_val = 'MEMBER' AND role != 'ADMIN')
          )
    LOOP
        -- Check if today is a working day for this user
        IF public.is_working_day_db(cur_date, profile_rec.id) THEN
            -- Check if user already checked in today
            SELECT EXISTS (
                SELECT 1 FROM public.attendance_logs 
                WHERE user_id = profile_rec.id 
                  AND date = cur_date 
                  AND check_in_time IS NOT NULL
            ) INTO has_checkin;

            IF NOT has_checkin THEN
                -- Check if user is on leave today
                SELECT EXISTS (
                    SELECT 1 FROM public.leave_requests 
                    WHERE user_id = profile_rec.id 
                      AND status = 'APPROVED'
                      AND start_date <= cur_date 
                      AND end_date >= cur_date
                ) INTO on_leave;

                IF NOT on_leave THEN
                    -- Check if we have already sent an OVERDUE check-in reminder today
                    IF NOT EXISTS (
                        SELECT 1 FROM public.notifications 
                        WHERE user_id = profile_rec.id 
                          AND type = 'OVERDUE' 
                          AND (title LIKE '%ลงเวลาทำงาน%' OR title LIKE '%ลงเวลางาน%' OR title LIKE '%ผ่อนปรน%')
                          AND created_at >= (cur_date::TIMESTAMP)
                    ) THEN
                        -- Insert notification
                        -- Setting line_status explicitly to NULL to trigger Deno webhook Push-to-LINE
                        INSERT INTO public.notifications (
                            user_id,
                            type,
                            title,
                            message,
                            is_read,
                            link_path,
                            metadata,
                            line_status
                        ) VALUES (
                            profile_rec.id,
                            'OVERDUE',
                            notification_title,
                            notification_message,
                            FALSE,
                            'ATTENDANCE',
                            jsonb_build_object('target_shift_time', start_time_val),
                            NULL
                        );
                    END IF;
                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION "public"."check_in_reminder_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."checkout_reminder_cron"("target_shift_start" time without time zone DEFAULT NULL::time without time zone) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    cur_date DATE;
    profile_rec RECORD;
    log_rec RECORD;
    on_leave BOOLEAN;
    end_time_val TEXT := '19:00';
    checkout_alert_enabled_val TEXT := 'true';
    checkout_alert_mode_val TEXT := 'AFTER_LIMIT';
    checkout_alert_offset_val TEXT := '5';
    checkout_alert_target_roles_val TEXT := 'BOTH';
    shifts_enabled_val TEXT := 'false';
    shifts_list_val TEXT := '';
    min_hours_val TEXT := '9';
    end_time_parsed TIME;
    checkout_offset_minutes INT;
    notification_title TEXT;
    notification_message TEXT;
    mapped_shift TIME;
    display_time_str TEXT;
BEGIN
    -- Determine current date in Thailand (Asia/Bangkok timezone) to remain server-independent
    cur_date := (timezone('Asia/Bangkok'::text, now()))::DATE;

    -- Fetch CHECKOUT_ALERT_ENABLED
    SELECT label INTO checkout_alert_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_ENABLED' LIMIT 1;
    IF checkout_alert_enabled_val IS NULL THEN
        checkout_alert_enabled_val := 'true';
    END IF;

    -- If disabled, do nothing
    IF checkout_alert_enabled_val = 'false' THEN
        RETURN;
    END IF;

    -- Fetch END_TIME from master_options
    SELECT label INTO end_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'END_TIME' LIMIT 1;
    IF end_time_val IS NULL THEN
        end_time_val := '19:00';
    END IF;

    -- Fetch alert mode, offset, target roles
    SELECT label INTO checkout_alert_mode_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_MODE' LIMIT 1;
    IF checkout_alert_mode_val IS NULL THEN
        checkout_alert_mode_val := 'AFTER_LIMIT';
    END IF;

    SELECT label INTO checkout_alert_offset_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_OFFSET' LIMIT 1;
    IF checkout_alert_offset_val IS NULL THEN
        checkout_alert_offset_val := '5';
    END IF;

    SELECT label INTO checkout_alert_target_roles_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_TARGET_ROLES' LIMIT 1;
    IF checkout_alert_target_roles_val IS NULL THEN
        checkout_alert_target_roles_val := 'BOTH';
    END IF;

    -- Fetch MULTIPLE_SHIFTS_ENABLED and list
    SELECT label INTO shifts_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_ENABLED' LIMIT 1;
    IF shifts_enabled_val IS NULL THEN
        shifts_enabled_val := 'false';
    END IF;

    SELECT label INTO shifts_list_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_LIST' LIMIT 1;
    IF shifts_list_val IS NULL THEN
        shifts_list_val := '';
    END IF;

    SELECT label INTO min_hours_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MIN_HOURS' LIMIT 1;
    IF min_hours_val IS NULL THEN
        min_hours_val := '9';
    END IF;

    BEGIN
        checkout_offset_minutes := checkout_alert_offset_val::INT;
    EXCEPTION WHEN OTHERS THEN
        checkout_offset_minutes := 5;
    END;

    -- Loop through active profiles matching roles
    FOR profile_rec IN 
        SELECT id, full_name 
        FROM public.profiles 
        WHERE is_active = TRUE
          AND (
            checkout_alert_target_roles_val = 'BOTH' OR
            (checkout_alert_target_roles_val = 'ADMIN' AND role = 'ADMIN') OR
            (checkout_alert_target_roles_val = 'MEMBER' AND role != 'ADMIN')
          )
    LOOP
        -- Check if today is a working day for this user
        IF public.is_working_day_db(cur_date, profile_rec.id) THEN
            -- Check if user has checked in today and NOT checked out yet
            -- And MUST NOT be a provisional check-in entry
            SELECT * INTO log_rec FROM public.attendance_logs 
            WHERE user_id = profile_rec.id 
              AND date = cur_date 
              AND check_in_time IS NOT NULL
              AND check_out_time IS NULL
              AND COALESCE(note, '') NOT LIKE '%PROVISIONAL%'
              AND COALESCE(note, '') NOT LIKE '%จำลอง%'
            LIMIT 1;

            -- User has checked in but has not checked out yet, and log is not provisional
            IF log_rec.id IS NOT NULL THEN
                -- If we are filtering by target_shift_start
                IF shifts_enabled_val = 'true' AND target_shift_start IS NOT NULL THEN
                    mapped_shift := public.get_mapped_shift(log_rec.check_in_time, shifts_list_val);
                    IF mapped_shift <> target_shift_start THEN
                        -- Skip if this user does not belong to the target shift
                        CONTINUE;
                    END IF;
                    
                    -- Dynamic END_TIME for this shift: shift start + MIN_HOURS
                    BEGIN
                        end_time_parsed := mapped_shift + (min_hours_val::INT || ' hours')::INTERVAL;
                        display_time_str := left(end_time_parsed::text, 5);
                    EXCEPTION WHEN OTHERS THEN
                        display_time_str := end_time_val;
                    END;
                ELSE
                    -- If multiple shifts is disabled, or target_shift_start is NULL
                    -- Fallback to default END_TIME
                    display_time_str := end_time_val;
                END IF;

                -- Setup dynamic title & message
                IF checkout_alert_mode_val = 'BEFORE_LIMIT' THEN
                    notification_title := '⏰ ใกล้เวลาเลิกงานแล้วน้า อย่าลืมตอกบัตรออกนะคะ';
                    notification_message := 'อีก ' || checkout_offset_minutes || ' นาทีจะถึงเวลาเลิกงานแล้วนะคะ (' || display_time_str || ') อย่าลืมลงเวลาออกงาน (Check-Out) นะคะ เพื่อเซฟคะแนนและรักษาพลังชีวิต (HP) ของคุณค่ะ 😊';
                ELSE
                    notification_title := '⏰ เลิกงานแล้วนะคะ อย่าลืมตอกบัตรออกงานน้า';
                    notification_message := 'เลยเวลาเลิกงานของวันนี้แล้วค่ะ (' || display_time_str || ') ระบบยังไม่พบบันทึกเวลาออกงานของคุณ อย่าลืมเข้าแอปมาลงเวลาออกงาน (Check-Out) เพื่อความเรียบร้อยและรักษา HP กันน้า~ 💖';
                END IF;

                -- Check if user is on leave today
                SELECT EXISTS (
                    SELECT 1 FROM public.leave_requests 
                    WHERE user_id = profile_rec.id 
                      AND status = 'APPROVED'
                      AND start_date <= cur_date 
                      AND end_date >= cur_date
                ) INTO on_leave;

                IF NOT on_leave THEN
                    -- Check if we have already sent a checkout reminder today
                    IF NOT EXISTS (
                        SELECT 1 FROM public.notifications 
                        WHERE user_id = profile_rec.id 
                          AND type = 'OVERDUE' 
                          AND (title LIKE '%เลิกงาน%' OR title LIKE '%ออกงาน%' OR title LIKE '%Check-Out%')
                          AND created_at >= (cur_date::TIMESTAMP)
                    ) THEN
                        -- Insert notification
                        INSERT INTO public.notifications (
                            user_id,
                            type,
                            title,
                            message,
                            is_read,
                            link_path,
                            line_status
                        ) VALUES (
                            profile_rec.id,
                            'OVERDUE',
                            notification_title,
                            notification_message,
                            FALSE,
                            'ATTENDANCE',
                            NULL
                        );
                    END IF;
                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."checkout_reminder_cron"("target_shift_start" time without time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_user_screen_limits"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    active_count INT;
    max_screens INT := 2;
BEGIN
    -- 1. Automagic Cleanup of stale screens (older than 10 minutes of inactivity)
    -- This keeps the table incredibly small and lightweight automatically
    DELETE FROM public.user_screens 
    WHERE user_id = NEW.user_id 
      AND last_seen_at < (timezone('utc'::text, now()) - INTERVAL '10 minutes');

    -- 2. Strictly Enforce Maximum Concurrency Limit (2 screens)
    -- Only evaluate on INSERT (when a completely brand new tab connects)
    -- We do NOT count Updates/Heartbeats of already registered screen sessions
    IF NOT EXISTS (SELECT 1 FROM public.user_screens WHERE id = NEW.id) THEN
        SELECT COUNT(*) INTO active_count FROM public.user_screens WHERE user_id = NEW.user_id;
        
        -- If count is already at or above max_screens limit, delete the oldest active sessions first
        IF active_count >= max_screens THEN
            DELETE FROM public.user_screens
            WHERE id IN (
                SELECT id 
                FROM public.user_screens
                WHERE user_id = NEW.user_id
                ORDER BY created_at ASC
                LIMIT (active_count - max_screens + 1)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_user_screen_limits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_trg_on_content_analytics_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.content_id IS NOT NULL THEN
            PERFORM public.fn_update_content_analytics_status(OLD.content_id);
        END IF;
        RETURN OLD;
    ELSE
        IF NEW.content_id IS NOT NULL THEN
            PERFORM public.fn_update_content_analytics_status(NEW.content_id);
        END IF;
        IF TG_OP = 'UPDATE' AND OLD.content_id IS NOT NULL AND OLD.content_id <> NEW.content_id THEN
            PERFORM public.fn_update_content_analytics_status(OLD.content_id);
        END IF;
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."fn_trg_on_content_analytics_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_trg_on_contents_target_platform_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.fn_update_content_analytics_status(NEW.id);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.target_platform IS DISTINCT FROM NEW.target_platform THEN
            PERFORM public.fn_update_content_analytics_status(NEW.id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_trg_on_contents_target_platform_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_update_content_analytics_status"("p_content_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_target_platforms TEXT[];
    v_has_analytics BOOLEAN := FALSE;
    v_analytics_status TEXT := 'NONE';
    v_filled_platforms TEXT[] := ARRAY[]::TEXT[];
    v_platforms_count INT := 0;
    v_matched_count INT := 0;
    v_plat TEXT;
BEGIN
    -- 3.1 Fetch target platforms for this content, handling array, jsonb, or single string models
    SELECT 
        CASE 
            WHEN pg_typeof(target_platform) = 'text[]'::regtype THEN target_platform
            WHEN pg_typeof(target_platform) = 'jsonb'::regtype THEN 
                (SELECT ARRAY(SELECT jsonb_array_elements_text(target_platform)))
            ELSE ARRAY[target_platform::text]
        END
    INTO v_target_platforms
    FROM public.contents
    WHERE id = p_content_id;

    -- Standardize nulls or empty target arrays
    IF v_target_platforms IS NULL OR array_length(v_target_platforms, 1) IS NULL THEN
        v_target_platforms := ARRAY[]::TEXT[];
    END IF;

    -- Clean the array of empty elements/duplicates
    v_target_platforms := ARRAY(
        SELECT DISTINCT TRIM(e) 
        FROM unnest(v_target_platforms) e 
        WHERE e IS NOT NULL AND e <> ''
    );

    -- 3.2 Fetch all platforms that have actual analytics uploaded 
    SELECT ARRAY(
        SELECT DISTINCT TRIM(platform::text) 
        FROM public.content_analytics
        WHERE content_id = p_content_id AND platform IS NOT NULL AND platform <> ''
    )
    INTO v_filled_platforms;

    v_has_analytics := (array_length(v_filled_platforms, 1) > 0);

    -- 3.3 Status Determination Engine
    IF NOT v_has_analytics THEN
        v_analytics_status := 'NONE';
    ELSE
        v_platforms_count := array_length(v_target_platforms, 1);
        IF v_platforms_count IS NULL OR v_platforms_count = 0 THEN
            -- If no target platforms designated, presence of analytics indicates completeness
            v_analytics_status := 'COMPLETE';
        ELSE
            -- Gauge completeness of matching
            v_matched_count := 0;
            FOREACH v_plat IN ARRAY v_target_platforms
            LOOP
                IF EXISTS (
                    SELECT 1 
                    FROM unnest(v_filled_platforms) f 
                    WHERE UPPER(TRIM(f)) = UPPER(TRIM(v_plat))
                ) THEN
                    v_matched_count := v_matched_count + 1;
                END IF;
            END LOOP;

            IF v_matched_count = v_platforms_count THEN
                v_analytics_status := 'COMPLETE';
            ELSIF v_matched_count > 0 THEN
                v_analytics_status := 'PARTIAL';
            ELSE
                v_analytics_status := 'NONE';
            END IF;
        END IF;
    END IF;

    -- 3.4 Direct Write backfill update
    UPDATE public.contents
    SET 
        has_analytics = v_has_analytics,
        analytics_status = v_analytics_status
    WHERE id = p_content_id;
END;
$$;


ALTER FUNCTION "public"."fn_update_content_analytics_status"("p_content_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."forgot_checkout_penalty_cron"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    yesterday_date DATE;
    log_rec RECORD;
    has_exception_or_leave BOOLEAN;
    already_penalized BOOLEAN;
    hp_penalty INT := -10;
    rule_val JSONB;
    profile_rec RECORD;
    new_hp INT;
    is_death BOOLEAN;
    death_cnt INT;
    checkout_penalty_target_roles_val TEXT := 'BOTH';
    shifts_enabled_val TEXT := 'false';
    shifts_list_val TEXT := '';
    start_time_val TEXT := '09:00';
    mapped_shift_val TEXT := '09:00';
BEGIN
    -- Determine yesterday's date in Thailand timezone to remain server-independent
    yesterday_date := (timezone('Asia/Bangkok'::text, now()) - '1 day'::interval)::DATE;

    -- Fetch penalty amount from game_configs (key = 'ATTENDANCE_RULES', path 'FORGOT_CHECKOUT', 'hp')
    BEGIN
        SELECT value::JSONB INTO rule_val FROM public.game_configs WHERE key = 'ATTENDANCE_RULES' LIMIT 1;
        IF rule_val IS NOT NULL AND rule_val ? 'FORGOT_CHECKOUT' AND (rule_val->'FORGOT_CHECKOUT') ? 'hp' THEN
            hp_penalty := (rule_val->'FORGOT_CHECKOUT'->>'hp')::INT;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        hp_penalty := -10;
    END;

    -- Fetch target roles from master_options
    SELECT label INTO checkout_penalty_target_roles_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_PENALTY_TARGET_ROLES' LIMIT 1;
    IF checkout_penalty_target_roles_val IS NULL THEN
        checkout_penalty_target_roles_val := 'BOTH';
    END IF;

    -- Fetch MULTIPLE_SHIFTS_ENABLED, list, and START_TIME
    SELECT label INTO shifts_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_ENABLED' LIMIT 1;
    IF shifts_enabled_val IS NULL THEN
        shifts_enabled_val := 'false';
    END IF;

    SELECT label INTO shifts_list_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_LIST' LIMIT 1;
    IF shifts_list_val IS NULL THEN
        shifts_list_val := '';
    END IF;

    SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
    IF start_time_val IS NULL THEN
        start_time_val := '09:00';
    END IF;

    -- Loop through attendance logs from yesterday that are still WORKING and don't have check-out time
    FOR log_rec IN
        SELECT al.id, al.user_id, al.note, al.check_in_time
        FROM public.attendance_logs al
        JOIN public.profiles p ON p.id = al.user_id
        WHERE al.date = yesterday_date
          AND al.status = 'WORKING'
          AND al.check_out_time IS NULL
          AND p.is_active = TRUE
          AND (
            checkout_penalty_target_roles_val = 'BOTH' OR
            (checkout_penalty_target_roles_val = 'ADMIN' AND p.role = 'ADMIN') OR
            (checkout_penalty_target_roles_val = 'MEMBER' AND p.role != 'ADMIN')
          )
    LOOP
        -- 1. Check if there is a pending or approved leave/correction request for yesterday_date
        SELECT EXISTS (
            SELECT 1 FROM public.leave_requests
            WHERE user_id = log_rec.user_id
              AND (status = 'PENDING' OR status = 'APPROVED')
              AND start_date <= yesterday_date
              AND end_date >= yesterday_date
        ) INTO has_exception_or_leave;

        IF NOT has_exception_or_leave THEN
            -- 2. Check if we already penalized them for this specific date in game_logs to maintain idempotency
            SELECT EXISTS (
                SELECT 1 FROM public.game_logs
                WHERE user_id = log_rec.user_id
                  AND action_type = 'ATTENDANCE_FORGOT_CHECKOUT'
                  AND (related_id = log_rec.id OR description LIKE '%' || yesterday_date::TEXT || '%')
            ) INTO already_penalized;

            IF NOT already_penalized THEN
                -- A. Update attendance log status to 'ACTION_REQUIRED'
                UPDATE public.attendance_logs
                SET status = 'ACTION_REQUIRED',
                    note = CASE 
                        WHEN note IS NULL OR note = '' THEN '[SYSTEM] Penalized for forgotten checkout'
                        ELSE note || E'\n[SYSTEM] Penalized for forgotten checkout'
                    END
                WHERE id = log_rec.id;

                -- B. Fetch current user profiles state and apply HP change
                SELECT hp, max_hp, death_count INTO profile_rec 
                FROM public.profiles 
                WHERE id = log_rec.user_id;

                IF profile_rec IS NOT NULL THEN
                    new_hp := profile_rec.hp + hp_penalty;
                    IF new_hp > profile_rec.max_hp THEN
                        new_hp := profile_rec.max_hp;
                    END IF;
                    
                    is_death := (profile_rec.hp > 0 AND new_hp <= 0);
                    death_cnt := profile_rec.death_count;
                    IF is_death THEN
                        death_cnt := death_cnt + 1;
                    END IF;

                    -- Update Profile
                    UPDATE public.profiles
                    SET hp = new_hp,
                        death_count = death_cnt
                    WHERE id = log_rec.user_id;

                    -- If they died, trigger LEVEL_DOWN / Death Log
                    IF is_death THEN
                        INSERT INTO public.game_logs (
                            user_id,
                            action_type,
                            xp_change,
                            hp_change,
                            jp_change,
                            description
                        ) VALUES (
                            log_rec.user_id,
                            'LEVEL_DOWN',
                            0,
                            0,
                            0,
                            '💀 คุณพ่ายแพ้เนื่องจากค่าพลังชีวิต (HP) หมดลงจากบทลงโทษลืมตอกบัตรออก'
                        );
                    END IF;
                END IF;

                -- Determine shift time for metadata
                IF shifts_enabled_val = 'true' AND shifts_list_val <> '' AND log_rec.check_in_time IS NOT NULL THEN
                    mapped_shift_val := left(public.get_mapped_shift(log_rec.check_in_time, shifts_list_val)::text, 5);
                ELSE
                    mapped_shift_val := start_time_val;
                END IF;

                -- C. Insert Game Log (Triggers real-time notification/Toast on client)
                INSERT INTO public.game_logs (
                    user_id,
                    action_type,
                    xp_change,
                    hp_change,
                    jp_change,
                    description,
                    related_id
                ) VALUES (
                    log_rec.user_id,
                    'ATTENDANCE_FORGOT_CHECKOUT',
                    0,
                    hp_penalty,
                    0,
                    'ลืมตอกบัตรออกของวันที่ ' || yesterday_date::TEXT || ' ระบบได้ทำการหักคะแนนอัตโนมัติ',
                    log_rec.id
                );

                -- D. Insert Notification (Explicit Orange Theme / Overdue notification)
                -- Line_status is set to NULL to automatically trigger Line push notification webhook
                INSERT INTO public.notifications (
                    user_id,
                    type,
                    title,
                    message,
                    is_read,
                    link_path,
                    metadata,
                    line_status
                ) VALUES (
                    log_rec.user_id,
                    'OVERDUE',
                    '🛠️ แจ้งเตือน: ลืมบันทึกเวลาออกงานเมื่อวาน!',
                    'ระบบพบบันทึกเวลาของวันที่ ' || yesterday_date::TEXT || ' ค้างโดยไม่มีเวลาออก กรุณาส่งคำขอแก้ไขเวลา (Forgot Checkout) ภายในวันนี้ เพื่อรักษาแต้มและกู้คืน HP ของคุณกลับมานะครับ',
                    FALSE,
                    'ATTENDANCE',
                    jsonb_build_object(
                        'target_date', yesterday_date::TEXT,
                        'target_shift_time', mapped_shift_val,
                        'is_penalty_alert', true
                    ),
                    NULL
                );
            END IF;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."forgot_checkout_penalty_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_daily_attendance_summary"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    cur_date DATE;
    start_time_val TEXT;
    late_buffer_val TEXT;
    destination_val TEXT;
    start_time_parsed TIME;
    late_buffer_minutes INT;
    late_cutoff_time TIME;
    
    -- Multiple Shifts configuration
    shifts_enabled_val TEXT;
    shifts_list_val TEXT;
    is_shifts_enabled BOOLEAN := FALSE;
    last_shift_time TIME;
    late_minutes_val INT;
    
    -- Summary counts
    ontime_count INT := 0;
    late_count INT := 0;
    leave_count INT := 0;
    absent_count INT := 0;
    
    -- Summary list texts
    ontime_list TEXT := '';
    late_list TEXT := '';
    leave_list TEXT := '';
    absent_list TEXT := '';
    
    profile_rec RECORD;
    log_rec RECORD;
    has_log BOOLEAN;
    on_leave BOOLEAN;
    leave_type_label TEXT;
    is_half_day_val BOOLEAN := FALSE;
    half_day_session_val TEXT;
    checkin_time_local TIME;
    admin_user_id UUID;
    app_name_val TEXT;
    message_content TEXT;
BEGIN
    -- Determine current date in Thailand (Asia/Bangkok timezone) to remain server-independent
    cur_date := (timezone('Asia/Bangkok'::text, now()))::DATE;

    -- Fetch config values from master_options
    SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
    SELECT label INTO late_buffer_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_BUFFER' LIMIT 1;
    SELECT label INTO destination_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LINE_SUMMARY_DESTINATION' LIMIT 1;

    -- Fetch company / system name from master_options (or default)
    SELECT label INTO app_name_val 
    FROM public.master_options 
    WHERE key IN ('COMPANY_NAME', 'SYSTEM_NAME', 'APP_NAME') 
      AND label IS NOT NULL AND label != '' 
    ORDER BY CASE key 
        WHEN 'COMPANY_NAME' THEN 1 
        WHEN 'SYSTEM_NAME' THEN 2 
        WHEN 'APP_NAME' THEN 3 
        ELSE 4 END 
    LIMIT 1;

    IF app_name_val IS NULL OR app_name_val = '' THEN
        app_name_val := 'Juijui Planner';
    END IF;

    -- Fallbacks
    IF start_time_val IS NULL THEN start_time_val := '10:00'; END IF;
    IF late_buffer_val IS NULL THEN late_buffer_val := '15'; END IF;
    
    -- If destination is empty, do not run summary to avoid spam/errors
    IF destination_val IS NULL OR destination_val = '' THEN
        RAISE NOTICE 'LINE_SUMMARY_DESTINATION is empty. Skipping daily attendance summary.';
        RETURN;
    END IF;

    -- Parse start_time and late_buffer
    BEGIN
        start_time_parsed := start_time_val::TIME;
    EXCEPTION WHEN OTHERS THEN
        start_time_parsed := '10:00'::TIME;
    END;

    BEGIN
        late_buffer_minutes := late_buffer_val::INT;
    EXCEPTION WHEN OTHERS THEN
        late_buffer_minutes := 15;
    END;

    late_cutoff_time := start_time_parsed + (late_buffer_minutes || ' minutes')::INTERVAL;

    -- Fetch multiple shifts settings
    SELECT label INTO shifts_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_ENABLED' LIMIT 1;
    SELECT label INTO shifts_list_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_LIST' LIMIT 1;

    IF shifts_enabled_val = 'true' THEN
        is_shifts_enabled := TRUE;
    END IF;

    IF is_shifts_enabled AND shifts_list_val IS NOT NULL AND shifts_list_val != '' THEN
        BEGIN
            SELECT MAX(trimmed_time::TIME)
            INTO last_shift_time
            FROM (
                SELECT TRIM(val) as trimmed_time
                FROM regexp_split_to_table(shifts_list_val, ',') as val
            ) s
            WHERE s.trimmed_time ~ '^[0-2]?[0-9]:[0-5][0-9]$' OR s.trimmed_time ~ '^[0-2]?[0-9]:[0-5][0-9]:[0-5][0-9]$';
        EXCEPTION WHEN OTHERS THEN
            last_shift_time := NULL;
        END;
    END IF;

    IF last_shift_time IS NULL THEN
        last_shift_time := start_time_parsed;
    END IF;

    -- Fetch an active ADMIN user ID to satisfy foreign key user_id on notifications
    SELECT id INTO admin_user_id FROM public.profiles WHERE is_active = TRUE AND role = 'ADMIN' LIMIT 1;
    -- If no ADMIN, get any active user
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM public.profiles WHERE is_active = TRUE LIMIT 1;
    END IF;
    -- If still NULL, return
    IF admin_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Loop through active users (exclude ADMIN from attendance tracking)
    FOR profile_rec IN 
        SELECT id, full_name, phone_number 
        FROM public.profiles 
        WHERE is_active = TRUE AND role != 'ADMIN'
        ORDER BY full_name ASC
    LOOP
        -- Check if today is a working day for this user
        IF public.is_working_day_db(cur_date, profile_rec.id) THEN
            -- Check leave request for today (APPROVED or pending if we want, but approved is standard)
            SELECT EXISTS (
                SELECT 1 FROM public.leave_requests 
                WHERE user_id = profile_rec.id 
                  AND status = 'APPROVED'
                  AND start_date <= cur_date 
                  AND end_date >= cur_date
                  AND type IN ('SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'UNPAID')
            ) INTO on_leave;

            -- Get leave type label if on leave
            IF on_leave THEN
                SELECT 
                    COALESCE(mo.label, lr.type),
                    lr.is_half_day,
                    lr.half_day_session
                INTO 
                    leave_type_label,
                    is_half_day_val,
                    half_day_session_val
                FROM public.leave_requests lr
                LEFT JOIN public.master_options mo ON mo.type = 'LEAVE_TYPE' AND mo.key = lr.type
                WHERE lr.user_id = profile_rec.id 
                  AND lr.status = 'APPROVED'
                  AND lr.start_date <= cur_date 
                  AND lr.end_date >= cur_date
                  AND lr.type IN ('SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'UNPAID')
                LIMIT 1;

                IF leave_type_label IS NULL OR leave_type_label = '' THEN
                    leave_type_label := 'ลาพักผ่อน/อื่นๆ';
                END IF;

                -- ตรวจสอบเงื่อนไขการลาครึ่งวันเพื่อใส่รายละเอียดเพิ่มเติม
                IF is_half_day_val = TRUE THEN
                    IF half_day_session_val = 'AM' THEN
                        leave_type_label := leave_type_label || ' ครึ่งวันเช้า';
                    ELSIF half_day_session_val = 'PM' THEN
                        leave_type_label := leave_type_label || ' ครึ่งวันบ่าย';
                    ELSE
                        leave_type_label := leave_type_label || ' ครึ่งวัน';
                    END IF;
                END IF;

                leave_count := leave_count + 1;
                IF leave_list = '' THEN
                    leave_list := '• ' || profile_rec.full_name || ' (' || leave_type_label || ')';
                ELSE
                    leave_list := leave_list || E'\n• ' || profile_rec.full_name || ' (' || leave_type_label || ')';
                END IF;
            ELSE
                -- Check check-in log
                SELECT * INTO log_rec 
                FROM public.attendance_logs 
                WHERE user_id = profile_rec.id 
                  AND date = cur_date 
                LIMIT 1;

                IF log_rec.id IS NOT NULL AND log_rec.check_in_time IS NOT NULL THEN
                    -- User checked in! Truncate seconds to minute precision so 08:00:00 - 08:00:59 is treated as 08:00:00 (On Time)
                    checkin_time_local := (date_trunc('minute', log_rec.check_in_time AT TIME ZONE 'Asia/Bangkok'))::TIME;
                    
                    IF is_shifts_enabled THEN
                        -- Multiple Shifts is ON: Check against last shift time without buffer
                        IF checkin_time_local <= last_shift_time THEN
                            -- On-time
                            ontime_count := ontime_count + 1;
                            IF ontime_list = '' THEN
                                ontime_list := '• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น.)';
                            ELSE
                                ontime_list := ontime_list || E'\n• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น.)';
                            END IF;
                        ELSE
                            -- Late
                            late_count := late_count + 1;
                            
                            -- Calculate late minutes (difference between checkin_time_local and last_shift_time)
                            late_minutes_val := EXTRACT(EPOCH FROM (checkin_time_local - last_shift_time))::INT / 60;
                            IF late_minutes_val < 1 THEN late_minutes_val := 1; END IF;
                            
                            IF late_list = '' THEN
                                late_list := '• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น. - สาย ' || late_minutes_val || ' นาที)';
                            ELSE
                                late_list := late_list || E'\n• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น. - สาย ' || late_minutes_val || ' นาที)';
                            END IF;
                        END IF;
                    ELSE
                        -- Multiple Shifts is OFF: Same as before (using late_cutoff_time)
                        IF checkin_time_local <= late_cutoff_time THEN
                            -- On-time
                            ontime_count := ontime_count + 1;
                            IF ontime_list = '' THEN
                                ontime_list := '• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น.)';
                            ELSE
                                ontime_list := ontime_list || E'\n• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น.)';
                            END IF;
                        ELSE
                            -- Late
                            late_count := late_count + 1;
                            late_minutes_val := EXTRACT(EPOCH FROM (checkin_time_local - start_time_parsed))::INT / 60;
                            IF late_minutes_val < 1 THEN late_minutes_val := 1; END IF;
                            IF late_list = '' THEN
                                late_list := '• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น. - สาย ' || late_minutes_val || ' นาที)';
                            ELSE
                                late_list := late_list || E'\n• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น. - สาย ' || late_minutes_val || ' นาที)';
                            END IF;
                        END IF;
                    END IF;
                ELSE
                    -- Absent
                    absent_count := absent_count + 1;
                    
                    DECLARE
                        phone_suffix TEXT := '';
                    BEGIN
                        IF profile_rec.phone_number IS NOT NULL AND profile_rec.phone_number != '' THEN
                            phone_suffix := ' (โทร. ' || profile_rec.phone_number || ') 📞';
                        ELSE
                            phone_suffix := ' (ไม่ระบุเบอร์)';
                        END IF;

                        IF absent_list = '' THEN
                            absent_list := '• ' || profile_rec.full_name || phone_suffix;
                        ELSE
                            absent_list := absent_list || E'\n• ' || profile_rec.full_name || phone_suffix;
                        END IF;
                    END;
                END IF;
            END IF;
        END IF;
    END LOOP;

    -- Format lists with defaults if empty
    IF ontime_list = '' THEN ontime_list := '  (ไม่มี)'; END IF;
    IF late_list = '' THEN late_list := '  (ไม่มี)'; END IF;
    IF leave_list = '' THEN leave_list := '  (ไม่มี)'; END IF;
    IF absent_list = '' THEN absent_list := '  (ไม่มี)'; END IF;

    -- หากไม่มีพนักงานที่ต้องเข้างานในวันนี้เลย (ผลรวมเป็น 0) ให้หยุดการทำงานทันทีเพื่อไม่ให้มีสรุปส่งเข้ากลุ่ม LINE
    IF (ontime_count + late_count + leave_count + absent_count) = 0 THEN
        RAISE NOTICE 'ไม่มีพนักงานที่ต้องเข้างานในวันนี้ ข้ามการส่งรายงานสรุป';
        RETURN;
    END IF;

    -- Construct message
    message_content := '📊 สรุปรายงานการเข้างานประจำวันที่ ' || to_char(cur_date, 'DD/MM/YYYY') || E'\n\n' ||
                       '🟢 มาปกติ (' || ontime_count::TEXT || E' คน):\n' || ontime_list || E'\n\n' ||
                       '🟡 มาสาย (' || late_count::TEXT || E' คน):\n' || late_list || E'\n\n' ||
                       '🔵 ลา (' || leave_count::TEXT || E' คน):\n' || leave_list || E'\n\n' ||
                       '🔴 ขาดงาน / ยังไม่เช็คอิน (' || absent_count::TEXT || E' คน):\n' || absent_list || E'\n\n' ||
                       'ระบบสรุปรายงานอัตโนมัติ ' || app_name_val;

    -- Insert into notifications with type = 'DAILY_SUMMARY'
    -- This will trigger the Edge Function webhook automatically
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        is_read,
        link_path,
        line_status
    ) VALUES (
        admin_user_id,
        'DAILY_SUMMARY',
        '📊 รายงานการเข้างานประจำวันที่ ' || to_char(cur_date, 'DD/MM/YYYY'),
        message_content,
        FALSE,
        'ATTENDANCE',
        NULL -- Webhook triggers when line_status IS NULL
    );
END;
$_$;


ALTER FUNCTION "public"."generate_daily_attendance_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_monthly_bonus_summary"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    summary_mode TEXT := 'PREV_MONTH';
    summary_start_date DATE;
    summary_end_date DATE;
    cur_day DATE;
    profile_rec RECORD;
    total_employees INT := 0;
    eligible_count INT := 0;
    
    is_working BOOLEAN;
    log_rec RECORD;
    leave_type_val TEXT;
    checkin_time_local TIME;
    
    -- Per-user counters
    user_ontime_days INT;
    user_vacation_days INT;
    user_late_days INT;
    user_other_leave_days INT;
    user_absent_days INT;
    
    is_eligible BOOLEAN;
    
    -- Master config
    start_time_val TEXT;
    late_buffer_val TEXT;
    start_time_parsed TIME;
    late_buffer_minutes INT;
    late_cutoff_time TIME;
    
    admin_user_id UUID;
    app_name_val TEXT;
    destination_val TEXT;
    
    -- For JSON metadata
    eligible_users_json JSONB := '[]'::jsonb;
    user_detail_json JSONB;
    
    -- Message
    month_name_val TEXT;
    year_name_val INT;
    message_text TEXT := '';
    eligible_list_text TEXT := '';
    metadata_val JSONB;
BEGIN
    -- Fetch config values from master_options
    SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
    SELECT label INTO late_buffer_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_BUFFER' LIMIT 1;
    SELECT label INTO destination_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LINE_SUMMARY_DESTINATION' LIMIT 1;
    SELECT label INTO summary_mode FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_SUMMARY_MODE' LIMIT 1;

    -- Fallbacks
    IF summary_mode IS NULL OR summary_mode = '' THEN
        summary_mode := 'PREV_MONTH';
    END IF;

    -- Determine start and end dates based on summary_mode
    IF summary_mode = 'CURRENT_MONTH' THEN
        summary_start_date := (date_trunc('month', timezone('Asia/Bangkok', now())))::date;
        summary_end_date := (timezone('Asia/Bangkok', now()))::date;
    ELSE
        summary_start_date := (date_trunc('month', timezone('Asia/Bangkok', now()) - interval '1 month'))::date;
        summary_end_date := (date_trunc('month', timezone('Asia/Bangkok', now())) - interval '1 day')::date;
    END IF;

    -- If destination is empty, do not run to avoid spam or unnecessary processing
    IF destination_val IS NULL OR destination_val = '' THEN
        RAISE NOTICE 'LINE_SUMMARY_DESTINATION is empty. Skipping monthly bonus summary.';
        RETURN;
    END IF;

    -- Fetch company / system name from master_options
    SELECT label INTO app_name_val 
    FROM public.master_options 
    WHERE key IN ('COMPANY_NAME', 'SYSTEM_NAME', 'APP_NAME') 
      AND label IS NOT NULL AND label != '' 
    ORDER BY CASE key 
        WHEN 'COMPANY_NAME' THEN 1 
        WHEN 'SYSTEM_NAME' THEN 2 
        WHEN 'APP_NAME' THEN 3 
        ELSE 4 END 
    LIMIT 1;

    IF app_name_val IS NULL OR app_name_val = '' THEN
        app_name_val := 'Juijui Planner';
    END IF;

    -- Fallbacks
    IF start_time_val IS NULL THEN start_time_val := '10:00'; END IF;
    IF late_buffer_val IS NULL THEN late_buffer_val := '15'; END IF;

    -- Parse start_time and late_buffer
    BEGIN
        start_time_parsed := start_time_val::TIME;
    EXCEPTION WHEN OTHERS THEN
        start_time_parsed := '10:00'::TIME;
    END;

    BEGIN
        late_buffer_minutes := late_buffer_val::INT;
    EXCEPTION WHEN OTHERS THEN
        late_buffer_minutes := 15;
    END;

    late_cutoff_time := start_time_parsed + (late_buffer_minutes || ' minutes')::INTERVAL;

    -- Fetch an active ADMIN user ID to satisfy foreign key user_id on notifications
    SELECT id INTO admin_user_id FROM public.profiles WHERE is_active = TRUE AND role = 'ADMIN' LIMIT 1;
    -- If no ADMIN, get any active user
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM public.profiles WHERE is_active = TRUE LIMIT 1;
    END IF;
    -- If still NULL, return
    IF admin_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Calculate Thai month and year names
    month_name_val := CASE EXTRACT(MONTH FROM summary_start_date)
        WHEN 1 THEN 'มกราคม'
        WHEN 2 THEN 'กุมภาพันธ์'
        WHEN 3 THEN 'มีนาคม'
        WHEN 4 THEN 'เมษายน'
        WHEN 5 THEN 'พฤษภาคม'
        WHEN 6 THEN 'มิถุนายน'
        WHEN 7 THEN 'กรกฎาคม'
        WHEN 8 THEN 'สิงหาคม'
        WHEN 9 THEN 'กันยายน'
        WHEN 10 THEN 'ตุลาคม'
        WHEN 11 THEN 'พฤศจิกายน'
        WHEN 12 THEN 'ธันวาคม'
    END;
    year_name_val := EXTRACT(YEAR FROM summary_start_date) + 543;

    -- Loop through active users (exclude ADMIN from attendance tracking)
    FOR profile_rec IN 
        SELECT id, full_name, COALESCE(position, 'ฝ่ายผลิต') as position
        FROM public.profiles 
        WHERE is_active = TRUE AND role != 'ADMIN'
        ORDER BY full_name ASC
    LOOP
        total_employees := total_employees + 1;
        is_eligible := TRUE;
        user_ontime_days := 0;
        user_vacation_days := 0;
        user_late_days := 0;
        user_other_leave_days := 0;
        user_absent_days := 0;

        -- Loop day-by-day from summary_start_date to summary_end_date
        cur_day := summary_start_date;
        WHILE cur_day <= summary_end_date LOOP
            IF public.is_working_day_db(cur_day, profile_rec.id) THEN
                -- Check approved leave request on cur_day
                SELECT type INTO leave_type_val
                FROM public.leave_requests
                WHERE user_id = profile_rec.id
                  AND status = 'APPROVED'
                  AND start_date <= cur_day
                  AND end_date >= cur_day
                LIMIT 1;

                IF leave_type_val IS NOT NULL THEN
                    IF leave_type_val = 'VACATION' THEN
                        user_vacation_days := user_vacation_days + 1;
                    ELSIF leave_type_val = 'WFH' OR leave_type_val = 'ONSITE' THEN
                        user_ontime_days := user_ontime_days + 1;
                    ELSE
                        user_other_leave_days := user_other_leave_days + 1;
                        is_eligible := FALSE;
                    END IF;
                ELSE
                    -- Check check-in log
                    SELECT * INTO log_rec
                    FROM public.attendance_logs
                    WHERE user_id = profile_rec.id
                      AND date = cur_day
                    LIMIT 1;

                    IF log_rec.id IS NOT NULL AND log_rec.check_in_time IS NOT NULL THEN
                        checkin_time_local := (log_rec.check_in_time AT TIME ZONE 'Asia/Bangkok')::TIME;
                        IF checkin_time_local <= late_cutoff_time THEN
                            user_ontime_days := user_ontime_days + 1;
                        ELSE
                            user_late_days := user_late_days + 1;
                            is_eligible := FALSE;
                        END IF;
                    ELSE
                        user_absent_days := user_absent_days + 1;
                        is_eligible := FALSE;
                    END IF;
                END IF;
            END IF;
            cur_day := cur_day + 1;
        END LOOP;

        IF is_eligible THEN
            eligible_count := eligible_count + 1;
            
            user_detail_json := jsonb_build_object(
                'full_name', profile_rec.full_name,
                'position', profile_rec.position,
                'ontime_days', user_ontime_days,
                'vacation_days', user_vacation_days,
                'late_days', user_late_days,
                'other_leave_days', user_other_leave_days,
                'absent_days', user_absent_days
            );
            eligible_users_json := eligible_users_json || user_detail_json;

            eligible_list_text := eligible_list_text || E'\n🥇 ' || profile_rec.full_name || 
                                  ' (' || profile_rec.position || ')' ||
                                  E'\n   [ ตรงเวลา: ' || user_ontime_days || E' วัน | ลาพักร้อน: ' || user_vacation_days || E' วัน | สาย: 0 | ขาด: 0 ]\n';
        END IF;
    END LOOP;

    -- Build fallback message
    IF eligible_list_text = '' THEN
        eligible_list_text := E'\n  (ไม่มีพนักงานผ่านเกณฑ์สำหรับเดือนนี้)\n';
    END IF;

    IF summary_mode = 'CURRENT_MONTH' THEN
        message_text := '🏆 สรุปรายชื่อพนักงานได้รับเบี้ยขยัน (ช่วงวันที่ 1 ถึง ' || EXTRACT(DAY FROM summary_end_date)::TEXT || ' ' || month_name_val || ' ' || year_name_val::TEXT || ')' || E'\n\n' ||
                        '👑 สรุปผลงานระดับเหรียญทองเกียรติยศ (Perfect Attendance)' || E'\n' ||
                        'พนักงานที่มีวินัยดีเยี่ยม ไม่ขาด ไม่สาย ไม่ลากิจ/ลาป่วย ตั้งแต่วันที่ 1 ถึง ' || EXTRACT(DAY FROM summary_end_date)::TEXT || E'\n\n' ||
                        '📊 ภาพรวมช่วงเวลานี้:' || E'\n' ||
                        '- พนักงานทั้งหมด: ' || total_employees || ' คน' || E'\n' ||
                        '- ผ่านเกณฑ์ได้รับเบี้ยขยัน: ' || eligible_count || ' คน (' || 
                        CASE WHEN total_employees > 0 THEN ROUND((eligible_count::NUMERIC / total_employees::NUMERIC) * 100)::TEXT ELSE '0' END || '%)' || E'\n\n' ||
                        '---------------------------------------------------------' || E'\n' ||
                        '📋 รายชื่อพนักงานที่ได้รับสิทธิ์:' || E'\n' ||
                        eligible_list_text || E'\n' ||
                        '---------------------------------------------------------' || E'\n' ||
                        '💡 หมายเหตุ: ระบบประมวลผลข้อมูลอัตโนมัติ ณ วันที่ ' || to_char(timezone('Asia/Bangkok'::text, now()), 'DD/MM/YYYY') || E'\n\n' ||
                        'แอปพลิเคชัน ' || app_name_val;
    ELSE
        message_text := '🏆 สรุปรายชื่อพนักงานได้รับเบี้ยขยัน (ประจำเดือน' || month_name_val || ' ' || year_name_val::TEXT || ')' || E'\n\n' ||
                        '👑 สรุปผลงานระดับเหรียญทองเกียรติยศ (Perfect Attendance)' || E'\n' ||
                        'พนักงานที่มีวินัยดีเยี่ยม ไม่ขาด ไม่สาย ไม่ลากิจ/ลาป่วย ตลอดทั้งเดือน' || E'\n\n' ||
                        '📊 ภาพรวมเดือนนี้:' || E'\n' ||
                        '- พนักงานทั้งหมด: ' || total_employees || ' คน' || E'\n' ||
                        '- ผ่านเกณฑ์ได้รับเบี้ยขยัน: ' || eligible_count || ' คน (' || 
                        CASE WHEN total_employees > 0 THEN ROUND((eligible_count::NUMERIC / total_employees::NUMERIC) * 100)::TEXT ELSE '0' END || '%)' || E'\n\n' ||
                        '---------------------------------------------------------' || E'\n' ||
                        '📋 รายชื่อพนักงานที่ได้รับสิทธิ์:' || E'\n' ||
                        eligible_list_text || E'\n' ||
                        '---------------------------------------------------------' || E'\n' ||
                        '💡 หมายเหตุ: ระบบประมวลผลข้อมูลอัตโนมัติ ณ วันที่ ' || to_char(timezone('Asia/Bangkok'::text, now()), 'DD/MM/YYYY') || E'\n\n' ||
                        'แอปพลิเคชัน ' || app_name_val;
    END IF;

    -- Build metadata json
    metadata_val := jsonb_build_object(
        'month_name', month_name_val,
        'year_name', year_name_val::TEXT,
        'total_employees', total_employees,
        'eligible_count', eligible_count,
        'eligible_percentage', CASE WHEN total_employees > 0 THEN ROUND((eligible_count::NUMERIC / total_employees::NUMERIC) * 100) ELSE 0 END,
        'eligible_users', eligible_users_json,
        'summary_mode', summary_mode,
        'summary_start_date', summary_start_date::TEXT,
        'summary_end_date', summary_end_date::TEXT
    );

    -- Insert into notifications with type = 'MONTHLY_BONUS_SUMMARY'
    -- This will trigger the Edge Function webhook automatically
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        is_read,
        link_path,
        line_status,
        metadata
    ) VALUES (
        admin_user_id,
        'MONTHLY_BONUS_SUMMARY',
        CASE WHEN summary_mode = 'CURRENT_MONTH' THEN '🏆 สรุปสิทธิ์เบี้ยขยันสะสมตั้งแต่วันที่ 1 ถึง ' || EXTRACT(DAY FROM summary_end_date)::TEXT || ' ' || month_name_val || ' ' || year_name_val::TEXT ELSE '🏆 สรุปสิทธิ์เบี้ยขยันประจำเดือน' || month_name_val || ' ' || year_name_val::TEXT END,
        message_text,
        FALSE,
        'ATTENDANCE',
        NULL,
        metadata_val
    );
END;
$$;


ALTER FUNCTION "public"."generate_monthly_bonus_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_monthly_ot_summary"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    summary_mode TEXT := 'PREV_MONTH';
    summary_start_date DATE;
    summary_end_date DATE;
    profile_rec RECORD;
    total_employees INT := 0;
    has_ot_count INT := 0;
    
    -- Accumulators per user
    user_fixed_ot_count INT;
    user_weekday_ot_hours NUMERIC(6,2);
    user_holiday_ot_hours NUMERIC(6,2);
    user_holiday_overtime_hours NUMERIC(6,2);
    user_total_hours NUMERIC(6,2);
    
    admin_user_id UUID;
    app_name_val TEXT;
    destination_val TEXT;
    
    -- For JSON metadata
    ot_users_json JSONB := '[]'::jsonb;
    user_detail_json JSONB;
    
    -- Message
    month_name_val TEXT;
    year_name_val INT;
    message_text TEXT := '';
    ot_list_text TEXT := '';
    metadata_val JSONB;
BEGIN
    -- Fetch config values from master_options
    SELECT label INTO destination_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LINE_SUMMARY_DESTINATION' LIMIT 1;
    SELECT label INTO summary_mode FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_OT_SUMMARY_MODE' LIMIT 1;

    -- Fallbacks
    IF summary_mode IS NULL OR summary_mode = '' THEN
        summary_mode := 'PREV_MONTH';
    END IF;

    -- Determine start and end dates based on summary_mode
    IF summary_mode = 'CURRENT_MONTH' THEN
        summary_start_date := (date_trunc('month', timezone('Asia/Bangkok', now())))::date;
        summary_end_date := (timezone('Asia/Bangkok', now()))::date;
    ELSE
        summary_start_date := (date_trunc('month', timezone('Asia/Bangkok', now()) - interval '1 month'))::date;
        summary_end_date := (date_trunc('month', timezone('Asia/Bangkok', now())) - interval '1 day')::date;
    END IF;

    -- If destination is empty, do not run to avoid spam or unnecessary processing
    IF destination_val IS NULL OR destination_val = '' THEN
        RAISE NOTICE 'LINE_SUMMARY_DESTINATION is empty. Skipping monthly OT summary.';
        RETURN;
    END IF;

    -- Fetch company / system name from master_options
    SELECT label INTO app_name_val 
    FROM public.master_options 
    WHERE key IN ('COMPANY_NAME', 'SYSTEM_NAME', 'APP_NAME') 
      AND label IS NOT NULL AND label != '' 
    ORDER BY CASE key 
        WHEN 'COMPANY_NAME' THEN 1 
        WHEN 'SYSTEM_NAME' THEN 2 
        WHEN 'APP_NAME' THEN 3 
        ELSE 4 END 
    LIMIT 1;

    IF app_name_val IS NULL OR app_name_val = '' THEN
        app_name_val := 'Juijui Planner';
    END IF;

    -- Fetch an active ADMIN user ID to satisfy foreign key user_id on notifications
    SELECT id INTO admin_user_id FROM public.profiles WHERE is_active = TRUE AND role = 'ADMIN' LIMIT 1;
    -- If no ADMIN, get any active user
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM public.profiles WHERE is_active = TRUE LIMIT 1;
    END IF;
    -- If still NULL, return
    IF admin_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Calculate Thai month and year names
    month_name_val := CASE EXTRACT(MONTH FROM summary_start_date)
        WHEN 1 THEN 'มกราคม'
        WHEN 2 THEN 'กุมภาพันธ์'
        WHEN 3 THEN 'มีนาคม'
        WHEN 4 THEN 'เมษายน'
        WHEN 5 THEN 'พฤษภาคม'
        WHEN 6 THEN 'มิถุนายน'
        WHEN 7 THEN 'กรกฎาคม'
        WHEN 8 THEN 'สิงหาคม'
        WHEN 9 THEN 'กันยายน'
        WHEN 10 THEN 'ตุลาคม'
        WHEN 11 THEN 'พฤศจิกายน'
        WHEN 12 THEN 'ธันวาคม'
    END;
    year_name_val := EXTRACT(YEAR FROM summary_start_date) + 543;

    -- Loop through active users (exclude ADMIN from summary)
    FOR profile_rec IN 
        SELECT id, full_name, COALESCE(position, 'ฝ่ายผลิต') as position
        FROM public.profiles 
        WHERE is_active = TRUE AND role != 'ADMIN'
        ORDER BY full_name ASC
    LOOP
        total_employees := total_employees + 1;
        
        -- 1) Count approved fixed OT
        SELECT COALESCE(COUNT(*), 0) INTO user_fixed_ot_count
        FROM public.ot_requests
        WHERE user_id = profile_rec.id
          AND status = 'APPROVED'
          AND is_fixed = TRUE
          AND date >= summary_start_date
          AND date <= summary_end_date;
          
        -- 2) Sum approved hourly OT (NORMAL_DAY)
        SELECT COALESCE(SUM(duration_hours), 0) INTO user_weekday_ot_hours
        FROM public.ot_requests
        WHERE user_id = profile_rec.id
          AND status = 'APPROVED'
          AND is_fixed = FALSE
          AND type = 'NORMAL_DAY'
          AND date >= summary_start_date
          AND date <= summary_end_date;

        -- 3) Sum approved hourly OT (HOLIDAY: up to 8 hrs)
        SELECT COALESCE(SUM(LEAST(duration_hours, 8)), 0) INTO user_holiday_ot_hours
        FROM public.ot_requests
        WHERE user_id = profile_rec.id
          AND status = 'APPROVED'
          AND is_fixed = FALSE
          AND (type = 'HOLIDAY' OR type = 'HOLIDAY_OVERTIME')
          AND date >= summary_start_date
          AND date <= summary_end_date;

        -- 4) Sum approved hourly OT (HOLIDAY_OVERTIME: hours exceeding 8 hrs)
        SELECT COALESCE(SUM(GREATEST(0, duration_hours - 8)), 0) INTO user_holiday_overtime_hours
        FROM public.ot_requests
        WHERE user_id = profile_rec.id
          AND status = 'APPROVED'
          AND is_fixed = FALSE
          AND (type = 'HOLIDAY' OR type = 'HOLIDAY_OVERTIME')
          AND date >= summary_start_date
          AND date <= summary_end_date;
          
        user_total_hours := user_weekday_ot_hours + user_holiday_ot_hours + user_holiday_overtime_hours;

        -- Only include in report if they have any OT approved
        IF user_fixed_ot_count > 0 OR user_total_hours > 0 THEN
            has_ot_count := has_ot_count + 1;
            
            user_detail_json := jsonb_build_object(
                'full_name', profile_rec.full_name,
                'position', profile_rec.position,
                'fixed_ot_count', user_fixed_ot_count,
                'weekday_ot_hours', user_weekday_ot_hours,
                'holiday_ot_hours', user_holiday_ot_hours,
                'holiday_overtime_hours', user_holiday_overtime_hours,
                'total_hours', user_total_hours
            );
            ot_users_json := ot_users_json || user_detail_json;

            ot_list_text := ot_list_text || E'\n👤 ' || profile_rec.full_name || ' (' || profile_rec.position || ')' ||
                            E'\n   • OT เหมาจ่าย: ' || user_fixed_ot_count || E' ครั้ง' ||
                            E'\n   • OT รายชั่วโมง: วันธรรมดา ' || user_weekday_ot_hours || E' ชม. | วันหยุด ' || user_holiday_ot_hours || E' ชม. | ล่วงเวลา ' || user_holiday_overtime_hours || E' ชม.' ||
                            E'\n   • รวมเวลา OT: ' || user_total_hours || E' ชม.\n';
        END IF;
    END LOOP;

    -- Build fallback message
    IF ot_list_text = '' THEN
        ot_list_text := E'\n  (ไม่มีพนักงานที่มีรายการทำงานล่วงเวลา (OT) ในช่วงนี้)\n';
    END IF;

    IF summary_mode = 'CURRENT_MONTH' THEN
        message_text := '📊 สรุปรายงานสะสมการทำงานล่วงเวลา (OT) ช่วงวันที่ 1 ถึง ' || EXTRACT(DAY FROM summary_end_date)::TEXT || ' ' || month_name_val || ' ' || year_name_val::TEXT || E'\n\n' ||
                        '📈 รายละเอียดการทำงาน OT สะสมสำหรับพนักงานทุกคนที่ได้รับการอนุมัติแล้ว' || E'\n\n' ||
                        '📊 ภาพรวมช่วงเวลานี้:' || E'\n' ||
                        '- พนักงานทั้งหมด: ' || total_employees || ' คน' || E'\n' ||
                        '- มีรายการทำงาน OT: ' || has_ot_count || ' คน' || E'\n\n' ||
                        '---------------------------------------------------------' || E'\n' ||
                        '📋 สถิติการทำงานล่วงเวลาของพนักงาน:' || E'\n' ||
                        ot_list_text || E'\n' ||
                        '---------------------------------------------------------' || E'\n' ||
                        '💡 หมายเหตุ: ระบบประมวลผลข้อมูลอัตโนมัติ ณ วันที่ ' || to_char(timezone('Asia/Bangkok'::text, now()), 'DD/MM/YYYY') || E'\n\n' ||
                        'แอปพลิเคชัน ' || app_name_val;
    ELSE
        message_text := '📊 สรุปรายงานสถิติการทำงานล่วงเวลา (OT) ประจำเดือน' || month_name_val || ' ' || year_name_val::TEXT || E'\n\n' ||
                        '📈 รายละเอียดการทำงาน OT ทั้งหมดสำหรับพนักงานทุกคนที่ได้รับการอนุมัติแล้ว' || E'\n\n' ||
                        '📊 ภาพรวมเดือนนี้:' || E'\n' ||
                        '- พนักงานทั้งหมด: ' || total_employees || ' คน' || E'\n' ||
                        '- มีรายการทำงาน OT: ' || has_ot_count || ' คน' || E'\n\n' ||
                        '---------------------------------------------------------' || E'\n' ||
                        '📋 สถิติการทำงานล่วงเวลาของพนักงาน:' || E'\n' ||
                        ot_list_text || E'\n' ||
                        '---------------------------------------------------------' || E'\n' ||
                        '💡 หมายเหตุ: ระบบประมวลผลข้อมูลอัตโนมัติ ณ วันที่ ' || to_char(timezone('Asia/Bangkok'::text, now()), 'DD/MM/YYYY') || E'\n\n' ||
                        'แอปพลิเคชัน ' || app_name_val;
    END IF;

    -- Build metadata json
    metadata_val := jsonb_build_object(
        'month_name', month_name_val,
        'year_name', year_name_val::TEXT,
        'total_employees', total_employees,
        'has_ot_count', has_ot_count,
        'ot_users', ot_users_json,
        'summary_mode', summary_mode,
        'summary_start_date', summary_start_date::TEXT,
        'summary_end_date', summary_end_date::TEXT
    );

    -- Insert into notifications with type = 'MONTHLY_OT_SUMMARY'
    -- This will trigger the Edge Function webhook automatically
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        is_read,
        link_path,
        line_status,
        metadata
    ) VALUES (
        admin_user_id,
        'MONTHLY_OT_SUMMARY',
        CASE WHEN summary_mode = 'CURRENT_MONTH' THEN '📊 สรุปยอด OT สะสมตั้งแต่วันที่ 1 ถึง ' || EXTRACT(DAY FROM summary_end_date)::TEXT || ' ' || month_name_val || ' ' || year_name_val::TEXT ELSE '📊 สรุปสถิติ OT ประจำเดือน' || month_name_val || ' ' || year_name_val::TEXT END,
        message_text,
        FALSE,
        'ATTENDANCE',
        NULL,
        metadata_val
    );
END;
$$;


ALTER FUNCTION "public"."generate_monthly_ot_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_db_size"() RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT pg_database_size(current_database());
$$;


ALTER FUNCTION "public"."get_db_size"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_finance_stats"("start_date" "date", "end_date" "date") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_income numeric;
  total_expense numeric;
  expense_by_cat json;
BEGIN
  -- 1. Calculate Total Income (Using net_amount if available, else amount)
  SELECT COALESCE(SUM(COALESCE(net_amount, amount)), 0)
  INTO total_income
  FROM finance_transactions
  WHERE type = 'INCOME' 
  AND date >= start_date 
  AND date <= end_date;

  -- 2. Calculate Total Expense
  SELECT COALESCE(SUM(COALESCE(net_amount, amount)), 0)
  INTO total_expense
  FROM finance_transactions
  WHERE type = 'EXPENSE' 
  AND date >= start_date 
  AND date <= end_date;

  -- 3. Calculate Expense by Category for Charts
  SELECT json_agg(t) FROM (
    SELECT category_key, SUM(COALESCE(net_amount, amount)) as value
    FROM finance_transactions
    WHERE type = 'EXPENSE'
    AND date >= start_date 
    AND date <= end_date
    GROUP BY category_key
  ) t INTO expense_by_cat;

  -- Return JSON object
  RETURN json_build_object(
    'total_income', total_income,
    'total_expense', total_expense,
    'net_profit', total_income - total_expense,
    'expense_by_category', COALESCE(expense_by_cat, '[]'::json)
  );
END;
$$;


ALTER FUNCTION "public"."get_finance_stats"("start_date" "date", "end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mapped_shift"("check_in_timestamp" timestamp with time zone, "shifts_list_val" "text") RETURNS time without time zone
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    local_time TIME;
    shift_array TIME[];
    shift_val TIME;
    first_shift TIME;
    last_shift TIME;
BEGIN
    local_time := (check_in_timestamp AT TIME ZONE 'Asia/Bangkok')::TIME;
    
    -- Parse shifts list into array of TIME, sorted ascending
    SELECT array_agg(trim(s)::TIME ORDER BY trim(s)::TIME) INTO shift_array
    FROM unnest(string_to_array(shifts_list_val, ',')) s
    WHERE s IS NOT NULL 
      AND trim(s) <> ''
      AND trim(s) ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$';
    
    IF shift_array IS NULL OR cardinality(shift_array) = 0 THEN
        RETURN '09:00'::TIME;
    END IF;
    
    first_shift := shift_array[1];
    last_shift := shift_array[cardinality(shift_array)];
    
    -- Case 1: Early or before/at first shift
    IF local_time <= first_shift THEN
        RETURN first_shift;
    END IF;
    
    -- Case 2: After last shift
    IF local_time > last_shift THEN
        RETURN last_shift;
    END IF;
    
    -- Case 3: Between shifts
    FOREACH shift_val IN ARRAY shift_array LOOP
        IF shift_val >= local_time THEN
            RETURN shift_val;
        END IF;
    END LOOP;
    
    RETURN last_shift;
END;
$_$;


ALTER FUNCTION "public"."get_mapped_shift"("check_in_timestamp" timestamp with time zone, "shifts_list_val" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, email, full_name, role, is_approved, is_active)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'MEMBER', 
    false,
    true
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_working_day_db"("check_date" "date", "check_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    is_exception RECORD;
    is_holiday BOOLEAN;
    user_start_date DATE;
    day_of_week INT;
    user_work_days INT[];
BEGIN
    -- A. Check if check_date is before user's start date
    SELECT start_date, work_days INTO user_start_date, user_work_days FROM public.profiles WHERE id = check_user_id;
    IF user_start_date IS NOT NULL AND check_date < user_start_date THEN
        RETURN FALSE;
    END IF;

    -- B. Check calendar exceptions (Highest Priority)
    SELECT * INTO is_exception FROM public.calendar_exceptions WHERE date = check_date LIMIT 1;
    IF is_exception IS NOT NULL THEN
        RETURN is_exception.type = 'WORK_DAY';
    END IF;

    -- C. Check annual holidays
    SELECT EXISTS(
        SELECT 1 FROM public.annual_holidays 
        WHERE is_active = TRUE 
          AND day = EXTRACT(DAY FROM check_date) 
          AND month = EXTRACT(MONTH FROM check_date)
    ) INTO is_holiday;
    IF is_holiday THEN
        RETURN FALSE;
    END IF;

    -- D. Check user's work_days array (aligns with judgeUtils.ts date.getDay() returns 0 for Sunday, 1 for Monday...)
    day_of_week := EXTRACT(dow FROM check_date);
    
    -- If user_work_days is null or empty, default to Monday - Friday (1, 2, 3, 4, 5)
    IF user_work_days IS NULL OR cardinality(user_work_days) = 0 THEN
        user_work_days := ARRAY[1, 2, 3, 4, 5];
    END IF;

    RETURN day_of_week = ANY(user_work_days);
END;
$$;


ALTER FUNCTION "public"."is_working_day_db"("check_date" "date", "check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jsonb_array_elements_text"("arr" "text"[]) RETURNS SETOF "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN QUERY SELECT unnest(arr);
END;
$$;


ALTER FUNCTION "public"."jsonb_array_elements_text"("arr" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_and_reschedule_absent_cron"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    absent_time_val TEXT;
    absent_enabled_val TEXT;
    absent_time_parsed TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating ABSENT_PENALTY_TIME or ABSENT_PENALTY_ENABLED under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND (NEW.key = 'ABSENT_PENALTY_TIME' OR NEW.key = 'ABSENT_PENALTY_ENABLED')) THEN
        
        -- Get current configured states
        SELECT label INTO absent_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_ENABLED' LIMIT 1;
        SELECT label INTO absent_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_TIME' LIMIT 1;

        -- If key is the NEW row itself, use NEW.label to ensure transaction accuracy
        IF NEW.key = 'ABSENT_PENALTY_ENABLED' THEN
            absent_enabled_val := NEW.label;
        ELSIF NEW.key = 'ABSENT_PENALTY_TIME' THEN
            absent_time_val := NEW.label;
        END IF;

        IF absent_enabled_val IS NULL THEN
            absent_enabled_val := 'false';
        END IF;

        IF absent_time_val IS NULL THEN
            absent_time_val := '19:00';
        END IF;

        -- Unschedule existing cron
        BEGIN
            PERFORM cron.unschedule('absent-penalty');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;

        -- Schedule if enabled
        IF absent_enabled_val = 'true' THEN
            BEGIN
                absent_time_parsed := absent_time_val::TIME;
            EXCEPTION WHEN OTHERS THEN
                absent_time_parsed := '19:00'::TIME;
            END;

            -- Convert local check-in cutoff time to UTC based on Asia/Bangkok
            utc_alert_timestamp := (CURRENT_DATE + absent_time_parsed) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
            utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
            utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

            cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

            BEGIN
                PERFORM cron.schedule('absent-penalty', cron_expr, 'SELECT public.same_day_absent_penalty_cron()');
            EXCEPTION WHEN OTHERS THEN
                -- Ignored
            END;
            
            RAISE NOTICE 'Rescheduled absent-penalty cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."recalculate_and_reschedule_absent_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_and_reschedule_checkin_cron"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    start_time_val TEXT;
    shifts_enabled_val TEXT;
    shifts_list_val TEXT;
    temp_start_val TEXT;
    late_buffer_val TEXT;
    late_alert_mode_val TEXT;
    late_alert_offset_val TEXT;
    start_time_parsed TIME;
    late_buffer_minutes INT;
    late_alert_offset_minutes INT;
    local_alert_time TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating START_TIME, LATE_BUFFER, LATE_ALERT_MODE, LATE_ALERT_OFFSET, MULTIPLE_SHIFTS_ENABLED, or MULTIPLE_SHIFTS_LIST under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND (
        NEW.key = 'START_TIME' OR 
        NEW.key = 'LATE_BUFFER' OR 
        NEW.key = 'LATE_ALERT_MODE' OR 
        NEW.key = 'LATE_ALERT_OFFSET' OR
        NEW.key = 'MULTIPLE_SHIFTS_ENABLED' OR
        NEW.key = 'MULTIPLE_SHIFTS_LIST'
    )) THEN
        -- Fetch START_TIME from database
        SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
        -- Fetch MULTIPLE_SHIFTS_ENABLED from database
        SELECT label INTO shifts_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_ENABLED' LIMIT 1;
        -- Fetch MULTIPLE_SHIFTS_LIST from database
        SELECT label INTO shifts_list_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_LIST' LIMIT 1;
        -- Fetch LATE_BUFFER from database
        SELECT label INTO late_buffer_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_BUFFER' LIMIT 1;
        -- Fetch LATE_ALERT_MODE from database
        SELECT label INTO late_alert_mode_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_ALERT_MODE' LIMIT 1;
        -- Fetch LATE_ALERT_OFFSET from database
        SELECT label INTO late_alert_offset_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_ALERT_OFFSET' LIMIT 1;

        -- Fallbacks
        IF start_time_val IS NULL THEN
            start_time_val := '10:00';
        END IF;
        IF shifts_enabled_val IS NULL THEN
            shifts_enabled_val := 'false';
        END IF;
        IF late_buffer_val IS NULL THEN
            late_buffer_val := '15';
        END IF;
        IF late_alert_mode_val IS NULL THEN
            late_alert_mode_val := 'AFTER_LIMIT';
        END IF;
        IF late_alert_offset_val IS NULL THEN
            late_alert_offset_val := '5';
        END IF;

        -- Override start_time_val with max shift if multiple shifts are enabled
        IF LOWER(TRIM(shifts_enabled_val)) = 'true' AND shifts_list_val IS NOT NULL AND TRIM(shifts_list_val) <> '' THEN
            BEGIN
                SELECT left(max(NULLIF(trim(s), '')::TIME)::text, 5) INTO temp_start_val
                FROM unnest(string_to_array(shifts_list_val, ',')) s
                WHERE NULLIF(trim(s), '') IS NOT NULL 
                  AND NULLIF(trim(s), '') ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$';
                
                IF temp_start_val IS NOT NULL THEN
                    start_time_val := temp_start_val;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- Keep start_time_val if parse error
            END;
        END IF;

        IF start_time_val IS NULL THEN
            start_time_val := '10:00';
        END IF;

        -- Parse START_TIME as TIME
        BEGIN
            start_time_parsed := start_time_val::TIME;
            IF start_time_parsed IS NULL THEN
                start_time_parsed := '10:00'::TIME;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            start_time_parsed := '10:00'::TIME;
        END;

        -- Parse LATE_BUFFER as INT
        BEGIN
            late_buffer_minutes := late_buffer_val::INT;
        EXCEPTION WHEN OTHERS THEN
            late_buffer_minutes := 15;
        END;

        -- Parse LATE_ALERT_OFFSET as INT
        BEGIN
            late_alert_offset_minutes := late_alert_offset_val::INT;
        EXCEPTION WHEN OTHERS THEN
            late_alert_offset_minutes := 5;
        END;

        -- Calculate local alert time
        IF late_alert_mode_val = 'BEFORE_LIMIT' THEN
            -- Proactive mode: START_TIME + LATE_BUFFER - LATE_ALERT_OFFSET
            local_alert_time := start_time_parsed + (late_buffer_minutes || ' minutes')::INTERVAL - (late_alert_offset_minutes || ' minutes')::INTERVAL;
        ELSE
            -- Standard mode: START_TIME + LATE_BUFFER + 1 minute
            local_alert_time := start_time_parsed + (late_buffer_minutes || ' minutes')::INTERVAL + '1 minute'::INTERVAL;
        END IF;

        -- Convert local alert time to UTC to set up pg_cron
        -- Using CURRENT_DATE combined with local time and casting with timezone 'Asia/Bangkok'
        -- then extracting hour and minute in 'UTC'
        utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
        utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
        utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

        -- Build daily cron expression: 'minute hour * * *'
        cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

        -- Update/reschedule pg_cron job using SECURITY DEFINER permissions
        -- First unschedule the existing job if exists
        BEGIN
            PERFORM cron.unschedule('check-in-reminder');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron is not active or job does not exist
        END;
        
        -- Schedule the check-in-reminder job to run daily at the calculated UTC time
        BEGIN
            PERFORM cron.schedule('check-in-reminder', cron_expr, 'SELECT public.check_in_reminder_cron()');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron extension isn't active/installed
        END;
        
        RAISE NOTICE 'Rescheduled check-in-reminder cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
    END IF;

    RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."recalculate_and_reschedule_checkin_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_and_reschedule_checkout_cron"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    checkout_time_val TEXT;
    checkout_time_parsed TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating CHECKOUT_PENALTY_TIME under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND NEW.key = 'CHECKOUT_PENALTY_TIME') THEN
        checkout_time_val := NEW.label;

        IF checkout_time_val IS NULL THEN
            checkout_time_val := '06:00';
        END IF;

        -- Parse CHECKOUT_PENALTY_TIME as TIME
        BEGIN
            checkout_time_parsed := checkout_time_val::TIME;
        EXCEPTION WHEN OTHERS THEN
            checkout_time_parsed := '06:00'::TIME;
        END;

        -- Convert local alert time to UTC to set up pg_cron (Asia/Bangkok timezone offset calculation)
        utc_alert_timestamp := (CURRENT_DATE + checkout_time_parsed) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
        utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
        utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

        -- Build daily cron expression: 'minute hour * * *'
        cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

        -- Update/reschedule pg_cron job using SECURITY DEFINER permissions
        BEGIN
            PERFORM cron.unschedule('checkout-penalty');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron is not active or job does not exist
        END;
        
        BEGIN
            PERFORM cron.schedule('checkout-penalty', cron_expr, 'SELECT public.forgot_checkout_penalty_cron()');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;
        
        RAISE NOTICE 'Rescheduled checkout-penalty cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."recalculate_and_reschedule_checkout_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_and_reschedule_monthly_bonus_cron"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    summary_time_val TEXT;
    summary_day_val TEXT;
    local_alert_time TIME;
    summary_day INT;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating MONTHLY_SUMMARY_TIME, MONTHLY_SUMMARY_DAY or MONTHLY_SUMMARY_MODE under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND (NEW.key = 'MONTHLY_SUMMARY_TIME' OR NEW.key = 'MONTHLY_SUMMARY_DAY' OR NEW.key = 'MONTHLY_SUMMARY_MODE')) THEN
        -- Fetch MONTHLY_SUMMARY_TIME from database
        SELECT label INTO summary_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_SUMMARY_TIME' LIMIT 1;
        -- Fetch MONTHLY_SUMMARY_DAY from database
        SELECT label INTO summary_day_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_SUMMARY_DAY' LIMIT 1;

        IF summary_time_val IS NOT NULL AND summary_time_val != '' THEN
            BEGIN
                local_alert_time := summary_time_val::TIME;
            EXCEPTION WHEN OTHERS THEN
                local_alert_time := '08:00'::TIME;
            END;
        ELSE
            local_alert_time := '08:00'::TIME;
        END IF;

        IF summary_day_val IS NOT NULL AND summary_day_val != '' THEN
            BEGIN
                summary_day := summary_day_val::INT;
                IF summary_day < 1 OR summary_day > 31 THEN
                    summary_day := 1;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                summary_day := 1;
            END;
        ELSE
            summary_day := 1;
        END IF;

        -- Convert local alert time to UTC to set up pg_cron
        utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
        utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
        utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

        -- Build monthly cron expression: 'minute hour day * *'
        cron_expr := utc_minute || ' ' || utc_hour || ' ' || summary_day || ' * *';

        -- Update/reschedule pg_cron job using SECURITY DEFINER permissions
        BEGIN
            PERFORM cron.unschedule('monthly-bonus-summary');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron is not active or job does not exist
        END;
        
        BEGIN
            PERFORM cron.schedule('monthly-bonus-summary', cron_expr, 'SELECT public.generate_monthly_bonus_summary()');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;
        
        RAISE NOTICE 'Rescheduled monthly-bonus-summary cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."recalculate_and_reschedule_monthly_bonus_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_and_reschedule_monthly_ot_cron"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    summary_time_val TEXT;
    summary_day_val TEXT;
    local_alert_time TIME;
    summary_day INT;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating MONTHLY_OT_SUMMARY_TIME, MONTHLY_OT_SUMMARY_DAY or MONTHLY_OT_SUMMARY_MODE under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND (NEW.key = 'MONTHLY_OT_SUMMARY_TIME' OR NEW.key = 'MONTHLY_OT_SUMMARY_DAY' OR NEW.key = 'MONTHLY_OT_SUMMARY_MODE')) THEN
        -- Fetch MONTHLY_OT_SUMMARY_TIME from database
        SELECT label INTO summary_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_OT_SUMMARY_TIME' LIMIT 1;
        -- Fetch MONTHLY_OT_SUMMARY_DAY from database
        SELECT label INTO summary_day_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_OT_SUMMARY_DAY' LIMIT 1;

        IF summary_time_val IS NOT NULL AND summary_time_val != '' THEN
            BEGIN
                local_alert_time := summary_time_val::TIME;
            EXCEPTION WHEN OTHERS THEN
                local_alert_time := '08:00'::TIME;
            END;
        ELSE
            local_alert_time := '08:00'::TIME;
        END IF;

        IF summary_day_val IS NOT NULL AND summary_day_val != '' THEN
            BEGIN
                summary_day := summary_day_val::INT;
                IF summary_day < 1 OR summary_day > 31 THEN
                    summary_day := 1;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                summary_day := 1;
            END;
        ELSE
            summary_day := 1;
        END IF;

        -- Convert local alert time to UTC to set up pg_cron
        utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
        utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
        utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

        -- Build monthly cron expression: 'minute hour day * *'
        cron_expr := utc_minute || ' ' || utc_hour || ' ' || summary_day || ' * *';

        -- Update/reschedule pg_cron job using SECURITY DEFINER permissions
        BEGIN
            PERFORM cron.unschedule('monthly-ot-summary');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron is not active or job does not exist
        END;
        
        BEGIN
            PERFORM cron.schedule('monthly-ot-summary', cron_expr, 'SELECT public.generate_monthly_ot_summary()');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;
        
        RAISE NOTICE 'Rescheduled monthly-ot-summary cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."recalculate_and_reschedule_monthly_ot_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_and_reschedule_ot_summary_cron"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    summary_enabled_val TEXT;
    summary_day_val TEXT;
    summary_time_val TEXT;
    local_alert_time TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_day INT;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating OT_SUMMARY_ENABLED, OT_SUMMARY_DAY, or OT_SUMMARY_TIME under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND (NEW.key = 'OT_SUMMARY_ENABLED' OR NEW.key = 'OT_SUMMARY_DAY' OR NEW.key = 'OT_SUMMARY_TIME')) THEN
        SELECT label INTO summary_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'OT_SUMMARY_ENABLED' LIMIT 1;
        SELECT label INTO summary_day_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'OT_SUMMARY_DAY' LIMIT 1;
        SELECT label INTO summary_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'OT_SUMMARY_TIME' LIMIT 1;

        IF summary_enabled_val IS NULL THEN summary_enabled_val := 'true'; END IF;
        IF summary_day_val IS NULL THEN summary_day_val := '26'; END IF;
        IF summary_time_val IS NULL THEN summary_time_val := '18:00'; END IF;

        -- Unschedule existing job first
        BEGIN
            PERFORM cron.unschedule('monthly-ot-summary');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;

        -- Schedule new job if enabled
        IF summary_enabled_val = 'true' THEN
            BEGIN
                local_alert_time := summary_time_val::TIME;
            EXCEPTION WHEN OTHERS THEN
                local_alert_time := '18:00'::TIME;
            END;

            BEGIN
                -- Standardize on a fixed year/month to avoid day overflows (e.g. February has only 28 days, so August is extremely safe with 31 days)
                utc_alert_timestamp := (to_date('2026-08-' || summary_day_val, 'YYYY-MM-DD') + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
                utc_day := EXTRACT(DAY FROM utc_alert_timestamp);
                utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
                utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);
            EXCEPTION WHEN OTHERS THEN
                -- Fallback if day is invalid (e.g. > 31)
                utc_day := 26;
                utc_hour := 11;
                utc_minute := 0;
            END;

            -- Monthly cron expression: 'minute hour day * *'
            cron_expr := utc_minute || ' ' || utc_hour || ' ' || utc_day || ' * *';

            BEGIN
                PERFORM cron.schedule('monthly-ot-summary', cron_expr, 'SELECT public.generate_monthly_ot_summary()');
            EXCEPTION WHEN OTHERS THEN
                -- Ignored
            END;

            RAISE NOTICE 'Rescheduled monthly-ot-summary cron job to UTC time: %:% on day % (%)', utc_hour, utc_minute, utc_day, cron_expr;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."recalculate_and_reschedule_ot_summary_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_and_reschedule_summary_cron"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    summary_time_val TEXT;
    start_time_val TEXT;
    delay_hours_val TEXT;
    start_time_parsed TIME;
    delay_hours NUMERIC;
    local_alert_time TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating START_TIME, DAILY_SUMMARY_DELAY_HOURS, or DAILY_SUMMARY_TIME under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND (NEW.key = 'START_TIME' OR NEW.key = 'DAILY_SUMMARY_DELAY_HOURS' OR NEW.key = 'DAILY_SUMMARY_TIME')) THEN
        -- Fetch DAILY_SUMMARY_TIME from database
        SELECT label INTO summary_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'DAILY_SUMMARY_TIME' LIMIT 1;

        IF summary_time_val IS NOT NULL AND summary_time_val != '' THEN
            BEGIN
                local_alert_time := summary_time_val::TIME;
            EXCEPTION WHEN OTHERS THEN
                local_alert_time := '18:00'::TIME;
            END;
        ELSE
            -- Fallback to START_TIME + delay calculation
            SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
            SELECT label INTO delay_hours_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'DAILY_SUMMARY_DELAY_HOURS' LIMIT 1;

            IF start_time_val IS NULL THEN start_time_val := '10:00'; END IF;
            IF delay_hours_val IS NULL THEN delay_hours_val := '1'; END IF;

            BEGIN
                start_time_parsed := start_time_val::TIME;
            EXCEPTION WHEN OTHERS THEN
                start_time_parsed := '10:00'::TIME;
            END;

            BEGIN
                delay_hours := delay_hours_val::NUMERIC;
            EXCEPTION WHEN OTHERS THEN
                delay_hours := 1;
            END;

            local_alert_time := start_time_parsed + (delay_hours || ' hours')::INTERVAL;
        END IF;

        -- Convert local alert time to UTC to set up pg_cron
        utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
        utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
        utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

        -- Build daily cron expression: 'minute hour * * *'
        cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

        -- Update/reschedule pg_cron job using SECURITY DEFINER permissions
        BEGIN
            PERFORM cron.unschedule('daily-attendance-summary');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron is not active or job does not exist
        END;
        
        BEGIN
            PERFORM cron.schedule('daily-attendance-summary', cron_expr, 'SELECT public.generate_daily_attendance_summary()');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;
        
        RAISE NOTICE 'Rescheduled daily-attendance-summary cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."recalculate_and_reschedule_summary_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."same_day_absent_penalty_cron"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    today_date DATE;
    absent_penalty_enabled_val TEXT;
    absent_penalty_target_roles_val TEXT := 'BOTH';
    hp_penalty INT := -500;
    rule_val JSONB;
    profile_rec RECORD;
    has_check_in BOOLEAN;
    has_leave BOOLEAN;
    already_penalized BOOLEAN;
    new_log_id UUID;
    new_hp INT;
    is_death BOOLEAN;
    death_cnt INT;
BEGIN
    -- Determine today's date in Bangkok (Thailand) timezone to remain server-independent
    today_date := timezone('Asia/Bangkok'::text, now())::DATE;

    -- Fetch master option to check if absent penalty is enabled
    SELECT label INTO absent_penalty_enabled_val 
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_ENABLED' 
    LIMIT 1;

    IF absent_penalty_enabled_val IS NULL OR absent_penalty_enabled_val != 'true' THEN
        RETURN;
    END IF;

    -- Fetch penalty amount from game_configs (key = 'ATTENDANCE_RULES', path 'ABSENT', 'hp')
    BEGIN
        SELECT value::JSONB INTO rule_val FROM public.game_configs WHERE key = 'ATTENDANCE_RULES' LIMIT 1;
        IF rule_val IS NOT NULL AND rule_val ? 'ABSENT' AND (rule_val->'ABSENT') ? 'hp' THEN
            hp_penalty := (rule_val->'ABSENT'->>'hp')::INT;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        hp_penalty := -500;
    END;

    -- Fetch target roles from master_options
    SELECT label INTO absent_penalty_target_roles_val 
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_TARGET_ROLES' 
    LIMIT 1;

    IF absent_penalty_target_roles_val IS NULL THEN
        absent_penalty_target_roles_val := 'BOTH';
    END IF;

    -- Loop through active profiles that match target roles
    FOR profile_rec IN
        SELECT p.id, p.hp, p.max_hp, p.death_count, p.full_name, p.role
        FROM public.profiles p
        WHERE p.is_active = TRUE
          AND (
            absent_penalty_target_roles_val = 'BOTH' OR
            (absent_penalty_target_roles_val = 'ADMIN' AND p.role = 'ADMIN') OR
            (absent_penalty_target_roles_val = 'MEMBER' AND p.role != 'ADMIN')
          )
    LOOP
        -- A. Check if today is a working day for this user
        IF NOT public.is_working_day_db(today_date, profile_rec.id) THEN
            CONTINUE;
        END IF;

        -- B. Check if there is any attendance log for today
        SELECT EXISTS (
            SELECT 1 FROM public.attendance_logs
            WHERE user_id = profile_rec.id
              AND date = today_date
        ) INTO has_check_in;

        IF has_check_in THEN
            CONTINUE;
        END IF;

        -- C. Check if there is any pending or approved leave request for today
        SELECT EXISTS (
            SELECT 1 FROM public.leave_requests
            WHERE user_id = profile_rec.id
              AND (status = 'PENDING' OR status = 'APPROVED')
              AND start_date <= today_date
              AND end_date >= today_date
        ) INTO has_leave;

        IF has_leave THEN
            CONTINUE;
        END IF;

        -- D. Check if we already penalized them today to prevent double penalties
        SELECT EXISTS (
            SELECT 1 FROM public.game_logs
            WHERE user_id = profile_rec.id
              AND action_type = 'ATTENDANCE_ABSENT'
              AND (description LIKE '%' || today_date::TEXT || '%')
        ) INTO already_penalized;

        IF already_penalized THEN
            CONTINUE;
        END IF;

        -- E. Apply Penalty & Record Absence

        -- 1. Create an ABSENT attendance log for today
        INSERT INTO public.attendance_logs (
            user_id,
            date,
            status,
            work_type,
            note
        ) VALUES (
            profile_rec.id,
            today_date,
            'ABSENT',
            'ABSENT',
            '[SYSTEM] Auto-penalized for same-day absence (no check-in & no leave request before target time)'
        ) RETURNING id INTO new_log_id;

        -- 2. Calculate new HP and handle defeat condition
        new_hp := profile_rec.hp + hp_penalty;
        IF new_hp > profile_rec.max_hp THEN
            new_hp := profile_rec.max_hp;
        END IF;
        
        is_death := (profile_rec.hp > 0 AND new_hp <= 0);
        death_cnt := profile_rec.death_count;
        IF is_death THEN
            death_cnt := death_cnt + 1;
        END IF;

        -- Update Profile HP and death count
        UPDATE public.profiles
        SET hp = new_hp,
            death_count = death_cnt
        WHERE id = profile_rec.id;

        -- 3. If they died, trigger LEVEL_DOWN / Death Log
        IF is_death THEN
            INSERT INTO public.game_logs (
                user_id,
                action_type,
                xp_change,
                hp_change,
                jp_change,
                description
            ) VALUES (
                profile_rec.id,
                'LEVEL_DOWN',
                0,
                0,
                0,
                '💀 คุณพ่ายแพ้เนื่องจากค่าพลังชีวิต (HP) หมดลงจากบทลงโทษขาดงานวันนี้'
            );
        END IF;

        -- 4. Insert Game Log (Triggers real-time notification/Toast on client)
        INSERT INTO public.game_logs (
            user_id,
            action_type,
            xp_change,
            hp_change,
            jp_change,
            description,
            related_id
        ) VALUES (
            profile_rec.id,
            'ATTENDANCE_ABSENT',
            0,
            hp_penalty,
            0,
            'ขาดงานของวันที่ ' || today_date::TEXT || ' ระบบได้ทำการหักคะแนนอัตโนมัติ',
            new_log_id
        );

        -- 5. Insert Notification (Triggers LINE push notification automatically via webhook)
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            is_read,
            link_path,
            line_status
        ) VALUES (
            profile_rec.id,
            'DANGER',
            '🔴 แจ้งเตือน: พบการขาดงานในระบบวันนี้!',
            'เนื่องจากพบบันทึกเวลาของวันที่ ' || today_date::TEXT || ' ว่าคุณไม่ได้ลงเวลาเข้างาน และไม่มีคำขอลาในระบบจนถึงเลยเวลาเช็คเวลาขาดงาน ระบบจึงทำบันทึกเป็นขาดงานและหัก HP ของคุณ',
            FALSE,
            'ATTENDANCE',
            NULL
        );

    END LOOP;
END;
$$;


ALTER FUNCTION "public"."same_day_absent_penalty_cron"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."scripts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "status" "text" DEFAULT 'DRAFT'::"text",
    "version" integer DEFAULT 1,
    "author_id" "uuid",
    "content_id" "uuid",
    "estimated_duration" integer DEFAULT 0,
    "script_type" "text" DEFAULT 'MONOLOGUE'::"text",
    "characters" "jsonb" DEFAULT '[]'::"jsonb",
    "is_in_shoot_queue" boolean DEFAULT false,
    "idea_owner_id" "uuid",
    "channel_id" "uuid",
    "category" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "objective" "text",
    "blocks" "jsonb" DEFAULT '[]'::"jsonb",
    "locked_by" "uuid",
    "locked_at" timestamp with time zone,
    "share_token" "text",
    "is_public" boolean DEFAULT false,
    "is_personal" boolean DEFAULT false,
    "sheets" "jsonb" DEFAULT '[]'::"jsonb",
    "is_soft_finished" boolean DEFAULT false,
    "document_state" "text",
    "sort_order" integer DEFAULT 0,
    "shoot_location" "text",
    "shoot_time_start" "text",
    "shoot_time_end" "text",
    "shoot_notes" "text"
);

ALTER TABLE ONLY "public"."scripts" REPLICA IDENTITY FULL;


ALTER TABLE "public"."scripts" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sheets_text"("s" "public"."scripts") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT s.sheets::text;
$$;


ALTER FUNCTION "public"."sheets_text"("s" "public"."scripts") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_content_analytics_status_fn"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    target_content_id UUID;
    req_platforms TEXT[];
    logged_platforms TEXT[];
    calculated_status TEXT;
    is_terminal BOOLEAN;
    calculated_overdue BOOLEAN;
    rec RECORD;
BEGIN
    -- 1. ตรวจสอบต้นเรื่องของไอดีที่ทำธุรกรรมข้อมูล
    IF TG_OP = 'DELETE' THEN
        target_content_id := OLD.content_id;
    ELSIF TG_TABLE_NAME = 'content_analytics' THEN
        target_content_id := NEW.content_id;
    ELSE
        target_content_id := NEW.id;
    END IF;

    -- 2. ดึงข้อมูลข้อจำกัดของคอนเทนต์ชิ้นนั้นๆ
    SELECT target_platform, status, end_date, is_unscheduled
    INTO rec
    FROM public.contents
    WHERE id = target_content_id;

    IF rec IS NULL THEN
        RETURN NULL;
    END IF;

    -- 3. รวบรวมรายชื่อแพลตฟอร์มที่ได้ตรวจพบล่าสุดในตารางสถิติ
    SELECT COALESCE(array_agg(DISTINCT platform) FILTER (WHERE platform IS NOT NULL), '{}'::text[])
    INTO logged_platforms
    FROM public.content_analytics
    WHERE content_id = target_content_id;

    req_platforms := rec.target_platform;

    -- 4. ประมวลสภาพความครบถ้วนของข้อมูล (Analytics Status logic)
    IF req_platforms IS NULL OR array_length(req_platforms, 1) IS NULL THEN
        calculated_status := 'COMPLETE'; -- หากไม่ได้ระบุเป้าหมาย ถือว่าสมบูรณ์ตามสภาพ
    ELSIF array_length(logged_platforms, 1) IS NULL THEN
        calculated_status := 'NONE'; -- หากยังไม่มีแพลตฟอร์มใดส่งสถิติเลย
    ELSIF req_platforms <@ logged_platforms THEN
        calculated_status := 'COMPLETE'; -- หากได้ส่งครบถ้วนทุกช่องทางที่ระบุ (ชุดซ้ายเป็นซับเซตชุดขวา)
    ELSIF NOT (req_platforms && logged_platforms) THEN
        calculated_status := 'NONE'; -- ไม่มีสถิติของช่องทางตรงกันเลย
    ELSE
        calculated_status := 'PARTIAL'; -- หรือมีครบเป็นบางส่วน
    END IF;

    -- 5. คำนวณความล่าช้า (Overdue logic) ตามเงื่อนไขทางธุรกิจ
    -- ตรวจสอบเป็นสถานะปิดงานสำเร็จ
    is_terminal := (
        rec.status ILIKE '%done%' 
        OR rec.status ILIKE '%publish%' 
        OR rec.status ILIKE '%posted%' 
        OR rec.status ILIKE '%complete%' 
        OR rec.status ILIKE '%success%'
    );

    calculated_overdue := (
        rec.is_unscheduled = FALSE
        AND is_terminal
        AND rec.end_date <= (NOW() - INTERVAL '7 days')
        AND calculated_status <> 'COMPLETE'
    );

    -- 6. ทำการบันทึกสถานะตรงลงช่องข้อมูลของไอดีเป้าหมาย
    UPDATE public.contents
    SET 
        analytics_status = calculated_status,
        is_overdue_analytics = calculated_overdue
    WHERE id = target_content_id;

    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."sync_content_analytics_status_fn"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_master_option_rules_to_game_configs"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    rules_jsonb JSONB;
BEGIN
    -- Aggregate rules from master_option_rules joined with master_options to get keys, format them as JSONB
    SELECT jsonb_object_agg(mo.key, jsonb_build_object('xp', mor.xp, 'hp', mor.hp, 'coins', mor.coins))
    INTO rules_jsonb
    FROM public.master_option_rules mor
    JOIN public.master_options mo ON mor.master_option_id = mo.id;

    -- Update or insert into game_configs under key 'ATTENDANCE_RULES'
    INSERT INTO public.game_configs (key, value)
    VALUES ('ATTENDANCE_RULES', COALESCE(rules_jsonb, '{}'::jsonb))
    ON CONFLICT (key) DO UPDATE
    SET value = COALESCE(rules_jsonb, '{}'::jsonb);

    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."sync_master_option_rules_to_game_configs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_master_options_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE system_metadata
    SET last_updated_at = now()
    WHERE key = 'master_options_version';
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_master_options_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_wiki_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE system_metadata
    SET last_updated_at = now()
    WHERE key = 'wiki_version';
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_wiki_version"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."active_checklist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "text" "text" NOT NULL,
    "is_checked" boolean DEFAULT false,
    "category_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."active_checklist_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."active_checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."annual_holidays" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "day" integer NOT NULL,
    "month" integer NOT NULL,
    "type_key" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."annual_holidays" REPLICA IDENTITY FULL;


ALTER TABLE "public"."annual_holidays" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "check_in_time" timestamp with time zone,
    "check_out_time" timestamp with time zone,
    "work_type" "text" DEFAULT 'OFFICE'::"text",
    "status" "text" DEFAULT 'PENDING'::"text",
    "note" "text",
    "location_lat" double precision,
    "location_lng" double precision,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "location_name" "text",
    "check_out_lat" double precision,
    "check_out_lng" double precision,
    "check_out_location_name" "text",
    "attachment_urls" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."attendance_logs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."attendance_logs"."status" IS 'สถานะการเข้างาน: WORKING, ABSENT, LATE, ACTION_REQUIRED, etc.';



CREATE TABLE IF NOT EXISTS "public"."calendar_exceptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "calendar_exceptions_type_check" CHECK (("type" = ANY (ARRAY['WORK_DAY'::"text", 'HOLIDAY'::"text"])))
);


ALTER TABLE "public"."calendar_exceptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_highlights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "type_key" "text" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid"
);

ALTER TABLE ONLY "public"."calendar_highlights" REPLICA IDENTITY FULL;


ALTER TABLE "public"."calendar_highlights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."channels" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "platforms" "text"[] DEFAULT '{}'::"text"[],
    "description" "text",
    "logo_url" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "content_strategy" "jsonb"
);

ALTER TABLE ONLY "public"."channels" REPLICA IDENTITY FULL;


ALTER TABLE "public"."channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checklist_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "text" "text" NOT NULL,
    "is_checked" boolean DEFAULT false,
    "category" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checklist_presets_db" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."checklist_presets_db" REPLICA IDENTITY FULL;


ALTER TABLE "public"."checklist_presets_db" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "contact_person" "text",
    "email" "text",
    "phone" "text",
    "logo_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_analytics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "platform" "text" NOT NULL,
    "captured_at" timestamp with time zone DEFAULT "now"(),
    "views" integer DEFAULT 0,
    "likes" integer DEFAULT 0,
    "comments" integer DEFAULT 0,
    "shares" integer DEFAULT 0,
    "saves" integer DEFAULT 0,
    "retention_rate" numeric(5,2),
    "avg_watch_time" numeric(10,2),
    "reach" integer DEFAULT 0,
    "is_ai_extracted" boolean DEFAULT false,
    "raw_ai_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."content_analytics" REPLICA IDENTITY FULL;


ALTER TABLE "public"."content_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'TODO'::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "pillar" "text",
    "category" "text",
    "remark" "text",
    "channel_id" "uuid",
    "target_platform" "text"[],
    "is_unscheduled" boolean DEFAULT false,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "idea_owner_ids" "text"[] DEFAULT '{}'::"text"[],
    "editor_ids" "text"[] DEFAULT '{}'::"text"[],
    "assignee_ids" "text"[] DEFAULT '{}'::"text"[],
    "assets" "jsonb" DEFAULT '[]'::"jsonb",
    "published_links" "jsonb" DEFAULT '{}'::"jsonb",
    "shoot_date" timestamp with time zone,
    "shoot_location" "text",
    "is_penalized" boolean DEFAULT false,
    "shoot_trip_id" "uuid",
    "last_penalized_at" timestamp with time zone,
    "content_formats" "text"[] DEFAULT '{}'::"text"[],
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sla_revert_count" integer DEFAULT 0,
    "is_in_shoot_queue" boolean DEFAULT false,
    "is_soft_finished" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "shoot_time_start" "text",
    "shoot_time_end" "text",
    "shoot_notes" "text",
    "local_path" "text",
    "drive_label" "text",
    "posted_at" timestamp with time zone,
    "priority" smallint,
    "scheduled_time" "text",
    "analytics_status" "text" DEFAULT 'NONE'::"text",
    "is_overdue_analytics" boolean DEFAULT false,
    "has_analytics" boolean DEFAULT false,
    "sub_checklist_progress" "jsonb" DEFAULT '{}'::"jsonb"
);

ALTER TABLE ONLY "public"."contents" REPLICA IDENTITY FULL;


ALTER TABLE "public"."contents" OWNER TO "postgres";


COMMENT ON COLUMN "public"."contents"."sla_revert_count" IS 'จำนวนครั้งที่งานถูกดีดกลับอัตโนมัติเนื่องจาก SLA Expiry';



COMMENT ON COLUMN "public"."contents"."local_path" IS 'ตำแหน่งโฟลเดอร์ในคอมพิวเตอร์ (Local Storage Path)';



COMMENT ON COLUMN "public"."contents"."scheduled_time" IS 'จัดเก็บเวลาที่วางแผนไว้ รูปแบบ HH:mm';



CREATE TABLE IF NOT EXISTS "public"."dashboard_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "icon" "text" DEFAULT 'circle'::"text",
    "color_theme" "text" DEFAULT 'blue'::"text",
    "status_keys" "text"[] DEFAULT '{}'::"text"[],
    "sort_order" integer DEFAULT 0,
    "filter_type" "text" DEFAULT 'STATUS'::"text"
);

ALTER TABLE ONLY "public"."dashboard_configs" REPLICA IDENTITY FULL;


ALTER TABLE "public"."dashboard_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."duties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "assignee_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "is_done" boolean DEFAULT false,
    "proof_image_url" "text",
    "is_penalized" boolean DEFAULT false,
    "penalty_status" "text" DEFAULT 'NONE'::"text",
    "appeal_reason" "text",
    "appeal_proof_url" "text",
    "abandoned_at" timestamp with time zone,
    "cleared_by_system" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."duties" REPLICA IDENTITY FULL;


ALTER TABLE "public"."duties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."duty_configs" (
    "day_of_week" integer NOT NULL,
    "required_people" integer DEFAULT 1,
    "task_titles" "text"[] DEFAULT ARRAY['เวรทำความสะอาดทั่วไป'::"text"]
);

ALTER TABLE ONLY "public"."duty_configs" REPLICA IDENTITY FULL;


ALTER TABLE "public"."duty_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."duty_swaps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "requestor_id" "uuid" NOT NULL,
    "target_duty_id" "uuid" NOT NULL,
    "own_duty_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text"
);

ALTER TABLE ONLY "public"."duty_swaps" REPLICA IDENTITY FULL;


ALTER TABLE "public"."duty_swaps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feedback_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feedback_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback_reposts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feedback_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feedback_reposts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "feedback_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."feedback_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedbacks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "content" "text" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text",
    "is_anonymous" boolean DEFAULT true,
    "user_id" "uuid",
    "vote_count" integer DEFAULT 0,
    "target_user_id" "uuid"
);


ALTER TABLE "public"."feedbacks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "category_key" "text" NOT NULL,
    "amount" numeric DEFAULT 0 NOT NULL,
    "date" "date" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "project_id" "uuid",
    "asset_type" "text" DEFAULT 'NONE'::"text",
    "receipt_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "vat_rate" numeric DEFAULT 0,
    "vat_amount" numeric DEFAULT 0,
    "wht_rate" numeric DEFAULT 0,
    "wht_amount" numeric DEFAULT 0,
    "net_amount" numeric DEFAULT 0,
    "doc_ref_no" "text",
    "entity_name" "text",
    "tax_id" "text",
    "tax_invoice_no" "text",
    "shoot_trip_id" "uuid",
    "target_user_id" "uuid",
    CONSTRAINT "finance_transactions_type_check" CHECK (("type" = ANY (ARRAY['INCOME'::"text", 'EXPENSE'::"text"])))
);


ALTER TABLE "public"."finance_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_configs" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "category" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."game_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "related_id" "uuid",
    "xp_change" integer DEFAULT 0,
    "hp_change" integer DEFAULT 0,
    "jp_change" integer DEFAULT 0,
    "description" "text"
);

ALTER TABLE ONLY "public"."game_logs" REPLICA IDENTITY FULL;


ALTER TABLE "public"."game_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_boosts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."goal_boosts" REPLICA IDENTITY FULL;


ALTER TABLE "public"."goal_boosts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_deadline_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "new_deadline" timestamp with time zone NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    CONSTRAINT "goal_deadline_requests_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'APPROVED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."goal_deadline_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_owners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."goal_owners" REPLICA IDENTITY FULL;


ALTER TABLE "public"."goal_owners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "platform" "text" DEFAULT 'ALL'::"text",
    "current_value" integer DEFAULT 0,
    "target_value" integer DEFAULT 0,
    "deadline" "date" NOT NULL,
    "channel_id" "uuid",
    "is_archived" boolean DEFAULT false,
    "reward_xp" integer DEFAULT 500,
    "reward_coin" integer DEFAULT 100,
    "is_redeemed" boolean DEFAULT false,
    "extension_count" integer DEFAULT 0
);

ALTER TABLE ONLY "public"."goals" REPLICA IDENTITY FULL;


ALTER TABLE "public"."goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hp_death_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "death_number" integer NOT NULL,
    "snapshot_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hp_death_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idp_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "month_key" "text" NOT NULL,
    "topic" "text" NOT NULL,
    "action_plan" "text" NOT NULL,
    "status" "text" DEFAULT 'TODO'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "progress" integer DEFAULT 0,
    "category" "text",
    "target_date" timestamp with time zone,
    "order_index" integer DEFAULT 0,
    "sub_goals" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."idp_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."individual_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "month_key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "target_value" numeric NOT NULL,
    "actual_value" numeric DEFAULT 0,
    "unit" "text" DEFAULT 'units'::"text",
    "weight" numeric DEFAULT 1.0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."individual_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intern_candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone_number" "text",
    "university" "text",
    "portfolio_url" "text",
    "avatar_url" "text",
    "gender" "text",
    "position" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'APPLIED'::"text",
    "interview_date" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "nickname" "text",
    "academic_year" "text",
    "faculty" "text",
    "source" "text",
    "application_date" timestamp with time zone,
    "duration_days" integer,
    "resume_url" "text",
    "other_url" "text",
    CONSTRAINT "email_format" CHECK (("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text")),
    CONSTRAINT "intern_candidates_gender_check" CHECK (("gender" = ANY (ARRAY['MALE'::"text", 'FEMALE'::"text", 'OTHER'::"text"]))),
    CONSTRAINT "intern_candidates_status_check" CHECK (("status" = ANY (ARRAY['APPLIED'::"text", 'INTERVIEW_SCHEDULED'::"text", 'INTERVIEWED'::"text", 'ACCEPTED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."intern_candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "category_id" "text" NOT NULL,
    "image_url" "text",
    "description" "text",
    "purchase_price" numeric DEFAULT 0,
    "purchase_date" "date",
    "serial_number" "text",
    "warranty_expire" "date",
    "condition" "text" DEFAULT 'GOOD'::"text",
    "current_holder_id" "uuid",
    "asset_group" "text" DEFAULT 'PRODUCTION'::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "item_type" "text" DEFAULT 'FIXED'::"text",
    "quantity" integer DEFAULT 1,
    "unit" "text" DEFAULT 'ชิ้น'::"text",
    "min_threshold" integer DEFAULT 0,
    "max_capacity" integer DEFAULT 10,
    "group_label" "text"
);

ALTER TABLE ONLY "public"."inventory_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."inventory_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kpi_configs" (
    "id" "uuid" NOT NULL,
    "role_target" "text" DEFAULT 'ALL'::"text",
    "weight_okr" numeric DEFAULT 50,
    "weight_behavior" numeric DEFAULT 30,
    "weight_attendance" numeric DEFAULT 20,
    "penalty_late_per_time" numeric DEFAULT 0.5,
    "penalty_absent_per_day" numeric DEFAULT 5.0,
    "penalty_missed_duty_per_time" numeric DEFAULT 3.0,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."kpi_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kpi_peer_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_user_id" "uuid" NOT NULL,
    "to_user_id" "uuid" NOT NULL,
    "month_key" "text" NOT NULL,
    "message" "text" NOT NULL,
    "badge" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."kpi_peer_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kpi_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "evaluator_id" "uuid",
    "month_key" "text" NOT NULL,
    "scores" "jsonb" DEFAULT '{}'::"jsonb",
    "feedback" "text",
    "status" "text" DEFAULT 'DRAFT'::"text",
    "total_score" numeric DEFAULT 0,
    "max_score" numeric DEFAULT 0,
    "self_scores" "jsonb",
    "self_feedback" "text",
    "manager_feedback" "text",
    "development_plan" "text",
    "stats_snapshot" "jsonb",
    "final_score_breakdown" "jsonb",
    "weight_config_snapshot" "jsonb",
    "self_reflection_pride" "text",
    "self_reflection_improvement" "text"
);

ALTER TABLE ONLY "public"."kpi_records" REPLICA IDENTITY FULL;


ALTER TABLE "public"."kpi_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leave_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'PENDING'::"text",
    "approver_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "rejection_reason" "text",
    "is_half_day" boolean DEFAULT false,
    "half_day_session" "text",
    "attachment_urls" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."leave_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_option_rules" (
    "master_option_id" "uuid" NOT NULL,
    "xp" integer DEFAULT 0 NOT NULL,
    "hp" integer DEFAULT 0 NOT NULL,
    "coins" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."master_option_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "color" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "parent_key" "text",
    "description" "text",
    "progress_value" integer DEFAULT 0,
    "is_default" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."master_options" REPLICA IDENTITY FULL;


ALTER TABLE "public"."master_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "date" "date" NOT NULL,
    "content" "text",
    "attendees" "text"[] DEFAULT '{}'::"text"[],
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "author_id" "uuid",
    "category" "text" DEFAULT 'GENERAL'::"text",
    "agenda" "jsonb" DEFAULT '[]'::"jsonb",
    "assets" "jsonb" DEFAULT '[]'::"jsonb",
    "decisions" "text",
    "sheets" "jsonb" DEFAULT '[]'::"jsonb",
    "start_time" "text" DEFAULT '09:00'::"text",
    "end_time" "text" DEFAULT '10:00'::"text",
    "attendance" "jsonb" DEFAULT '{}'::"jsonb",
    "reference_meeting_id" "uuid"
);


ALTER TABLE "public"."meeting_logs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."meeting_logs"."start_time" IS 'เวลาเริ่มประชุม (HH:mm)';



COMMENT ON COLUMN "public"."meeting_logs"."end_time" IS 'เวลาสิ้นสุดประชุม (HH:mm)';



COMMENT ON COLUMN "public"."meeting_logs"."attendance" IS 'บันทึกสถานะการเข้าประชุม {userId: "INVITED" | "CONFIRMED" | "DECLINED" | "PRESENT"}';



CREATE TABLE IF NOT EXISTS "public"."nexus_folders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "parent_id" "uuid",
    "color" "text",
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."nexus_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "thumbnail_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "folder_id" "uuid"
);


ALTER TABLE "public"."nexus_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "link_path" "text",
    "related_id" "uuid",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "line_status" "text" DEFAULT 'PENDING'::"text",
    "retry_count" integer DEFAULT 0,
    "last_error" "text",
    "sent_at" timestamp with time zone
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ot_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "duration_hours" numeric(4,2) NOT NULL,
    "reason" "text" NOT NULL,
    "type" character varying(30) NOT NULL,
    "status" character varying(20) DEFAULT 'PENDING'::character varying,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "base_salary_at_time" numeric(10,2),
    "computed_payout" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_fixed" boolean DEFAULT false,
    "attachment_urls" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."ot_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_cycles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "month_key" "text" NOT NULL,
    "status" "text" DEFAULT 'DRAFT'::"text",
    "total_payout" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "finalized_by" "uuid",
    "due_date" timestamp with time zone,
    CONSTRAINT "payroll_cycles_status_check" CHECK (("status" = ANY (ARRAY['DRAFT'::"text", 'WAITING_REVIEW'::"text", 'READY_TO_PAY'::"text", 'PAID'::"text"])))
);


ALTER TABLE "public"."payroll_cycles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_slips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cycle_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "base_salary" numeric DEFAULT 0,
    "ot_hours" numeric DEFAULT 0,
    "ot_pay" numeric DEFAULT 0,
    "bonus" numeric DEFAULT 0,
    "commission" numeric DEFAULT 0,
    "allowance" numeric DEFAULT 0,
    "total_income" numeric DEFAULT 0,
    "tax" numeric DEFAULT 0,
    "sso" numeric DEFAULT 0,
    "leave_deduction" numeric DEFAULT 0,
    "late_deduction" numeric DEFAULT 0,
    "advance_payment" numeric DEFAULT 0,
    "total_deduction" numeric DEFAULT 0,
    "net_total" numeric DEFAULT 0,
    "note" "text",
    "status" "text" DEFAULT 'PENDING'::"text",
    "transfer_slip_url" "text",
    "dispute_reason" "text",
    "acknowledged_at" timestamp with time zone,
    "deduction_snapshot" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "payroll_slips_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'ACKNOWLEDGED'::"text", 'DISPUTED'::"text", 'PAID'::"text"])))
);


ALTER TABLE "public"."payroll_slips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'MEMBER'::"public"."user_role",
    "is_approved" boolean DEFAULT false,
    "position" "text" DEFAULT 'Member'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reason" "text",
    "xp" integer DEFAULT 0,
    "level" integer DEFAULT 1,
    "available_points" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "phone_number" "text",
    "bio" "text",
    "feeling" "text",
    "work_status" "text" DEFAULT 'ONLINE'::"text",
    "leave_start_date" timestamp with time zone,
    "leave_end_date" timestamp with time zone,
    "hp" integer DEFAULT 100,
    "max_hp" integer DEFAULT 100,
    "last_read_chat_at" timestamp with time zone DEFAULT "now"(),
    "last_read_notification_at" timestamp with time zone DEFAULT "now"(),
    "employment_type" "text" DEFAULT 'FULL_TIME'::"text",
    "start_date" "date" DEFAULT CURRENT_DATE,
    "base_salary" numeric DEFAULT 0,
    "bank_account" "text",
    "bank_name" "text",
    "sso_included" boolean DEFAULT true,
    "tax_type" "text" DEFAULT 'WHT_3'::"text",
    "line_user_id" "text",
    "work_days" integer[] DEFAULT '{1,2,3,4,5}'::integer[],
    "death_count" integer DEFAULT 0,
    "hp_depleted_at" timestamp with time zone,
    "status" "text" DEFAULT 'ACTIVE'::"text",
    "avatar_frame" "text" DEFAULT 'NONE'::"text",
    "equipped_frame_id" "text",
    "owned_frame_ids" "text"[] DEFAULT '{}'::"text"[],
    "animated_bg_enabled" boolean DEFAULT true,
    "wave_bg_enabled" boolean DEFAULT true,
    "ultimate_workroom_enabled" boolean DEFAULT true,
    "equipped_bg_id" "text" DEFAULT 'bg-pastel-wave'::"text",
    "owned_bg_ids" "text"[] DEFAULT '{bg-pastel-wave}'::"text"[],
    "emoji" "text" DEFAULT '👾'::"text",
    "first_name" "text",
    "last_name" "text",
    "nickname" "text",
    "accepted_terms_version" integer DEFAULT 0,
    "accepted_terms_at" timestamp with time zone,
    "username" "text",
    "app_version" "text" DEFAULT '1.0.0'::"text"
);

ALTER TABLE ONLY "public"."profiles" REPLICA IDENTITY FULL;


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."work_days" IS 'Array of working days (0=Sun, 1=Mon, ..., 6=Sat)';



COMMENT ON COLUMN "public"."profiles"."equipped_frame_id" IS 'เก็บ ID ของกรอบโปรไฟล์ที่ผู้ใช้ซื้อและติดตั้งจากร้านค้า';



CREATE TABLE IF NOT EXISTS "public"."random_greetings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "text" "text" NOT NULL,
    "category" "text" DEFAULT 'GENERAL'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."random_greetings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."randomizer_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "topic" "text" NOT NULL,
    "created_by" "uuid",
    "winner_ids" "uuid"[] DEFAULT '{}'::"uuid"[]
);


ALTER TABLE "public"."randomizer_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."redemptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reward_id" "uuid" NOT NULL,
    "reward_snapshot" "jsonb",
    "status" "text" DEFAULT 'OWNED'::"text",
    "used_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."redemptions" REPLICA IDENTITY FULL;


ALTER TABLE "public"."redemptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "cost" integer DEFAULT 100 NOT NULL,
    "icon" "text",
    "is_active" boolean DEFAULT true
);

ALTER TABLE ONLY "public"."rewards" REPLICA IDENTITY FULL;


ALTER TABLE "public"."rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roadmap_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#818CF8'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roadmap_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roadmap_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "no" integer NOT NULL,
    "initiative" "text" NOT NULL,
    "category" "text" NOT NULL,
    "status" "text" NOT NULL,
    "progress" integer DEFAULT 0,
    "buffer" "text" DEFAULT '0d'::"text",
    "milestone" "text",
    "start_week" integer NOT NULL,
    "duration_weeks" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "roadmap_tasks_category_check" CHECK (("category" = ANY (ARRAY['TikTok'::"text", 'System'::"text", 'Marketing'::"text", 'Other'::"text"]))),
    CONSTRAINT "roadmap_tasks_duration_weeks_check" CHECK (("duration_weeks" >= 1)),
    CONSTRAINT "roadmap_tasks_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "roadmap_tasks_start_week_check" CHECK ((("start_week" >= 1) AND ("start_week" <= 16))),
    CONSTRAINT "roadmap_tasks_status_check" CHECK (("status" = ANY (ARRAY['Planned'::"text", 'Ongoing'::"text", 'Done'::"text", 'Delayed'::"text"])))
);


ALTER TABLE "public"."roadmap_tasks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."roadmap_tasks_no_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."roadmap_tasks_no_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."roadmap_tasks_no_seq" OWNED BY "public"."roadmap_tasks"."no";



CREATE TABLE IF NOT EXISTS "public"."script_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "script_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "selected_text" "text",
    "highlight_id" "text",
    "status" "text" DEFAULT 'OPEN'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "script_comments_status_check" CHECK (("status" = ANY (ARRAY['OPEN'::"text", 'RESOLVED'::"text"])))
);


ALTER TABLE "public"."script_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shoot_trips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "location_name" "text",
    "date" "date" NOT NULL,
    "status" "text" DEFAULT 'PLANNED'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shoot_trips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" integer DEFAULT 0 NOT NULL,
    "icon" "text",
    "effect_type" "text" NOT NULL,
    "effect_value" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "rarity" "text"
);

ALTER TABLE ONLY "public"."shop_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."shop_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."smart_filters" (
    "id" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "label" "text" NOT NULL,
    "type" "text" NOT NULL,
    "value" "text" NOT NULL,
    "color_theme" "text" NOT NULL,
    "scope" "text" DEFAULT 'CONTENT'::"text",
    "mode" "text" DEFAULT 'INCLUDE'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."smart_filters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."special_work_days" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."special_work_days" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sponsorship_details" (
    "task_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "is_sponsored" boolean DEFAULT true,
    "deal_value" numeric DEFAULT 0,
    "requirements" "text",
    "payment_status" "text" DEFAULT 'UNPAID'::"text",
    "is_paid" boolean DEFAULT false,
    "invoice_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sponsorship_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."storage_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "current_letter" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."storage_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_metadata" (
    "key" "text" NOT NULL,
    "last_updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "task_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "meta_data" "jsonb",
    "content_id" "uuid"
);

ALTER TABLE ONLY "public"."task_comments" REPLICA IDENTITY FULL;


ALTER TABLE "public"."task_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_deadline_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "new_deadline" timestamp with time zone NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    CONSTRAINT "task_deadline_requests_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'APPROVED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."task_deadline_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "task_id" "uuid",
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "details" "text",
    "reason" "text",
    "content_id" "uuid"
);

ALTER TABLE ONLY "public"."task_logs" REPLICA IDENTITY FULL;


ALTER TABLE "public"."task_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "task_id" "uuid",
    "round" integer DEFAULT 1 NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "reviewer_id" "uuid",
    "status" "text" DEFAULT 'PENDING'::"text",
    "feedback" "text",
    "is_completed" boolean DEFAULT false,
    "content_id" "uuid",
    "submission_notes" "text",
    "quality_score" integer DEFAULT 0,
    "feedback_categories" "text"[],
    "submission_asset_url" "text",
    "manual_bonus" numeric DEFAULT 0,
    CONSTRAINT "check_quality_score_range" CHECK ((("quality_score" >= 0) AND ("quality_score" <= 5)))
);

ALTER TABLE ONLY "public"."task_reviews" REPLICA IDENTITY FULL;


ALTER TABLE "public"."task_reviews" OWNER TO "postgres";


COMMENT ON COLUMN "public"."task_reviews"."submission_notes" IS 'Notes from creator during submission';



COMMENT ON COLUMN "public"."task_reviews"."quality_score" IS '1-5 quality rating from reviewer';



COMMENT ON COLUMN "public"."task_reviews"."feedback_categories" IS 'Array of feedback types (e.g., Visual, Technical)';



COMMENT ON COLUMN "public"."task_reviews"."submission_asset_url" IS 'The URL of the asset at the moment of submission';



COMMENT ON COLUMN "public"."task_reviews"."manual_bonus" IS 'Bonus or penalty XP adjusted by reviewer (Single Source of Truth)';



CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "type" "public"."task_type" DEFAULT 'TASK'::"public"."task_type" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "status" "text" DEFAULT 'TODO'::"public"."task_status",
    "priority" "public"."task_priority" DEFAULT 'MEDIUM'::"public"."task_priority",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "assignee_ids" "text"[] DEFAULT '{}'::"text"[],
    "is_unscheduled" boolean DEFAULT false,
    "idea_owner_ids" "text"[] DEFAULT '{}'::"text"[],
    "editor_ids" "text"[] DEFAULT '{}'::"text"[],
    "assets" "jsonb" DEFAULT '[]'::"jsonb",
    "performance" "jsonb",
    "difficulty" "text" DEFAULT 'MEDIUM'::"text",
    "estimated_hours" numeric DEFAULT 0,
    "assignee_type" "text" DEFAULT 'TEAM'::"text",
    "target_position" "text",
    "caution" "text",
    "importance" "text",
    "is_penalized" boolean DEFAULT false,
    "content_id" "uuid",
    "show_on_board" boolean DEFAULT false,
    "last_penalized_at" timestamp with time zone,
    "script_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sla_revert_count" integer DEFAULT 0,
    "roadmap_id" "uuid",
    "drive_label" "text",
    "scheduled_time" "text"
);

ALTER TABLE ONLY "public"."tasks" REPLICA IDENTITY FULL;


ALTER TABLE "public"."tasks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tasks"."sla_revert_count" IS 'จำนวนครั้งที่งานถูกดีดกลับอัตโนมัติเนื่องจาก SLA Expiry';



COMMENT ON COLUMN "public"."tasks"."scheduled_time" IS 'จัดเก็บเวลาที่วางแผนไว้ รูปแบบ HH:mm';



CREATE TABLE IF NOT EXISTS "public"."team_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "content" "text" NOT NULL,
    "user_id" "uuid",
    "is_bot" boolean DEFAULT false,
    "message_type" "text" DEFAULT 'TEXT'::"text"
);

ALTER TABLE ONLY "public"."team_messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."team_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tribunal_reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "target_id" "uuid",
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "evidence_file_id" "text",
    "evidence_url" "text",
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "admin_feedback" "text",
    "reward_hp" integer,
    "reward_points" integer,
    "penalty_hp" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "is_anonymous" boolean DEFAULT false
);


ALTER TABLE "public"."tribunal_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_background_settings" (
    "user_id" "uuid" NOT NULL,
    "background_theme" "text" DEFAULT 'default'::"text" NOT NULL,
    "admin_dashboard_season" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_background_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "is_used" boolean DEFAULT false,
    "used_at" timestamp with time zone,
    "purchased_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."user_inventory" REPLICA IDENTITY FULL;


ALTER TABLE "public"."user_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_screens" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_screens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_quests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "week_start_date" timestamp with time zone NOT NULL,
    "channel_id" "uuid",
    "target_platform" "text",
    "target_count" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "quest_type" "text" DEFAULT 'AUTO'::"text",
    "manual_progress" integer DEFAULT 0,
    "target_format" "text"[],
    "target_status" "text",
    "end_date" "date",
    "group_id" "text",
    "group_title" "text"
);

ALTER TABLE ONLY "public"."weekly_quests" REPLICA IDENTITY FULL;


ALTER TABLE "public"."weekly_quests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wiki_articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "category" "text" DEFAULT 'GENERAL'::"text",
    "target_roles" "text"[] DEFAULT '{ALL}'::"text"[],
    "is_pinned" boolean DEFAULT false,
    "cover_image" "text",
    "helpful_count" integer DEFAULT 0,
    "created_by" "uuid",
    "updated_by" "uuid"
);

ALTER TABLE ONLY "public"."wiki_articles" REPLICA IDENTITY FULL;


ALTER TABLE "public"."wiki_articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wiki_nodes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parent_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "content" "text",
    "type" "text" NOT NULL,
    "icon" "text",
    "color" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "wiki_nodes_type_check" CHECK (("type" = ANY (ARRAY['FOLDER'::"text", 'PAGE'::"text"])))
);


ALTER TABLE "public"."wiki_nodes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workbox_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "is_completed" boolean DEFAULT false NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "progress" integer DEFAULT 0,
    "notes" "text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "workbox_items_type_check" CHECK (("type" = ANY (ARRAY['CONTENT'::"text", 'CHECKLIST'::"text"])))
);


ALTER TABLE "public"."workbox_items" OWNER TO "postgres";


ALTER TABLE ONLY "public"."roadmap_tasks" ALTER COLUMN "no" SET DEFAULT "nextval"('"public"."roadmap_tasks_no_seq"'::"regclass");



ALTER TABLE ONLY "public"."active_checklist_items"
    ADD CONSTRAINT "active_checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."annual_holidays"
    ADD CONSTRAINT "annual_holidays_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_user_id_date_key" UNIQUE ("user_id", "date");



ALTER TABLE ONLY "public"."calendar_exceptions"
    ADD CONSTRAINT "calendar_exceptions_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."calendar_exceptions"
    ADD CONSTRAINT "calendar_exceptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_highlights"
    ADD CONSTRAINT "calendar_highlights_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."calendar_highlights"
    ADD CONSTRAINT "calendar_highlights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."channels"
    ADD CONSTRAINT "channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checklist_items"
    ADD CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checklist_presets_db"
    ADD CONSTRAINT "checklist_presets_db_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_analytics"
    ADD CONSTRAINT "content_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_configs"
    ADD CONSTRAINT "dashboard_configs_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."dashboard_configs"
    ADD CONSTRAINT "dashboard_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."duties"
    ADD CONSTRAINT "duties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."duty_configs"
    ADD CONSTRAINT "duty_configs_pkey" PRIMARY KEY ("day_of_week");



ALTER TABLE ONLY "public"."duty_swaps"
    ADD CONSTRAINT "duty_swaps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_comments"
    ADD CONSTRAINT "feedback_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_reposts"
    ADD CONSTRAINT "feedback_reposts_feedback_id_user_id_key" UNIQUE ("feedback_id", "user_id");



ALTER TABLE ONLY "public"."feedback_reposts"
    ADD CONSTRAINT "feedback_reposts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_votes"
    ADD CONSTRAINT "feedback_votes_feedback_id_user_id_key" UNIQUE ("feedback_id", "user_id");



ALTER TABLE ONLY "public"."feedback_votes"
    ADD CONSTRAINT "feedback_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_transactions"
    ADD CONSTRAINT "finance_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_configs"
    ADD CONSTRAINT "game_configs_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."game_logs"
    ADD CONSTRAINT "game_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_boosts"
    ADD CONSTRAINT "goal_boosts_goal_id_user_id_key" UNIQUE ("goal_id", "user_id");



ALTER TABLE ONLY "public"."goal_boosts"
    ADD CONSTRAINT "goal_boosts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_deadline_requests"
    ADD CONSTRAINT "goal_deadline_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_owners"
    ADD CONSTRAINT "goal_owners_goal_id_user_id_key" UNIQUE ("goal_id", "user_id");



ALTER TABLE ONLY "public"."goal_owners"
    ADD CONSTRAINT "goal_owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hp_death_logs"
    ADD CONSTRAINT "hp_death_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idp_items"
    ADD CONSTRAINT "idp_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."individual_goals"
    ADD CONSTRAINT "individual_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intern_candidates"
    ADD CONSTRAINT "intern_candidates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_configs"
    ADD CONSTRAINT "kpi_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_peer_reviews"
    ADD CONSTRAINT "kpi_peer_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_records"
    ADD CONSTRAINT "kpi_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_records"
    ADD CONSTRAINT "kpi_records_user_id_month_key_key" UNIQUE ("user_id", "month_key");



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_option_rules"
    ADD CONSTRAINT "master_option_rules_pkey" PRIMARY KEY ("master_option_id");



ALTER TABLE ONLY "public"."master_options"
    ADD CONSTRAINT "master_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_options"
    ADD CONSTRAINT "master_options_type_key_key" UNIQUE ("type", "key");



ALTER TABLE ONLY "public"."meeting_logs"
    ADD CONSTRAINT "meeting_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_folders"
    ADD CONSTRAINT "nexus_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_integrations"
    ADD CONSTRAINT "nexus_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ot_requests"
    ADD CONSTRAINT "ot_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_month_key_key" UNIQUE ("month_key");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_slips"
    ADD CONSTRAINT "payroll_slips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."random_greetings"
    ADD CONSTRAINT "random_greetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."randomizer_history"
    ADD CONSTRAINT "randomizer_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."redemptions"
    ADD CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roadmap_categories"
    ADD CONSTRAINT "roadmap_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roadmap_categories"
    ADD CONSTRAINT "roadmap_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roadmap_tasks"
    ADD CONSTRAINT "roadmap_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."script_comments"
    ADD CONSTRAINT "script_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "scripts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "scripts_share_token_key" UNIQUE ("share_token");



ALTER TABLE ONLY "public"."shoot_trips"
    ADD CONSTRAINT "shoot_trips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_items"
    ADD CONSTRAINT "shop_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."smart_filters"
    ADD CONSTRAINT "smart_filters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."special_work_days"
    ADD CONSTRAINT "special_work_days_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."special_work_days"
    ADD CONSTRAINT "special_work_days_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsorship_details"
    ADD CONSTRAINT "sponsorship_details_pkey" PRIMARY KEY ("task_id");



ALTER TABLE ONLY "public"."storage_config"
    ADD CONSTRAINT "storage_config_label_key" UNIQUE ("label");



ALTER TABLE ONLY "public"."storage_config"
    ADD CONSTRAINT "storage_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_metadata"
    ADD CONSTRAINT "system_metadata_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_deadline_requests"
    ADD CONSTRAINT "task_deadline_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_logs"
    ADD CONSTRAINT "task_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_reviews"
    ADD CONSTRAINT "task_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_messages"
    ADD CONSTRAINT "team_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tribunal_reports"
    ADD CONSTRAINT "tribunal_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."smart_filters"
    ADD CONSTRAINT "unique_user_label" UNIQUE ("user_id", "label");



ALTER TABLE ONLY "public"."user_background_settings"
    ADD CONSTRAINT "user_background_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_inventory"
    ADD CONSTRAINT "user_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_screens"
    ADD CONSTRAINT "user_screens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_quests"
    ADD CONSTRAINT "weekly_quests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wiki_articles"
    ADD CONSTRAINT "wiki_articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wiki_nodes"
    ADD CONSTRAINT "wiki_nodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workbox_items"
    ADD CONSTRAINT "workbox_items_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_attendance_logs_date_status" ON "public"."attendance_logs" USING "btree" ("date", "status");



CREATE INDEX "idx_attendance_user_date" ON "public"."attendance_logs" USING "btree" ("user_id", "date");



CREATE INDEX "idx_content_analytics_captured_at" ON "public"."content_analytics" USING "btree" ("captured_at");



CREATE INDEX "idx_content_analytics_content_id" ON "public"."content_analytics" USING "btree" ("content_id");



CREATE INDEX "idx_content_analytics_lookup" ON "public"."content_analytics" USING "btree" ("content_id", "platform", "captured_at");



CREATE INDEX "idx_contents_analytics_status" ON "public"."contents" USING "btree" ("analytics_status");



CREATE INDEX "idx_contents_assignees" ON "public"."contents" USING "gin" ("assignee_ids");



CREATE INDEX "idx_contents_dates" ON "public"."contents" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_contents_has_analytics" ON "public"."contents" USING "btree" ("has_analytics");



CREATE INDEX "idx_contents_is_overdue_analytics" ON "public"."contents" USING "btree" ("is_overdue_analytics");



CREATE INDEX "idx_contents_is_unscheduled" ON "public"."contents" USING "btree" ("is_unscheduled");



CREATE INDEX "idx_contents_posted_at" ON "public"."contents" USING "btree" ("posted_at");



CREATE INDEX "idx_contents_shoot_queue" ON "public"."contents" USING "btree" ("is_in_shoot_queue") WHERE ("is_in_shoot_queue" = true);



CREATE INDEX "idx_contents_status" ON "public"."contents" USING "btree" ("status");



CREATE INDEX "idx_feedbacks_target_user_id" ON "public"."feedbacks" USING "btree" ("target_user_id");



CREATE INDEX "idx_goal_deadline_req_goal_id" ON "public"."goal_deadline_requests" USING "btree" ("goal_id");



CREATE INDEX "idx_goal_deadline_req_status" ON "public"."goal_deadline_requests" USING "btree" ("status") WHERE ("status" = 'PENDING'::"text");



CREATE INDEX "idx_intern_created_at" ON "public"."intern_candidates" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_intern_dates" ON "public"."intern_candidates" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_intern_status" ON "public"."intern_candidates" USING "btree" ("status");



CREATE INDEX "idx_inventory_item_type" ON "public"."inventory_items" USING "btree" ("item_type");



CREATE INDEX "idx_logs_content_id" ON "public"."task_logs" USING "btree" ("content_id");



CREATE INDEX "idx_logs_created_at" ON "public"."task_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_logs_task_id" ON "public"."task_logs" USING "btree" ("task_id");



CREATE INDEX "idx_messages_created_at" ON "public"."team_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_nexus_integrations_user_id" ON "public"."nexus_integrations" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_line_status" ON "public"."notifications" USING "btree" ("line_status");



CREATE INDEX "idx_ot_requests_status" ON "public"."ot_requests" USING "btree" ("status");



CREATE INDEX "idx_ot_requests_user_date" ON "public"."ot_requests" USING "btree" ("user_id", "date");



CREATE INDEX "idx_peer_reviews_month" ON "public"."kpi_peer_reviews" USING "btree" ("month_key");



CREATE INDEX "idx_peer_reviews_to_user" ON "public"."kpi_peer_reviews" USING "btree" ("to_user_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_first_name" ON "public"."profiles" USING "btree" ("first_name");



CREATE INDEX "idx_profiles_hp_depleted_at" ON "public"."profiles" USING "btree" ("hp_depleted_at");



CREATE INDEX "idx_profiles_last_name" ON "public"."profiles" USING "btree" ("last_name");



CREATE INDEX "idx_profiles_line_user_id" ON "public"."profiles" USING "btree" ("line_user_id");



CREATE INDEX "idx_profiles_nickname" ON "public"."profiles" USING "btree" ("nickname");



CREATE INDEX "idx_profiles_status" ON "public"."profiles" USING "btree" ("status");



CREATE INDEX "idx_redemptions_user_status" ON "public"."redemptions" USING "btree" ("user_id", "status");



CREATE INDEX "idx_scripts_author_personal" ON "public"."scripts" USING "btree" ("author_id", "is_personal");



CREATE INDEX "idx_scripts_full_text_search" ON "public"."scripts" USING "gin" (((((("lower"("title") || ' '::"text") || "lower"("content")) || ' '::"text") || "lower"(COALESCE(("sheets")::"text", ''::"text")))) "public"."gin_trgm_ops");



CREATE INDEX "idx_scripts_is_personal" ON "public"."scripts" USING "btree" ("is_personal");



CREATE INDEX "idx_sponsorship_client_id" ON "public"."sponsorship_details" USING "btree" ("client_id");



CREATE INDEX "idx_task_reviews_content_id" ON "public"."task_reviews" USING "btree" ("content_id");



CREATE INDEX "idx_task_reviews_scheduled_at" ON "public"."task_reviews" USING "btree" ("scheduled_at" DESC);



CREATE INDEX "idx_task_reviews_status" ON "public"."task_reviews" USING "btree" ("status");



CREATE INDEX "idx_task_reviews_task_id" ON "public"."task_reviews" USING "btree" ("task_id");



CREATE INDEX "idx_tasks_assignees" ON "public"."tasks" USING "gin" ("assignee_ids");



CREATE INDEX "idx_tasks_content_id" ON "public"."tasks" USING "btree" ("content_id");



CREATE INDEX "idx_tasks_dates" ON "public"."tasks" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_tasks_script_id" ON "public"."tasks" USING "btree" ("script_id");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "idx_tribunal_reports_reporter" ON "public"."tribunal_reports" USING "btree" ("reporter_id");



CREATE INDEX "idx_tribunal_reports_status" ON "public"."tribunal_reports" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_unique_game_action_penalty" ON "public"."game_logs" USING "btree" ("user_id", "action_type", "related_id") WHERE ("related_id" IS NOT NULL);



CREATE INDEX "idx_user_screens_last_seen_at" ON "public"."user_screens" USING "btree" ("last_seen_at");



CREATE INDEX "idx_user_screens_user_id" ON "public"."user_screens" USING "btree" ("user_id");



CREATE INDEX "idx_workbox_user_order" ON "public"."workbox_items" USING "btree" ("user_id", "order_index");



CREATE UNIQUE INDEX "profiles_username_unique" ON "public"."profiles" USING "btree" ("username");



CREATE UNIQUE INDEX "unique_task_round" ON "public"."task_reviews" USING "btree" ("task_id", "round");



CREATE OR REPLACE TRIGGER "trg_on_content_analytics_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."content_analytics" FOR EACH ROW EXECUTE FUNCTION "public"."fn_trg_on_content_analytics_change"();



CREATE OR REPLACE TRIGGER "trg_on_contents_target_platform_change" AFTER INSERT OR UPDATE OF "target_platform" ON "public"."contents" FOR EACH ROW EXECUTE FUNCTION "public"."fn_trg_on_contents_target_platform_change"();



CREATE OR REPLACE TRIGGER "trg_reschedule_absent_cron" AFTER INSERT OR UPDATE ON "public"."master_options" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_and_reschedule_absent_cron"();



CREATE OR REPLACE TRIGGER "trg_reschedule_checkin_cron" AFTER INSERT OR UPDATE ON "public"."master_options" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_and_reschedule_checkin_cron"();



CREATE OR REPLACE TRIGGER "trg_reschedule_checkout_cron" AFTER INSERT OR UPDATE ON "public"."master_options" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_and_reschedule_checkout_cron"();



CREATE OR REPLACE TRIGGER "trg_reschedule_monthly_bonus_cron" AFTER INSERT OR UPDATE ON "public"."master_options" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_and_reschedule_monthly_bonus_cron"();



CREATE OR REPLACE TRIGGER "trg_reschedule_monthly_ot_cron" AFTER INSERT OR UPDATE ON "public"."master_options" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_and_reschedule_monthly_ot_cron"();



CREATE OR REPLACE TRIGGER "trg_reschedule_ot_summary_cron" AFTER INSERT OR UPDATE ON "public"."master_options" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_and_reschedule_ot_summary_cron"();



CREATE OR REPLACE TRIGGER "trg_reschedule_summary_cron" AFTER INSERT OR UPDATE ON "public"."master_options" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_and_reschedule_summary_cron"();



CREATE OR REPLACE TRIGGER "trg_sync_analytics_on_content_change" AFTER UPDATE OF "target_platform", "status", "end_date", "is_unscheduled" ON "public"."contents" FOR EACH ROW EXECUTE FUNCTION "public"."sync_content_analytics_status_fn"();



CREATE OR REPLACE TRIGGER "trg_sync_analytics_on_log" AFTER INSERT OR DELETE OR UPDATE ON "public"."content_analytics" FOR EACH ROW EXECUTE FUNCTION "public"."sync_content_analytics_status_fn"();



CREATE OR REPLACE TRIGGER "trg_sync_master_option_rules" AFTER INSERT OR DELETE OR UPDATE ON "public"."master_option_rules" FOR EACH STATEMENT EXECUTE FUNCTION "public"."sync_master_option_rules_to_game_configs"();



CREATE OR REPLACE TRIGGER "trg_sync_master_option_rules_on_options" AFTER UPDATE OF "key" ON "public"."master_options" FOR EACH STATEMENT EXECUTE FUNCTION "public"."sync_master_option_rules_to_game_configs"();



CREATE OR REPLACE TRIGGER "trigger-line-noti" AFTER INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://ajkycqazreebczqjsfpv.supabase.co/functions/v1/push-to-line', 'POST', '{}', '{}', '5000');



CREATE OR REPLACE TRIGGER "trigger_enforce_user_screen_limits" BEFORE INSERT OR UPDATE ON "public"."user_screens" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_user_screen_limits"();



CREATE OR REPLACE TRIGGER "trigger_update_master_options_version" AFTER INSERT OR DELETE OR UPDATE ON "public"."master_options" FOR EACH STATEMENT EXECUTE FUNCTION "public"."update_master_options_version"();



CREATE OR REPLACE TRIGGER "trigger_update_wiki_version" AFTER INSERT OR DELETE OR UPDATE ON "public"."wiki_articles" FOR EACH STATEMENT EXECUTE FUNCTION "public"."update_wiki_version"();



CREATE OR REPLACE TRIGGER "update_channels_updated_at" BEFORE UPDATE ON "public"."channels" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_content_analytics_updated_at" BEFORE UPDATE ON "public"."content_analytics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sponsorship_details_modtime" BEFORE UPDATE ON "public"."sponsorship_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_wiki_nodes_updated_at" BEFORE UPDATE ON "public"."wiki_nodes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_exceptions"
    ADD CONSTRAINT "calendar_exceptions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."calendar_highlights"
    ADD CONSTRAINT "calendar_highlights_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_shoot_trip_id_fkey" FOREIGN KEY ("shoot_trip_id") REFERENCES "public"."shoot_trips"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."duties"
    ADD CONSTRAINT "duties_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."duty_swaps"
    ADD CONSTRAINT "duty_swaps_own_duty_id_fkey" FOREIGN KEY ("own_duty_id") REFERENCES "public"."duties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."duty_swaps"
    ADD CONSTRAINT "duty_swaps_requestor_id_fkey" FOREIGN KEY ("requestor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."duty_swaps"
    ADD CONSTRAINT "duty_swaps_target_duty_id_fkey" FOREIGN KEY ("target_duty_id") REFERENCES "public"."duties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_comments"
    ADD CONSTRAINT "feedback_comments_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedbacks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_comments"
    ADD CONSTRAINT "feedback_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_reposts"
    ADD CONSTRAINT "feedback_reposts_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedbacks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_reposts"
    ADD CONSTRAINT "feedback_reposts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_votes"
    ADD CONSTRAINT "feedback_votes_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedbacks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_votes"
    ADD CONSTRAINT "feedback_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."finance_transactions"
    ADD CONSTRAINT "finance_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."finance_transactions"
    ADD CONSTRAINT "finance_transactions_shoot_trip_id_fkey" FOREIGN KEY ("shoot_trip_id") REFERENCES "public"."shoot_trips"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."finance_transactions"
    ADD CONSTRAINT "finance_transactions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_analytics"
    ADD CONSTRAINT "fk_content_analytics_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "fk_scripts_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sponsorship_details"
    ADD CONSTRAINT "fk_sponsorship_details_contents" FOREIGN KEY ("task_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "fk_task_comments_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "fk_task_comments_tasks" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_deadline_requests"
    ADD CONSTRAINT "fk_task_deadline_requests_task" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_logs"
    ADD CONSTRAINT "fk_task_logs_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_logs"
    ADD CONSTRAINT "fk_task_logs_tasks" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_reviews"
    ADD CONSTRAINT "fk_task_reviews_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_reviews"
    ADD CONSTRAINT "fk_task_reviews_tasks" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "fk_tasks_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "fk_tasks_scripts" FOREIGN KEY ("script_id") REFERENCES "public"."scripts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workbox_items"
    ADD CONSTRAINT "fk_workbox_items_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_logs"
    ADD CONSTRAINT "game_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_boosts"
    ADD CONSTRAINT "goal_boosts_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_boosts"
    ADD CONSTRAINT "goal_boosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_deadline_requests"
    ADD CONSTRAINT "goal_deadline_requests_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_deadline_requests"
    ADD CONSTRAINT "goal_deadline_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_deadline_requests"
    ADD CONSTRAINT "goal_deadline_requests_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."goal_owners"
    ADD CONSTRAINT "goal_owners_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_owners"
    ADD CONSTRAINT "goal_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hp_death_logs"
    ADD CONSTRAINT "hp_death_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idp_items"
    ADD CONSTRAINT "idp_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."individual_goals"
    ADD CONSTRAINT "individual_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."intern_candidates"
    ADD CONSTRAINT "intern_candidates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_current_holder_id_fkey" FOREIGN KEY ("current_holder_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."kpi_peer_reviews"
    ADD CONSTRAINT "kpi_peer_reviews_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kpi_peer_reviews"
    ADD CONSTRAINT "kpi_peer_reviews_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kpi_records"
    ADD CONSTRAINT "kpi_records_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."kpi_records"
    ADD CONSTRAINT "kpi_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."master_option_rules"
    ADD CONSTRAINT "master_option_rules_master_option_id_fkey" FOREIGN KEY ("master_option_id") REFERENCES "public"."master_options"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_logs"
    ADD CONSTRAINT "meeting_logs_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meeting_logs"
    ADD CONSTRAINT "meeting_logs_reference_meeting_id_fkey" FOREIGN KEY ("reference_meeting_id") REFERENCES "public"."meeting_logs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_folders"
    ADD CONSTRAINT "nexus_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."nexus_folders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_folders"
    ADD CONSTRAINT "nexus_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_integrations"
    ADD CONSTRAINT "nexus_integrations_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."nexus_folders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_integrations"
    ADD CONSTRAINT "nexus_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ot_requests"
    ADD CONSTRAINT "ot_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."ot_requests"
    ADD CONSTRAINT "ot_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_finalized_by_fkey" FOREIGN KEY ("finalized_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll_slips"
    ADD CONSTRAINT "payroll_slips_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "public"."payroll_cycles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll_slips"
    ADD CONSTRAINT "payroll_slips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."randomizer_history"
    ADD CONSTRAINT "randomizer_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."redemptions"
    ADD CONSTRAINT "redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."redemptions"
    ADD CONSTRAINT "redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."script_comments"
    ADD CONSTRAINT "script_comments_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "public"."scripts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."script_comments"
    ADD CONSTRAINT "script_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "scripts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "scripts_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "scripts_idea_owner_id_fkey" FOREIGN KEY ("idea_owner_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "scripts_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."smart_filters"
    ADD CONSTRAINT "smart_filters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sponsorship_details"
    ADD CONSTRAINT "sponsorship_details_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_deadline_requests"
    ADD CONSTRAINT "task_deadline_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_deadline_requests"
    ADD CONSTRAINT "task_deadline_requests_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_logs"
    ADD CONSTRAINT "task_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_reviews"
    ADD CONSTRAINT "task_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmap_tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."team_messages"
    ADD CONSTRAINT "team_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tribunal_reports"
    ADD CONSTRAINT "tribunal_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tribunal_reports"
    ADD CONSTRAINT "tribunal_reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tribunal_reports"
    ADD CONSTRAINT "tribunal_reports_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_background_settings"
    ADD CONSTRAINT "user_background_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_inventory"
    ADD CONSTRAINT "user_inventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."shop_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_inventory"
    ADD CONSTRAINT "user_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_screens"
    ADD CONSTRAINT "user_screens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_quests"
    ADD CONSTRAINT "weekly_quests_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wiki_articles"
    ADD CONSTRAINT "wiki_articles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wiki_articles"
    ADD CONSTRAINT "wiki_articles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wiki_nodes"
    ADD CONSTRAINT "wiki_nodes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wiki_nodes"
    ADD CONSTRAINT "wiki_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."wiki_nodes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workbox_items"
    ADD CONSTRAINT "workbox_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin manage cycles" ON "public"."payroll_cycles" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admin manage goals" ON "public"."individual_goals" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admin manage kpi_configs" ON "public"."kpi_configs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admin manage slips" ON "public"."payroll_slips" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admin update profiles" ON "public"."profiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'ADMIN'::"public"."user_role") AND ("profiles_1"."is_approved" = true)))));



CREATE POLICY "Admins can delete attendance_logs" ON "public"."attendance_logs" FOR DELETE USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role"));



CREATE POLICY "Admins can insert attendance_logs" ON "public"."attendance_logs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role"));



CREATE POLICY "Admins can manage all reports" ON "public"."tribunal_reports" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins can manage calendar exceptions" ON "public"."calendar_exceptions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins can manage special work days" ON "public"."special_work_days" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins can update attendance_logs" ON "public"."attendance_logs" FOR UPDATE TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role"));



CREATE POLICY "Admins can update feedbacks" ON "public"."feedbacks" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins can update requests" ON "public"."leave_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins can view all death logs" ON "public"."hp_death_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins can view all requests" ON "public"."leave_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins or owners can delete feedbacks" ON "public"."feedbacks" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role"))))));



CREATE POLICY "Allow admins or owners to update interns" ON "public"."intern_candidates" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))) OR ("auth"."uid"() = "created_by"))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))) OR ("auth"."uid"() = "created_by")));



CREATE POLICY "Allow admins to delete goal_deadline_requests" ON "public"."goal_deadline_requests" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Allow admins to manage wiki nodes" ON "public"."wiki_nodes" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Allow admins to update goal_deadline_requests" ON "public"."goal_deadline_requests" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Allow all for authenticated users on clients" ON "public"."clients" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow all for authenticated users on sponsorship_details" ON "public"."sponsorship_details" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow all users to read wiki nodes" ON "public"."wiki_nodes" FOR SELECT USING (true);



CREATE POLICY "Allow anyone to read holidays" ON "public"."annual_holidays" FOR SELECT USING (true);



CREATE POLICY "Allow authenticated delete" ON "public"."channels" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated insert" ON "public"."channels" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated to delete analytics" ON "public"."content_analytics" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated to insert analytics" ON "public"."content_analytics" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated to select analytics" ON "public"."content_analytics" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated to update analytics" ON "public"."content_analytics" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated update" ON "public"."channels" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated update" ON "public"."game_configs" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to insert interns" ON "public"."intern_candidates" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Allow authenticated users to manage roadmap" ON "public"."roadmap_tasks" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to manage their own screen sessions" ON "public"."user_screens" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated users to manage wiki nodes" ON "public"."wiki_nodes" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to read goal_deadline_requests" ON "public"."goal_deadline_requests" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read wiki nodes" ON "public"."wiki_nodes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to update system_metadata" ON "public"."system_metadata" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to view interns" ON "public"."intern_candidates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow individuals to delete their own background settings" ON "public"."user_background_settings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow individuals to insert their own background settings" ON "public"."user_background_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow individuals to select their own background settings" ON "public"."user_background_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow individuals to update their own background settings" ON "public"."user_background_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow insert for authenticated users" ON "public"."storage_config" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow insert for authenticated users" ON "public"."system_metadata" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow insert for authenticated users" ON "public"."task_deadline_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "requested_by"));



CREATE POLICY "Allow only admins to delete interns" ON "public"."intern_candidates" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Allow only authenticated users to manage holidays" ON "public"."annual_holidays" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public delete on roadmap_categories" ON "public"."roadmap_categories" FOR DELETE USING (true);



CREATE POLICY "Allow public delete on roadmap_tasks" ON "public"."roadmap_tasks" FOR DELETE USING (true);



CREATE POLICY "Allow public insert on roadmap_categories" ON "public"."roadmap_categories" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert on roadmap_tasks" ON "public"."roadmap_tasks" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert/update access" ON "public"."game_configs" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public read access" ON "public"."channels" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."game_configs" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."master_option_rules" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."master_options" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to system_metadata" ON "public"."system_metadata" FOR SELECT USING (true);



CREATE POLICY "Allow public read on roadmap_categories" ON "public"."roadmap_categories" FOR SELECT USING (true);



CREATE POLICY "Allow public read on roadmap_tasks" ON "public"."roadmap_tasks" FOR SELECT USING (true);



CREATE POLICY "Allow public update on roadmap_tasks" ON "public"."roadmap_tasks" FOR UPDATE USING (true);



CREATE POLICY "Allow read access for all users" ON "public"."task_deadline_requests" FOR SELECT USING (true);



CREATE POLICY "Allow select for authenticated users" ON "public"."storage_config" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow update for admins" ON "public"."task_deadline_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Allow users to insert their own goal_deadline_requests" ON "public"."goal_deadline_requests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "requested_by"));



CREATE POLICY "Anyone can read randomizer history" ON "public"."randomizer_history" FOR SELECT USING (true);



CREATE POLICY "Anyone can read system settings" ON "public"."system_settings" FOR SELECT USING (true);



CREATE POLICY "Anyone can view calendar exceptions" ON "public"."calendar_exceptions" FOR SELECT USING (true);



CREATE POLICY "Anyone can view feedback comments" ON "public"."feedback_comments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view feedback reposts" ON "public"."feedback_reposts" FOR SELECT USING (true);



CREATE POLICY "Anyone can view feedback votes" ON "public"."feedback_votes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view feedbacks" ON "public"."feedbacks" FOR SELECT USING (true);



CREATE POLICY "Anyone can view special work days" ON "public"."special_work_days" FOR SELECT USING (true);



CREATE POLICY "Approved access channels" ON "public"."channels" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_approved" = true)))));



CREATE POLICY "Approved access checklist" ON "public"."checklist_items" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_approved" = true)))));



CREATE POLICY "Approved members can delete data" ON "public"."tasks" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_approved" = true)))));



CREATE POLICY "Approved members can insert data" ON "public"."tasks" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_approved" = true)))));



CREATE POLICY "Approved members can read data" ON "public"."tasks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_approved" = true)))));



CREATE POLICY "Approved members can update data" ON "public"."tasks" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_approved" = true)))));



CREATE POLICY "Authenticated users can comment" ON "public"."feedback_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can create feedbacks" ON "public"."feedbacks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can insert randomizer history" ON "public"."randomizer_history" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can repost" ON "public"."feedback_reposts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can vote" ON "public"."feedback_votes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Create reviews" ON "public"."kpi_peer_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Delete own reviews" ON "public"."kpi_peer_reviews" FOR DELETE USING (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Enable access for authenticated users" ON "public"."task_logs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable access for authenticated users" ON "public"."task_reviews" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable access for votes" ON "public"."feedback_votes" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for all users" ON "public"."weekly_quests" USING (true);



CREATE POLICY "Enable all access for authenticated users" ON "public"."active_checklist_items" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."calendar_highlights" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."channels" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."checklist_items" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."checklist_presets_db" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."contents" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."dashboard_configs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."duties" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."duty_configs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."duty_swaps" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."finance_transactions" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."game_logs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."goal_boosts" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."goal_owners" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."goals" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."inventory_items" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."kpi_records" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."master_option_rules" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."master_options" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."meeting_logs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."profiles" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."redemptions" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."rewards" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."scripts" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."shoot_trips" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."shop_items" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."task_comments" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."task_logs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."task_reviews" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."tasks" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."team_messages" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."user_inventory" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."weekly_quests" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."wiki_articles" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for all users" ON "public"."channels" FOR DELETE USING (true);



CREATE POLICY "Enable delete for all users" ON "public"."storage_config" FOR DELETE USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."payroll_slips" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for own comments" ON "public"."script_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable delete for users" ON "public"."feedbacks" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."task_comments" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."team_messages" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for all users" ON "public"."channels" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for all users" ON "public"."storage_config" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."feedbacks" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."payroll_cycles" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."payroll_slips" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."script_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for own logs" ON "public"."attendance_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for system" ON "public"."game_logs" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."calendar_exceptions" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."channels" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."duty_configs" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."game_configs" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."payroll_cycles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."payroll_slips" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."script_comments" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."storage_config" FOR SELECT USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."feedbacks" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."random_greetings" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read for authenticated" ON "public"."game_logs" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read for authenticated" ON "public"."shop_items" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read for authenticated" ON "public"."user_inventory" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable status update for collaborators" ON "public"."script_comments" FOR UPDATE USING (true) WITH CHECK (("status" IS DISTINCT FROM 'OPEN'::"text"));



CREATE POLICY "Enable update for all users" ON "public"."channels" FOR UPDATE USING (true);



CREATE POLICY "Enable update for all users" ON "public"."profiles" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for all users" ON "public"."storage_config" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."feedbacks" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users" ON "public"."game_configs" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users" ON "public"."payroll_cycles" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users" ON "public"."payroll_slips" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for own comments" ON "public"."script_comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable update for own logs or admin" ON "public"."attendance_logs" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role"))))));



CREATE POLICY "Enable write access for admins only" ON "public"."calendar_exceptions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Enable write access for authenticated users" ON "public"."dashboard_configs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable write access for authenticated users" ON "public"."duty_configs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable write access for authenticated users" ON "public"."random_greetings" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable write for authenticated" ON "public"."user_inventory" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Insert/Update Analytics" ON "public"."content_analytics" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Manage IDP" ON "public"."idp_items" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role"))))));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public view shared scripts" ON "public"."scripts" FOR SELECT USING ((("is_public" = true) AND ("share_token" IS NOT NULL)));



CREATE POLICY "Read IDP" ON "public"."idp_items" FOR SELECT USING (true);



CREATE POLICY "Read goals" ON "public"."individual_goals" FOR SELECT USING (true);



CREATE POLICY "Read kpi_configs" ON "public"."kpi_configs" FOR SELECT USING (true);



CREATE POLICY "Read profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Read reviews" ON "public"."kpi_peer_reviews" FOR SELECT USING (true);



CREATE POLICY "Select Analytics" ON "public"."content_analytics" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "System/Admin can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "User read own slips" ON "public"."payroll_slips" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users and admins can delete leave requests" ON "public"."leave_requests" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users and admins can insert leave requests" ON "public"."leave_requests" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users and admins can update leave requests" ON "public"."leave_requests" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role"))) WITH CHECK ((("auth"."uid"() = "user_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users and admins can view leave requests" ON "public"."leave_requests" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users can create requests" ON "public"."leave_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own folders" ON "public"."nexus_folders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can delete own pending ot_requests" ON "public"."ot_requests" FOR DELETE USING (((("auth"."uid"() = "user_id") AND (("status")::"text" = 'PENDING'::"text")) OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users can delete randomizer history" ON "public"."randomizer_history" FOR DELETE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can delete their own comment" ON "public"."feedback_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own folders" ON "public"."nexus_folders" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own nexus integrations" ON "public"."nexus_integrations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own smart filters" ON "public"."smart_filters" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert own ot_requests" ON "public"."ot_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own death logs" ON "public"."hp_death_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own nexus integrations" ON "public"."nexus_integrations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own reports" ON "public"."tribunal_reports" FOR INSERT WITH CHECK (("reporter_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own smart filters" ON "public"."smart_filters" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own attendance" ON "public"."attendance_logs" USING ((("auth"."uid"() = "user_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users can manage own pending ot_requests" ON "public"."ot_requests" FOR UPDATE USING (((("auth"."uid"() = "user_id") AND (("status")::"text" = 'PENDING'::"text")) OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users can manage their own integrations" ON "public"."nexus_integrations" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own screen entries" ON "public"."user_screens" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own workbox items" ON "public"."workbox_items" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can remove their own repost" ON "public"."feedback_reposts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can remove their own vote" ON "public"."feedback_votes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own pending leave_requests" ON "public"."leave_requests" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND ("status" = 'PENDING'::"text")));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own folders" ON "public"."nexus_folders" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own pending requests" ON "public"."leave_requests" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") AND ("status" = 'PENDING'::"text"))) WITH CHECK ((("auth"."uid"() = "user_id") AND ("status" = 'REJECTED'::"text")));



CREATE POLICY "Users can update their own smart filters" ON "public"."smart_filters" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own attendance" ON "public"."attendance_logs" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own ot_requests" ON "public"."ot_requests" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users can view their own death logs" ON "public"."hp_death_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own folders" ON "public"."nexus_folders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own nexus integrations" ON "public"."nexus_integrations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own reports" ON "public"."tribunal_reports" FOR SELECT USING (("reporter_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own requests" ON "public"."leave_requests" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own smart filters" ON "public"."smart_filters" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."active_checklist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."annual_holidays" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_exceptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_highlights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checklist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checklist_presets_db" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dashboard_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."duties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."duty_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."duty_swaps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback_reposts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedbacks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."finance_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_boosts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_deadline_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_owners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hp_death_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."idp_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."individual_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intern_candidates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kpi_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kpi_peer_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kpi_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leave_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."master_option_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."master_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ot_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll_cycles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll_slips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."random_greetings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."randomizer_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "realtime read" ON "public"."calendar_highlights" FOR SELECT USING (true);



ALTER TABLE "public"."redemptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roadmap_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roadmap_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."script_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scripts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shoot_trips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."smart_filters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."special_work_days" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsorship_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."storage_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_deadline_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tribunal_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_background_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_screens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weekly_quests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wiki_articles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wiki_nodes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workbox_items" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."active_checklist_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."annual_holidays";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."attendance_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."calendar_exceptions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."calendar_highlights";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."channels";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."checklist_presets_db";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."content_analytics";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."contents";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."dashboard_configs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."duties";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."duty_configs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."duty_swaps";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."finance_transactions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."game_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."goal_boosts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."goal_deadline_requests";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."goal_owners";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."goals";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."hp_death_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."idp_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."individual_goals";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."inventory_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."kpi_configs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."kpi_peer_reviews";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."kpi_records";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."leave_requests";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."master_options";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ot_requests";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."payroll_cycles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."payroll_slips";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."redemptions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rewards";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."script_comments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."scripts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."shoot_trips";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."shop_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."task_comments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."task_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."task_reviews";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."tasks";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."team_messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_inventory";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_screens";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."weekly_quests";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."wiki_articles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."wiki_nodes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."workbox_items";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";















































































































































































































GRANT ALL ON FUNCTION "public"."check_in_reminder_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_in_reminder_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_in_reminder_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."checkout_reminder_cron"("target_shift_start" time without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."checkout_reminder_cron"("target_shift_start" time without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkout_reminder_cron"("target_shift_start" time without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_user_screen_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_user_screen_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_user_screen_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_trg_on_content_analytics_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_trg_on_content_analytics_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_trg_on_content_analytics_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_trg_on_contents_target_platform_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_trg_on_contents_target_platform_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_trg_on_contents_target_platform_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_update_content_analytics_status"("p_content_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_update_content_analytics_status"("p_content_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_update_content_analytics_status"("p_content_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."forgot_checkout_penalty_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."forgot_checkout_penalty_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."forgot_checkout_penalty_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_daily_attendance_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_daily_attendance_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_daily_attendance_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_monthly_bonus_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_monthly_bonus_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_monthly_bonus_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_monthly_ot_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_monthly_ot_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_monthly_ot_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_db_size"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_db_size"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_db_size"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_finance_stats"("start_date" "date", "end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_finance_stats"("start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_finance_stats"("start_date" "date", "end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mapped_shift"("check_in_timestamp" timestamp with time zone, "shifts_list_val" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_mapped_shift"("check_in_timestamp" timestamp with time zone, "shifts_list_val" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mapped_shift"("check_in_timestamp" timestamp with time zone, "shifts_list_val" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_working_day_db"("check_date" "date", "check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_working_day_db"("check_date" "date", "check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_working_day_db"("check_date" "date", "check_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."jsonb_array_elements_text"("arr" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."jsonb_array_elements_text"("arr" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jsonb_array_elements_text"("arr" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_absent_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_absent_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_absent_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_checkin_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_checkin_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_checkin_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_checkout_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_checkout_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_checkout_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_monthly_bonus_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_monthly_bonus_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_monthly_bonus_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_monthly_ot_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_monthly_ot_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_monthly_ot_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_ot_summary_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_ot_summary_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_ot_summary_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_summary_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_summary_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_summary_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."same_day_absent_penalty_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."same_day_absent_penalty_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."same_day_absent_penalty_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON TABLE "public"."scripts" TO "anon";
GRANT ALL ON TABLE "public"."scripts" TO "authenticated";
GRANT ALL ON TABLE "public"."scripts" TO "service_role";



GRANT ALL ON FUNCTION "public"."sheets_text"("s" "public"."scripts") TO "anon";
GRANT ALL ON FUNCTION "public"."sheets_text"("s" "public"."scripts") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sheets_text"("s" "public"."scripts") TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_content_analytics_status_fn"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_content_analytics_status_fn"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_content_analytics_status_fn"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_master_option_rules_to_game_configs"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_master_option_rules_to_game_configs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_master_option_rules_to_game_configs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_master_options_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_master_options_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_master_options_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_wiki_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_wiki_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_wiki_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";






























GRANT ALL ON TABLE "public"."active_checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."active_checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."active_checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."annual_holidays" TO "anon";
GRANT ALL ON TABLE "public"."annual_holidays" TO "authenticated";
GRANT ALL ON TABLE "public"."annual_holidays" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_logs" TO "anon";
GRANT ALL ON TABLE "public"."attendance_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_logs" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_exceptions" TO "anon";
GRANT ALL ON TABLE "public"."calendar_exceptions" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_exceptions" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_highlights" TO "anon";
GRANT ALL ON TABLE "public"."calendar_highlights" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_highlights" TO "service_role";



GRANT ALL ON TABLE "public"."channels" TO "anon";
GRANT ALL ON TABLE "public"."channels" TO "authenticated";
GRANT ALL ON TABLE "public"."channels" TO "service_role";



GRANT ALL ON TABLE "public"."checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."checklist_presets_db" TO "anon";
GRANT ALL ON TABLE "public"."checklist_presets_db" TO "authenticated";
GRANT ALL ON TABLE "public"."checklist_presets_db" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."content_analytics" TO "anon";
GRANT ALL ON TABLE "public"."content_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."content_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."contents" TO "anon";
GRANT ALL ON TABLE "public"."contents" TO "authenticated";
GRANT ALL ON TABLE "public"."contents" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_configs" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_configs" TO "service_role";



GRANT ALL ON TABLE "public"."duties" TO "anon";
GRANT ALL ON TABLE "public"."duties" TO "authenticated";
GRANT ALL ON TABLE "public"."duties" TO "service_role";



GRANT ALL ON TABLE "public"."duty_configs" TO "anon";
GRANT ALL ON TABLE "public"."duty_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."duty_configs" TO "service_role";



GRANT ALL ON TABLE "public"."duty_swaps" TO "anon";
GRANT ALL ON TABLE "public"."duty_swaps" TO "authenticated";
GRANT ALL ON TABLE "public"."duty_swaps" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_comments" TO "anon";
GRANT ALL ON TABLE "public"."feedback_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_comments" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_reposts" TO "anon";
GRANT ALL ON TABLE "public"."feedback_reposts" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_reposts" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_votes" TO "anon";
GRANT ALL ON TABLE "public"."feedback_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_votes" TO "service_role";



GRANT ALL ON TABLE "public"."feedbacks" TO "anon";
GRANT ALL ON TABLE "public"."feedbacks" TO "authenticated";
GRANT ALL ON TABLE "public"."feedbacks" TO "service_role";



GRANT ALL ON TABLE "public"."finance_transactions" TO "anon";
GRANT ALL ON TABLE "public"."finance_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."game_configs" TO "anon";
GRANT ALL ON TABLE "public"."game_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."game_configs" TO "service_role";



GRANT ALL ON TABLE "public"."game_logs" TO "anon";
GRANT ALL ON TABLE "public"."game_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."game_logs" TO "service_role";



GRANT ALL ON TABLE "public"."goal_boosts" TO "anon";
GRANT ALL ON TABLE "public"."goal_boosts" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_boosts" TO "service_role";



GRANT ALL ON TABLE "public"."goal_deadline_requests" TO "anon";
GRANT ALL ON TABLE "public"."goal_deadline_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_deadline_requests" TO "service_role";



GRANT ALL ON TABLE "public"."goal_owners" TO "anon";
GRANT ALL ON TABLE "public"."goal_owners" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_owners" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."hp_death_logs" TO "anon";
GRANT ALL ON TABLE "public"."hp_death_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."hp_death_logs" TO "service_role";



GRANT ALL ON TABLE "public"."idp_items" TO "anon";
GRANT ALL ON TABLE "public"."idp_items" TO "authenticated";
GRANT ALL ON TABLE "public"."idp_items" TO "service_role";



GRANT ALL ON TABLE "public"."individual_goals" TO "anon";
GRANT ALL ON TABLE "public"."individual_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."individual_goals" TO "service_role";



GRANT ALL ON TABLE "public"."intern_candidates" TO "anon";
GRANT ALL ON TABLE "public"."intern_candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."intern_candidates" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_items" TO "anon";
GRANT ALL ON TABLE "public"."inventory_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_items" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_configs" TO "anon";
GRANT ALL ON TABLE "public"."kpi_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_configs" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_peer_reviews" TO "anon";
GRANT ALL ON TABLE "public"."kpi_peer_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_peer_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_records" TO "anon";
GRANT ALL ON TABLE "public"."kpi_records" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_records" TO "service_role";



GRANT ALL ON TABLE "public"."leave_requests" TO "anon";
GRANT ALL ON TABLE "public"."leave_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_requests" TO "service_role";



GRANT ALL ON TABLE "public"."master_option_rules" TO "anon";
GRANT ALL ON TABLE "public"."master_option_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."master_option_rules" TO "service_role";



GRANT ALL ON TABLE "public"."master_options" TO "anon";
GRANT ALL ON TABLE "public"."master_options" TO "authenticated";
GRANT ALL ON TABLE "public"."master_options" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_logs" TO "anon";
GRANT ALL ON TABLE "public"."meeting_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_logs" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_folders" TO "anon";
GRANT ALL ON TABLE "public"."nexus_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_folders" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_integrations" TO "anon";
GRANT ALL ON TABLE "public"."nexus_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."ot_requests" TO "anon";
GRANT ALL ON TABLE "public"."ot_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."ot_requests" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_cycles" TO "anon";
GRANT ALL ON TABLE "public"."payroll_cycles" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_cycles" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_slips" TO "anon";
GRANT ALL ON TABLE "public"."payroll_slips" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_slips" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."random_greetings" TO "anon";
GRANT ALL ON TABLE "public"."random_greetings" TO "authenticated";
GRANT ALL ON TABLE "public"."random_greetings" TO "service_role";



GRANT ALL ON TABLE "public"."randomizer_history" TO "anon";
GRANT ALL ON TABLE "public"."randomizer_history" TO "authenticated";
GRANT ALL ON TABLE "public"."randomizer_history" TO "service_role";



GRANT ALL ON TABLE "public"."redemptions" TO "anon";
GRANT ALL ON TABLE "public"."redemptions" TO "authenticated";
GRANT ALL ON TABLE "public"."redemptions" TO "service_role";



GRANT ALL ON TABLE "public"."rewards" TO "anon";
GRANT ALL ON TABLE "public"."rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."rewards" TO "service_role";



GRANT ALL ON TABLE "public"."roadmap_categories" TO "anon";
GRANT ALL ON TABLE "public"."roadmap_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."roadmap_categories" TO "service_role";



GRANT ALL ON TABLE "public"."roadmap_tasks" TO "anon";
GRANT ALL ON TABLE "public"."roadmap_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."roadmap_tasks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."roadmap_tasks_no_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roadmap_tasks_no_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roadmap_tasks_no_seq" TO "service_role";



GRANT ALL ON TABLE "public"."script_comments" TO "anon";
GRANT ALL ON TABLE "public"."script_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."script_comments" TO "service_role";



GRANT ALL ON TABLE "public"."shoot_trips" TO "anon";
GRANT ALL ON TABLE "public"."shoot_trips" TO "authenticated";
GRANT ALL ON TABLE "public"."shoot_trips" TO "service_role";



GRANT ALL ON TABLE "public"."shop_items" TO "anon";
GRANT ALL ON TABLE "public"."shop_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_items" TO "service_role";



GRANT ALL ON TABLE "public"."smart_filters" TO "anon";
GRANT ALL ON TABLE "public"."smart_filters" TO "authenticated";
GRANT ALL ON TABLE "public"."smart_filters" TO "service_role";



GRANT ALL ON TABLE "public"."special_work_days" TO "anon";
GRANT ALL ON TABLE "public"."special_work_days" TO "authenticated";
GRANT ALL ON TABLE "public"."special_work_days" TO "service_role";



GRANT ALL ON TABLE "public"."sponsorship_details" TO "anon";
GRANT ALL ON TABLE "public"."sponsorship_details" TO "authenticated";
GRANT ALL ON TABLE "public"."sponsorship_details" TO "service_role";



GRANT ALL ON TABLE "public"."storage_config" TO "anon";
GRANT ALL ON TABLE "public"."storage_config" TO "authenticated";
GRANT ALL ON TABLE "public"."storage_config" TO "service_role";



GRANT ALL ON TABLE "public"."system_metadata" TO "anon";
GRANT ALL ON TABLE "public"."system_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."system_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."task_comments" TO "anon";
GRANT ALL ON TABLE "public"."task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_comments" TO "service_role";



GRANT ALL ON TABLE "public"."task_deadline_requests" TO "anon";
GRANT ALL ON TABLE "public"."task_deadline_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."task_deadline_requests" TO "service_role";



GRANT ALL ON TABLE "public"."task_logs" TO "anon";
GRANT ALL ON TABLE "public"."task_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."task_logs" TO "service_role";



GRANT ALL ON TABLE "public"."task_reviews" TO "anon";
GRANT ALL ON TABLE "public"."task_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."task_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."team_messages" TO "anon";
GRANT ALL ON TABLE "public"."team_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."team_messages" TO "service_role";



GRANT ALL ON TABLE "public"."tribunal_reports" TO "anon";
GRANT ALL ON TABLE "public"."tribunal_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."tribunal_reports" TO "service_role";



GRANT ALL ON TABLE "public"."user_background_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_background_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_background_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_inventory" TO "anon";
GRANT ALL ON TABLE "public"."user_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."user_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."user_screens" TO "anon";
GRANT ALL ON TABLE "public"."user_screens" TO "authenticated";
GRANT ALL ON TABLE "public"."user_screens" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_quests" TO "anon";
GRANT ALL ON TABLE "public"."weekly_quests" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_quests" TO "service_role";



GRANT ALL ON TABLE "public"."wiki_articles" TO "anon";
GRANT ALL ON TABLE "public"."wiki_articles" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki_articles" TO "service_role";



GRANT ALL ON TABLE "public"."wiki_nodes" TO "anon";
GRANT ALL ON TABLE "public"."wiki_nodes" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki_nodes" TO "service_role";



GRANT ALL ON TABLE "public"."workbox_items" TO "anon";
GRANT ALL ON TABLE "public"."workbox_items" TO "authenticated";
GRANT ALL ON TABLE "public"."workbox_items" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































