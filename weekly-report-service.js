// ============================================
// WEEKLY REPORT SERVICE
// ============================================
// Handles weekly report generation and email delivery using Supabase data

/**
 * Get last 7 days of sensor data from Supabase
 */
async function getWeeklyData(userId) {
    try {
        // Calculate date range for last 7 days
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);

        console.log('Fetching weekly data from', startDate.toISOString(), 'to', endDate.toISOString());

        // Fetch sensor readings from Supabase
        const { data: readings, error } = await supabase
            .from('sensor_readings')
            .select('*')
            .eq('user_id', userId)
            .gte('timestamp', startDate.toISOString())
            .lte('timestamp', endDate.toISOString())
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching weekly data:', error);
            throw error;
        }

        if (!readings || readings.length === 0) {
            console.log('No sensor data found for the last 7 days');
            return null;
        }

        console.log(`Found ${readings.length} sensor readings for the past 7 days`);

        // Group readings by day
        const dailyData = groupReadingsByDay(readings);
        
        return dailyData;
    } catch (error) {
        console.error('Error in getWeeklyData:', error);
        return null;
    }
}

/**
 * Group sensor readings by day and calculate daily averages
 */
function groupReadingsByDay(readings) {
    const dailyGroups = {};

    readings.forEach(reading => {
        const date = new Date(reading.timestamp).toISOString().split('T')[0];
        
        if (!dailyGroups[date]) {
            dailyGroups[date] = {
                date,
                readings: []
            };
        }
        
        dailyGroups[date].readings.push(reading);
    });

    // Calculate daily averages
    const dailyAverages = Object.values(dailyGroups).map(day => {
        const readings = day.readings;
        const count = readings.length;

        return {
            date: day.date,
            averageAQI: Math.round(readings.reduce((sum, r) => sum + (r.aqi || 0), 0) / count),
            averagePM25: readings.reduce((sum, r) => sum + (r.pm25 || 0), 0) / count,
            averageVOC: readings.reduce((sum, r) => sum + (r.voc || 0), 0) / count,
            averageTemp: readings.reduce((sum, r) => sum + (r.temperature || 0), 0) / count,
            averageHumidity: readings.reduce((sum, r) => sum + (r.humidity || 0), 0) / count,
            minAQI: Math.min(...readings.map(r => r.aqi || 0)),
            maxAQI: Math.max(...readings.map(r => r.aqi || 0)),
            readingsCount: count
        };
    });

    // Sort by date
    dailyAverages.sort((a, b) => new Date(a.date) - new Date(b.date));

    return dailyAverages;
}

/**
 * Generate and send weekly report to user
 */
