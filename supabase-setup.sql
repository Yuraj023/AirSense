-- ============================================
-- SUPABASE SQL SETUP FOR AIRSENSE DASHBOARD
-- ============================================
-- Run this in Supabase SQL Editor
-- This will create tables and Row Level Security policies

-- ============================================
-- 1. CREATE PROFILES TABLE
-- ============================================
-- This table stores additional user information
-- Supabase auth.users already stores email and password

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CREATE USER PREFERENCES TABLE
-- ============================================
-- Store user-specific settings and preferences

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    theme TEXT DEFAULT 'dark',
    notifications_enabled BOOLEAN DEFAULT true,
    email_alerts BOOLEAN DEFAULT true,
    data_refresh_interval INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE USER SESSIONS TABLE
-- ============================================
-- Track user login sessions (optional)

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT
);

-- Enable Row Level Security
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. ROW LEVEL SECURITY POLICIES - PROFILES
-- ============================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
    ON public.profiles
    FOR DELETE
    USING (auth.uid() = id);

-- ============================================
-- 5. ROW LEVEL SECURITY POLICIES - USER PREFERENCES
-- ============================================

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own preferences"
    ON public.user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
    ON public.user_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON public.user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
    ON public.user_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 6. ROW LEVEL SECURITY POLICIES - USER SESSIONS
-- ============================================

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions"
    ON public.user_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
    ON public.user_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update own sessions"
    ON public.user_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. CREATE FUNCTION TO AUTO-CREATE PROFILE
-- ============================================
-- Automatically create a profile when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. CREATE TRIGGER FOR NEW USER SIGNUP
-- ============================================
-- Trigger the function when a new user signs up

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 9. CREATE FUNCTION TO UPDATE UPDATED_AT
-- ============================================
-- Automatically update the updated_at timestamp

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================

-- Trigger for profiles table
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for user_preferences table
DROP TRIGGER IF EXISTS on_preferences_updated ON public.user_preferences;
CREATE TRIGGER on_preferences_updated
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 11. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(id);
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_login_at_idx ON public.user_sessions(login_at DESC);

-- ============================================
-- 12. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================
-- 13. CREATE SENSOR READINGS TABLE
-- ============================================
-- Store sensor data for weekly reports and analytics

CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    pm25 DECIMAL(8,2),
    voc DECIMAL(8,2),
    aqi INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 14. CREATE DAILY SUMMARY TABLE
-- ============================================
-- Store daily aggregated sensor data

CREATE TABLE IF NOT EXISTS public.daily_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    avg_temperature DECIMAL(5,2),
    avg_humidity DECIMAL(5,2),
    avg_pm25 DECIMAL(8,2),
    avg_voc DECIMAL(8,2),
    avg_aqi INTEGER,
    max_temperature DECIMAL(5,2),
    max_humidity DECIMAL(5,2),
    max_pm25 DECIMAL(8,2),
    max_voc DECIMAL(8,2),
    max_aqi INTEGER,
    min_temperature DECIMAL(5,2),
    min_humidity DECIMAL(5,2),
    min_pm25 DECIMAL(8,2),
    min_voc DECIMAL(8,2),
    min_aqi INTEGER,
    readings_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 15. CREATE WEEKLY REPORTS TABLE
-- ============================================
-- Store weekly aggregated reports

CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    avg_temperature DECIMAL(5,2),
    avg_humidity DECIMAL(5,2),
    avg_pm25 DECIMAL(8,2),
    avg_voc DECIMAL(8,2),
    avg_aqi INTEGER,
    max_temperature DECIMAL(5,2),
    max_humidity DECIMAL(5,2),
    max_pm25 DECIMAL(8,2),
    max_voc DECIMAL(8,2),
    max_aqi INTEGER,
    min_temperature DECIMAL(5,2),
    min_humidity DECIMAL(5,2),
    min_pm25 DECIMAL(8,2),
    min_voc DECIMAL(8,2),
    min_aqi INTEGER,
    total_readings INTEGER DEFAULT 0,
    air_quality_status TEXT,
    report_generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start, week_end)
);

-- Enable Row Level Security
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 16. ROW LEVEL SECURITY POLICIES - SENSOR READINGS
-- ============================================

-- Policy: Users can view their own sensor readings
CREATE POLICY "Users can view own sensor readings"
    ON public.sensor_readings
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Anyone can insert sensor readings (for IoT devices)
CREATE POLICY "Anyone can insert sensor readings"
    ON public.sensor_readings
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can update their own sensor readings
CREATE POLICY "Users can update own sensor readings"
    ON public.sensor_readings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own sensor readings
