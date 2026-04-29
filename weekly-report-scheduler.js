// Weekly Report Scheduler
// This script handles automatic weekly report generation and email sending

/**
 * Check if today is Monday and if weekly report should be sent
 */
function shouldSendWeeklyReport() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if it's Monday (day 1)
    if (dayOfWeek !== 1) {
        return false;
    }

    // Check if we already sent a report today
    const lastReportDate = localStorage.getItem('lastWeeklyReportDate');
    const todayString = today.toDateString();
    
    if (lastReportDate === todayString) {
        console.log('Weekly report already sent today');
        return false;
    }

    return true;
}

/**
 * Get data for the past 7 days from Supabase
 */
async function getWeeklyData(userId) {
    try {
        if (typeof sensorDataService === 'undefined') {
            console.error('Sensor data service not available');
            return null;
        }

        // Get data from 7 days ago to today
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        // Get daily summaries for the past week
        const result = await sensorDataService.getDailySummaries(
            userId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );

        if (result.success && result.data && result.data.length > 0) {
            return result.data;
        }

        console.warn('No weekly data available');
        return null;
    } catch (error) {
        console.error('Error fetching weekly data:', error);
        return null;
    }
}

/**
 * Format data for weekly report
 */
function formatWeeklyData(dailySummaries) {
    return dailySummaries.map(summary => ({
        date: summary.date,
        averageAQI: Math.round(summary.avg_aqi || 0),
        averagePM25: summary.avg_pm25 || 0,
        averageVOC: summary.avg_voc || 0,
        averageTemp: summary.avg_temperature || 0,
        averageHumidity: summary.avg_humidity || 0,
        minAQI: summary.min_aqi || 0,
        maxAQI: summary.max_aqi || 0
    }));
}

/**
 * Send weekly report
 */
async function sendWeeklyReportIfNeeded() {
    try {
        // Check if we should send the report
        if (!shouldSendWeeklyReport()) {
            return { success: false, reason: 'Not Monday or already sent today' };
        }

        // Check if user is logged in
        if (!window.currentUserId || !window.currentUserEmail) {
            console.warn('User not logged in, skipping weekly report');
            return { success: false, reason: 'User not logged in' };
        }

        console.log('Generating weekly report for', window.currentUserEmail);

        // Get weekly data
        const dailySummaries = await getWeeklyData(window.currentUserId);

        if (!dailySummaries || dailySummaries.length === 0) {
            console.warn('No data available for weekly report');
            return { success: false, reason: 'No data available' };
        }

        // Format data for email
        const weeklyData = formatWeeklyData(dailySummaries);

        // Send email report
        if (typeof emailService === 'undefined') {
            console.error('Email service not available');
            return { success: false, reason: 'Email service not available' };
        }

        const result = await emailService.generateWeeklyReport(weeklyData, window.currentUserEmail);

        if (result.success) {
            // Mark that we sent the report today
            const today = new Date();
            localStorage.setItem('lastWeeklyReportDate', today.toDateString());
            
            console.log('Weekly report sent successfully');
            return { success: true };
        } else {
            console.error('Failed to send weekly report:', result.error);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('Error in weekly report scheduler:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Initialize weekly report scheduler
 * Checks every hour if it's time to send the report
 */
function initWeeklyReportScheduler() {
    console.log('Weekly report scheduler initialized');

    // Check immediately on load
    setTimeout(() => {
        sendWeeklyReportIfNeeded();
    }, 5000); // Wait 5 seconds after page load

    // Check every hour
    setInterval(() => {
        sendWeeklyReportIfNeeded();
    }, 3600000); // 1 hour = 3600000ms
}

/**
 * Manually trigger weekly report (for testing)
 */
async function sendWeeklyReportNow() {
    if (!window.currentUserId || !window.currentUserEmail) {
        alert('Please log in first');
        return;
    }

    console.log('Manually triggering weekly report...');

    const dailySummaries = await getWeeklyData(window.currentUserId);

    if (!dailySummaries || dailySummaries.length === 0) {
        alert('No data available for weekly report. Data collection needs at least 7 days.');
        return;
    }

    const weeklyData = formatWeeklyData(dailySummaries);
    const result = await emailService.generateWeeklyReport(weeklyData, window.currentUserEmail);

    if (result.success) {
        alert('Weekly report sent successfully! Check your email.');
    } else {
        alert('Failed to send weekly report: ' + result.error);
    }
}

// Export functions
window.weeklyReportScheduler = {
    init: initWeeklyReportScheduler,
    sendNow: sendWeeklyReportNow,
    sendWeeklyReportIfNeeded
};
