// ============================================
// SENSOR DATA STORAGE SERVICE
// ============================================
// This file handles storing sensor data to Supabase

// Import auth service for user ID
// Make sure auth.js is loaded before this file

// ============================================
// STORE SENSOR READING
// ============================================
async function storeSensorReading(temperature, humidity, pm25, voc, aqi, userId = null) {
    try {
        const { data, error } = await supabase
            .from('sensor_readings')
            .insert([
                {
                    user_id: userId,
                    temperature: parseFloat(temperature),
                    humidity: parseFloat(humidity),
                    pm25: parseFloat(pm25),
                    voc: parseFloat(voc),
                    aqi: parseInt(aqi),
                    timestamp: new Date().toISOString()
                }
            ]);

        if (error) {
            throw error;
        }

        console.log('Sensor reading stored successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Error storing sensor reading:', error);
        return { success: false, error: error.message };
    }
}

async function storeSensorReadingsBatch(readings, userId = null) {
    try {
        const formattedReadings = readings.map(reading => ({
            user_id: userId,
            temperature: parseFloat(reading.temperature),
            humidity: parseFloat(reading.humidity),
            pm25: parseFloat(reading.pm25),
            voc: parseFloat(reading.voc),
            aqi: parseInt(reading.aqi),
            timestamp: reading.timestamp || new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('sensor_readings')
            .insert(formattedReadings);

        if (error) {
            throw error;
        }

        console.log(`${readings.length} sensor readings stored successfully`);
        return { success: true, data };
    } catch (error) {
        console.error('Error storing batch sensor readings:', error);
        return { success: false, error: error.message };
    }
}


async function getSensorReadings(startDate, endDate, userId = null) {
    try {
        let query = supabase
            .from('sensor_readings')
            .select('*')
            .gte('timestamp', startDate)
            .lte('timestamp', endDate)
            .order('timestamp', { ascending: false });

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching sensor readings:', error);
        return { success: false, error: error.message };
    }
}

async function getLatestSensorReadings(limit = 10, userId = null) {
    try {
        let query = supabase
            .from('sensor_readings')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching latest sensor readings:', error);
        return { success: false, error: error.message };
    }
}


async function calculateDailySummary(date = null) {
    try {
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .rpc('calculate_daily_summary', { target_date: targetDate });

        if (error) {
            throw error;
        }

        console.log('Daily summary calculated for:', targetDate);
        return { success: true, data };
    } catch (error) {
        console.error('Error calculating daily summary:', error);
        return { success: false, error: error.message };
    }
}


async function getDailySummaries(startDate, endDate, userId = null) {
    try {
        let query = supabase
            .from('daily_summaries')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching daily summaries:', error);
        return { success: false, error: error.message };
    }
}


async function generateWeeklyReport(startDate = null) {
    try {
        const weekStart = startDate || new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .rpc('generate_weekly_report', { start_date: weekStart });

        if (error) {
            throw error;
        }

        console.log('Weekly report generated for week starting:', weekStart);
        return { success: true, data };
    } catch (error) {
        console.error('Error generating weekly report:', error);
        return { success: false, error: error.message };
    }
}


async function getWeeklyReports(limit = 10, userId = null) {
    try {
        let query = supabase
            .from('weekly_reports')
            .select('*')
            .order('week_start', { ascending: false })
            .limit(limit);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching weekly reports:', error);
        return { success: false, error: error.message };
    }
}


async function getLatestWeeklyReport(userId = null) {
    try {
        let query = supabase
            .from('weekly_reports')
            .select('*')
            .order('week_start', { ascending: false })
            .limit(1);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return { success: true, data: data[0] || null };
    } catch (error) {
        console.error('Error fetching latest weekly report:', error);
        return { success: false, error: error.message };
    }
}


async function autoStoreSensorData(sensorData, userId = null) {
    try {
        // Only store if we have valid data
        if (!sensorData.temperature && !sensorData.humidity && !sensorData.pm25) {
            return { success: false, error: 'No valid sensor data to store' };
        }

        const result = await storeSensorReading(
            sensorData.temperature || 0,
            sensorData.humidity || 0,
            sensorData.pm25 || 0,
            sensorData.gas || sensorData.voc || 0,
            sensorData.aqi || 0,
            userId
        );

        return result;
    } catch (error) {
        console.error('Error auto-storing sensor data:', error);
        return { success: false, error: error.message };
    }
}


async function cleanupOldReadings() {
    try {
        const { data, error } = await supabase
            .rpc('cleanup_old_sensor_readings');

        if (error) {
            throw error;
        }

        console.log('Old sensor readings cleaned up successfully');
        return { success: true, data };
    } catch (error) {
        console.error('Error cleaning up old readings:', error);
        return { success: false, error: error.message };
    }
}


window.sensorDataService = {
    storeSensorReading,
    storeSensorReadingsBatch,
    getSensorReadings,
    getLatestSensorReadings,
    calculateDailySummary,
    getDailySummaries,
    generateWeeklyReport,
    getWeeklyReports,
    getLatestWeeklyReport,
    autoStoreSensorData,
    cleanupOldReadings
};