CREATE POLICY "Users can delete own sensor readings"
    ON public.sensor_readings
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 17. ROW LEVEL SECURITY POLICIES - DAILY SUMMARIES
-- ============================================

-- Policy: Users can view their own daily summaries
CREATE POLICY "Users can view own daily summaries"
    ON public.daily_summaries
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Anyone can insert daily summaries
CREATE POLICY "Anyone can insert daily summaries"
    ON public.daily_summaries
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can update their own daily summaries
CREATE POLICY "Users can update own daily summaries"
    ON public.daily_summaries
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own daily summaries
CREATE POLICY "Users can delete own daily summaries"
    ON public.daily_summaries
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 18. ROW LEVEL SECURITY POLICIES - WEEKLY REPORTS
-- ============================================

-- Policy: Users can view their own weekly reports
CREATE POLICY "Users can view own weekly reports"
    ON public.weekly_reports
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Anyone can insert weekly reports
CREATE POLICY "Anyone can insert weekly reports"
    ON public.weekly_reports
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can update their own weekly reports
CREATE POLICY "Users can update own weekly reports"
    ON public.weekly_reports
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own weekly reports
CREATE POLICY "Users can delete own weekly reports"
    ON public.weekly_reports
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 19. CREATE FUNCTION TO CALCULATE DAILY SUMMARY
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_daily_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO public.daily_summaries (
        user_id,
        date,
        avg_temperature,
        avg_humidity,
        avg_pm25,
        avg_voc,
        avg_aqi,
        max_temperature,
        max_humidity,
        max_pm25,
        max_voc,
        max_aqi,
        min_temperature,
        min_humidity,
        min_pm25,
        min_voc,
        min_aqi,
        readings_count
    )
    SELECT
        user_id,
        target_date,
        AVG(temperature)::DECIMAL(5,2),
        AVG(humidity)::DECIMAL(5,2),
        AVG(pm25)::DECIMAL(8,2),
        AVG(voc)::DECIMAL(8,2),
        AVG(aqi)::INTEGER,
        MAX(temperature)::DECIMAL(5,2),
        MAX(humidity)::DECIMAL(5,2),
        MAX(pm25)::DECIMAL(8,2),
        MAX(voc)::DECIMAL(8,2),
        MAX(aqi)::INTEGER,
        MIN(temperature)::DECIMAL(5,2),
        MIN(humidity)::DECIMAL(5,2),
        MIN(pm25)::DECIMAL(8,2),
        MIN(voc)::DECIMAL(8,2),
        MIN(aqi)::INTEGER,
        COUNT(*)::INTEGER
    FROM public.sensor_readings
    WHERE DATE(timestamp) = target_date
    GROUP BY user_id
    ON CONFLICT (user_id, date) DO UPDATE SET
        avg_temperature = EXCLUDED.avg_temperature,
        avg_humidity = EXCLUDED.avg_humidity,
        avg_pm25 = EXCLUDED.avg_pm25,
        avg_voc = EXCLUDED.avg_voc,
        avg_aqi = EXCLUDED.avg_aqi,
        max_temperature = EXCLUDED.max_temperature,
        max_humidity = EXCLUDED.max_humidity,
        max_pm25 = EXCLUDED.max_pm25,
        max_voc = EXCLUDED.max_voc,
        max_aqi = EXCLUDED.max_aqi,
        min_temperature = EXCLUDED.min_temperature,
        min_humidity = EXCLUDED.min_humidity,
        min_pm25 = EXCLUDED.min_pm25,
        min_voc = EXCLUDED.min_voc,
        min_aqi = EXCLUDED.min_aqi,
        readings_count = EXCLUDED.readings_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 20. CREATE FUNCTION TO GENERATE WEEKLY REPORT
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_weekly_report(
    start_date DATE DEFAULT DATE_TRUNC('week', CURRENT_DATE)::DATE
)
RETURNS void AS $$
DECLARE
    end_date DATE := start_date + INTERVAL '6 days';
    aqi_status TEXT;