async function sendWeeklyReportToUser(userId, userEmail) {
    try {
        console.log('Generating weekly report for user:', userId);

        // Check if user has email alerts enabled
        const prefsResult = await userPreferencesService.getUserPreferences(userId);
        if (prefsResult && !prefsResult.email_alerts_enabled) {
            console.log('Email alerts disabled for user:', userId);
            return { success: false, message: 'Email alerts disabled' };
        }

        // Get weekly data from Supabase
        const weeklyData = await getWeeklyData(userId);

        if (!weeklyData || weeklyData.length === 0) {
            console.log('No data available for weekly report');
            return { success: false, message: 'No data available' };
        }

        // Send email using existing email service
        const result = await emailService.generateWeeklyReport(weeklyData, userEmail);

        if (result.success) {
            console.log('Weekly report sent successfully to:', userEmail);
            
            // Store report record in Supabase
            await storeWeeklyReportRecord(userId, weeklyData);
        }

        return result;
    } catch (error) {
        console.error('Error sending weekly report:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Store weekly report record in Supabase
 */
async function storeWeeklyReportRecord(userId, weeklyData) {
    try {
        const startDate = weeklyData[0].date;
        const endDate = weeklyData[weeklyData.length - 1].date;

        // Calculate summary statistics
        const totalAQI = weeklyData.reduce((sum, day) => sum + day.averageAQI, 0);
        const averageAQI = Math.round(totalAQI / weeklyData.length);
        
        const avgTemp = weeklyData.reduce((sum, day) => sum + day.averageTemp, 0) / weeklyData.length;
        const avgHumidity = weeklyData.reduce((sum, day) => sum + day.averageHumidity, 0) / weeklyData.length;
        const avgPM25 = weeklyData.reduce((sum, day) => sum + day.averagePM25, 0) / weeklyData.length;
        const avgVOC = weeklyData.reduce((sum, day) => sum + day.averageVOC, 0) / weeklyData.length;

        // Determine air quality status
        let airQualityStatus = 'Good';
        if (averageAQI > 300) airQualityStatus = 'Hazardous';
        else if (averageAQI > 200) airQualityStatus = 'Very Unhealthy';
        else if (averageAQI > 150) airQualityStatus = 'Unhealthy';
        else if (averageAQI > 100) airQualityStatus = 'Unhealthy for Sensitive Groups';
        else if (averageAQI > 50) airQualityStatus = 'Moderate';

        const { data, error } = await supabase
            .from('weekly_reports')
            .insert([{
                user_id: userId,
                week_start: startDate,
                week_end: endDate,
                avg_temperature: avgTemp,
                avg_humidity: avgHumidity,
                avg_pm25: avgPM25,
                avg_voc: avgVOC,
                avg_aqi: averageAQI,
                max_aqi: Math.max(...weeklyData.map(d => d.maxAQI || d.averageAQI)),
                min_aqi: Math.min(...weeklyData.map(d => d.minAQI || d.averageAQI)),
                total_readings: weeklyData.reduce((sum, day) => sum + day.readingsCount, 0),
                air_quality_status: airQualityStatus,
                report_generated_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error storing weekly report record:', error);
        } else {
            console.log('Weekly report record stored successfully');
        }
    } catch (error) {
        console.error('Error in storeWeeklyReportRecord:', error);
    }
}

/**
 * Send weekly reports to all users (scheduled task)
 */
async function sendWeeklyReportsToAllUsers() {
    try {
        console.log('Starting weekly report distribution...');

        // Get all users with email alerts enabled
        const { data: users, error } = await supabase
            .from('user_preferences')
            .select('user_id, email_alerts_enabled')
            .eq('email_alerts_enabled', true);

        if (error) {
            console.error('Error fetching users:', error);
            return { success: false, error: error.message };
        }

        if (!users || users.length === 0) {
            console.log('No users with email alerts enabled');
            return { success: true, message: 'No users to send reports to' };
        }

        console.log(`Sending weekly reports to ${users.length} users...`);

        // Get user emails from auth
        const results = [];
        for (const user of users) {
            try {
                // Get user email from auth.users table
                const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.user_id);
                
                if (authError || !authUser) {
                    console.error('Error fetching user email:', authError);
                    continue;
                }

                const result = await sendWeeklyReportToUser(user.user_id, authUser.user.email);
                results.push({ userId: user.user_id, result });

                // Add delay between emails to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Error sending report to user ${user.user_id}:`, error);
            }
        }

        console.log('Weekly report distribution completed');
        console.log('Success:', results.filter(r => r.result.success).length);
        console.log('Failed:', results.filter(r => !r.result.success).length);

        return { success: true, results };
    } catch (error) {
        console.error('Error in sendWeeklyReportsToAllUsers:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Test weekly report with current user
 */
async function testWeeklyReportFromSupabase() {
    try {
        if (!window.currentUserId) {
            console.error('User not authenticated');
            alert('Please login first to test weekly report');
            return;
        }

        // Get current user email
        const userResult = await authService.getCurrentUser();
        if (!userResult.success || !userResult.user) {
            console.error('Failed to get user email');
            alert('Failed to get user email');
            return;
        }

        console.log('Testing weekly report for user:', window.currentUserId);
        console.log('Sending to email:', userResult.user.email);

        // Generate and send report
        const result = await sendWeeklyReportToUser(window.currentUserId, userResult.user.email);

        if (result.success) {
            console.log('✅ Weekly report sent successfully!');
            alert('✅ Weekly report sent! Check your email inbox.');
        } else {
            console.error('Failed to send weekly report:', result.message || result.error);
            alert('❌ Failed to send weekly report: ' + (result.message || result.error));
        }
    } catch (error) {
        console.error('Error testing weekly report:', error);
        alert('❌ Error: ' + error.message);
    }
}

/**
 * Schedule weekly reports (to be called on Mondays at 9 AM)
 */
function scheduleWeeklyReports() {
    // Check if it's Monday and 9 AM
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
    const hour = now.getHours();

    if (dayOfWeek === 1 && hour === 9) {
        console.log('Triggering scheduled weekly reports...');
        sendWeeklyReportsToAllUsers();
    }

    // Check every hour
    setTimeout(scheduleWeeklyReports, 60 * 60 * 1000);
}

/**
 * Get weekly report history for user
 */
async function getWeeklyReportHistory(userId, limit = 10) {
    try {
        const { data, error } = await supabase
            .from('weekly_reports')
            .select('*')
            .eq('user_id', userId)
            .order('week_start', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching weekly report history:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error in getWeeklyReportHistory:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
window.weeklyReportService = {
    getWeeklyData,
    sendWeeklyReportToUser,
    sendWeeklyReportsToAllUsers,
    testWeeklyReportFromSupabase,
    scheduleWeeklyReports,
    getWeeklyReportHistory,
    storeWeeklyReportRecord
};

// ============================================
// AUTO-START SCHEDULER (Optional)
// ============================================
// Uncomment to enable automatic scheduling
// document.addEventListener('DOMContentLoaded', () => {
//     console.log('Weekly report scheduler initialized');
//     scheduleWeeklyReports();
// });

console.log('✅ Weekly Report Service loaded');