BEGIN
    INSERT INTO public.weekly_reports (
        user_id,
        week_start,
        week_end,
        avg_temperature,
        avg_humidity,
        avg_pm25,
        avg_voc,
        avg_aqi,
        max_temperature,
        max_humidity,
        max_pm25,
        max_voc,
        max_aqi,
        min_temperature,
        min_humidity,
        min_pm25,
        min_voc,
        min_aqi,
        total_readings,
        air_quality_status
    )
    SELECT
        user_id,
        start_date,
        end_date,
        AVG(avg_temperature)::DECIMAL(5,2),
        AVG(avg_humidity)::DECIMAL(5,2),
        AVG(avg_pm25)::DECIMAL(8,2),
        AVG(avg_voc)::DECIMAL(8,2),
        AVG(avg_aqi)::INTEGER,
        MAX(max_temperature)::DECIMAL(5,2),
        MAX(max_humidity)::DECIMAL(5,2),
        MAX(max_pm25)::DECIMAL(8,2),
        MAX(max_voc)::DECIMAL(8,2),
        MAX(max_aqi)::INTEGER,
        MIN(min_temperature)::DECIMAL(5,2),
        MIN(min_humidity)::DECIMAL(5,2),
        MIN(min_pm25)::DECIMAL(8,2),
        MIN(min_voc)::DECIMAL(8,2),
        MIN(min_aqi)::INTEGER,
        SUM(readings_count)::INTEGER,
        CASE
            WHEN AVG(avg_aqi) <= 50 THEN 'Good'
            WHEN AVG(avg_aqi) <= 100 THEN 'Moderate'
            WHEN AVG(avg_aqi) <= 150 THEN 'Unhealthy for Sensitive Groups'
            WHEN AVG(avg_aqi) <= 200 THEN 'Unhealthy'
            WHEN AVG(avg_aqi) <= 300 THEN 'Very Unhealthy'
            ELSE 'Hazardous'
        END
    FROM public.daily_summaries
    WHERE date BETWEEN start_date AND end_date
    GROUP BY user_id
    ON CONFLICT (user_id, week_start, week_end) DO UPDATE SET
        avg_temperature = EXCLUDED.avg_temperature,
        avg_humidity = EXCLUDED.avg_humidity,
        avg_pm25 = EXCLUDED.avg_pm25,
        avg_voc = EXCLUDED.avg_voc,
        avg_aqi = EXCLUDED.avg_aqi,
        max_temperature = EXCLUDED.max_temperature,
        max_humidity = EXCLUDED.max_humidity,
        max_pm25 = EXCLUDED.max_pm25,
        max_voc = EXCLUDED.max_voc,
        max_aqi = EXCLUDED.max_aqi,
        min_temperature = EXCLUDED.min_temperature,
        min_humidity = EXCLUDED.min_humidity,
        min_pm25 = EXCLUDED.min_pm25,
        min_voc = EXCLUDED.min_voc,
        min_aqi = EXCLUDED.min_aqi,
        total_readings = EXCLUDED.total_readings,
        air_quality_status = EXCLUDED.air_quality_status,
        report_generated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 21. CREATE INDEXES FOR SENSOR DATA
-- ============================================

CREATE INDEX IF NOT EXISTS sensor_readings_user_id_idx ON public.sensor_readings(user_id);
CREATE INDEX IF NOT EXISTS sensor_readings_timestamp_idx ON public.sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS sensor_readings_date_idx ON public.sensor_readings(DATE(timestamp));
CREATE INDEX IF NOT EXISTS daily_summaries_user_date_idx ON public.daily_summaries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS weekly_reports_user_week_idx ON public.weekly_reports(user_id, week_start DESC);

-- ============================================
-- 22. CREATE FUNCTION TO AUTO-DELETE OLD READINGS
-- ============================================
-- Optional: Delete sensor readings older than 90 days to save space

CREATE OR REPLACE FUNCTION public.cleanup_old_sensor_readings()
RETURNS void AS $$
BEGIN
    DELETE FROM public.sensor_readings
    WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Your Supabase database is now configured with:
-- ✅ Profiles table (stores user info)
-- ✅ User preferences table (stores settings)
-- ✅ User sessions table (tracks logins)
-- ✅ Sensor readings table (stores real-time data)
-- ✅ Daily summaries table (aggregated daily data)
-- ✅ Weekly reports table (weekly analytics)
-- ✅ Row Level Security policies (data protection)
-- ✅ Automatic profile creation on signup
-- ✅ Daily summary calculation function
-- ✅ Weekly report generation function
-- ✅ Auto-cleanup for old data
-- ✅ Performance indexes
-- ============================================

-- To verify the setup, run these queries:
-- SELECT * FROM public.profiles;
-- SELECT * FROM public.user_preferences;
-- SELECT * FROM public.sensor_readings LIMIT 10;
-- SELECT * FROM public.daily_summaries;
-- SELECT * FROM public.weekly_reports;

-- To manually generate reports:
-- SELECT public.calculate_daily_summary(CURRENT_DATE);
-- SELECT public.generate_weekly_report(DATE_TRUNC('week', CURRENT_DATE)::DATE);
