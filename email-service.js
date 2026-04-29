// Brevo (Sendinblue) Email Service - Load from environment variables
if (!window.ENV_CONFIG) {
    console.error('❌ Environment configuration not loaded! Make sure env-config.js is loaded before this script.');
}
const BREVO_API_KEY = window.ENV_CONFIG?.BREVO_API_KEY;
const BREVO_API_URL = window.ENV_CONFIG?.BREVO_API_URL;

// Email Configuration
const SENDER_EMAIL = window.ENV_CONFIG?.BREVO_SENDER_EMAIL;
const SENDER_NAME = window.ENV_CONFIG?.BREVO_SENDER_NAME;

// Alert threshold tracking
let unhealthyReadingsCount = 0;
let criticalReadingsCount = 0; // Track AQI > 150 readings
let lastAlertTimestamp = null;
let lastAlertType = null; // 'critical' or 'unhealthy'
const ALERT_COOLDOWN = 3600000; // 1 hour in milliseconds

/**
 * Send email using Brevo API
 */
async function sendEmail(to, subject, htmlContent) {
    try {
        console.log('📧 Attempting to send email to:', to);
        console.log('📧 Subject:', subject);
        
        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: SENDER_NAME,
                    email: SENDER_EMAIL
                },
                to: [{
                    email: to,
                    name: to.split('@')[0]
                }],
                subject: subject,
                htmlContent: htmlContent
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Email sent successfully! Message ID:', result.messageId);
            return { success: true, messageId: result.messageId };
        } else {
            console.error('❌ Failed to send email. Status:', response.status);
            console.error('❌ Error details:', result);
            return { success: false, error: result.message || 'Failed to send email' };
        }
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if air quality is unhealthy
 */
function isUnhealthy(aqi, pm25, voc) {
    // AQI > 100 is unhealthy
    // PM2.5 > 35.4 is unhealthy
    // VOC > 220 is unhealthy (based on typical standards)
    return aqi > 100 || pm25 > 35.4 || voc > 220;
}

/**
 * Check if air quality is critical
 */
function isCritical(aqi) {
    // AQI > 150 is critical
    return aqi > 150;
}

/**
 * Get AQI category and color
 */
function getAQICategory(aqi) {
    if (aqi <= 50) return { category: 'Good', color: '#00e400', icon: '😊' };
    if (aqi <= 100) return { category: 'Moderate', color: '#ffff00', icon: '😐' };
    if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', color: '#ff7e00', icon: '😷' };
    if (aqi <= 200) return { category: 'Unhealthy', color: '#ff0000', icon: '😨' };
    if (aqi <= 300) return { category: 'Very Unhealthy', color: '#8f3f97', icon: '🤢' };
    return { category: 'Hazardous', color: '#7e0023', icon: '☠️' };
}

/**
 * Monitor air quality and send alert if needed
 */
async function monitorAirQuality(sensorData, userEmail) {
    try {
        const { aqi, pm25, voc, temperature, humidity } = sensorData;
        const now = Date.now();

        console.log('🔍 Monitoring Data:', {
            aqi: aqi,
            pm25: pm25,
            voc: voc,
            userEmail: userEmail,
            criticalCount: criticalReadingsCount,
            unhealthyCount: unhealthyReadingsCount
        });

        // Priority 1: Check for CRITICAL air quality (AQI > 150)
        if (isCritical(aqi)) {
            criticalReadingsCount++;
            console.log(`🚨 CRITICAL reading detected (AQI: ${aqi} > 150). Count: ${criticalReadingsCount}/3`);

            // Send alert after 3 consecutive critical readings
            if (criticalReadingsCount >= 3) {
                // Critical alerts can override unhealthy alert cooldown, or respect critical alert cooldown
                const canSendCritical = !lastAlertTimestamp || 
                                       lastAlertType === 'unhealthy' || 
                                       (now - lastAlertTimestamp) > ALERT_COOLDOWN;
                
                if (canSendCritical) {
                    console.log('📧 Sending CRITICAL alert email to:', userEmail);
                    const result = await sendCriticalAlert(sensorData, userEmail);
                    if (result.success) {
                        lastAlertTimestamp = now;
                        lastAlertType = 'critical';
                        criticalReadingsCount = 0; // Reset counter after sending alert
                        unhealthyReadingsCount = 0; // Also reset unhealthy counter
                        console.log('✅ Critical alert sent successfully to:', userEmail);
                    } else {
                        console.error('❌ Failed to send critical alert:', result.error);
                    }
                } else {
                    const timeLeft = Math.round((ALERT_COOLDOWN - (now - lastAlertTimestamp)) / 60000);
                    console.log(`⏳ Critical alert cooldown active. Time remaining: ${timeLeft} minutes`);
                }
            }
            // Reset unhealthy counter since critical is higher priority
            unhealthyReadingsCount = 0;
        }
        // Priority 2: Check if current reading is unhealthy (AQI > 100 or PM2.5/VOC high)
        else if (isUnhealthy(aqi, pm25, voc)) {
            unhealthyReadingsCount++;
            criticalReadingsCount = 0; // Reset critical counter
            console.log(`⚠️ Unhealthy reading detected (AQI: ${aqi}). Count: ${unhealthyReadingsCount}/3`);

            // Send alert after 3 consecutive unhealthy readings
            if (unhealthyReadingsCount >= 3) {
                // Check cooldown period
                if (!lastAlertTimestamp || (now - lastAlertTimestamp) > ALERT_COOLDOWN) {
                    console.log('📧 Sending UNHEALTHY alert email to:', userEmail);
                    const result = await sendUnhealthyAlert(sensorData, userEmail);
                    if (result.success) {
                        lastAlertTimestamp = now;
                        lastAlertType = 'unhealthy';
                        unhealthyReadingsCount = 0; // Reset counter after sending alert
                        console.log('✅ Unhealthy alert sent successfully to:', userEmail);
                    } else {
                        console.error('❌ Failed to send unhealthy alert:', result.error);
                    }
                } else {
                    const timeLeft = Math.round((ALERT_COOLDOWN - (now - lastAlertTimestamp)) / 60000);
                    console.log(`⏳ Unhealthy alert cooldown active. Time remaining: ${timeLeft} minutes`);
                }
            }
        } else {
            // Reset both counters if reading is healthy
            if (unhealthyReadingsCount > 0 || criticalReadingsCount > 0) {
                console.log(`✅ Air quality improved (AQI: ${aqi}). Resetting counters.`);
                unhealthyReadingsCount = 0;
                criticalReadingsCount = 0;
            }
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Error monitoring air quality:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send critical air quality alert (AQI > 150)
 */
async function sendCriticalAlert(sensorData, userEmail) {
    const { aqi, pm25, voc, temperature, humidity } = sensorData;
    const aqiInfo = getAQICategory(aqi);
    const timestamp = new Date().toLocaleString();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚨 CRITICAL AIR QUALITY ALERT</h1>
            
            <p><strong>Alert Time:</strong> ${timestamp}</p>
            
            <hr>
            
            <h2>Current Air Quality Index: ${aqi}</h2>
            <p><strong>Status:</strong> ${aqiInfo.category} ${aqiInfo.icon}</p>
            <p><strong>Warning:</strong> 3 consecutive critical readings detected (AQI > 150)</p>
            
            <hr>
            
            <h3>Additional Measurements:</h3>
            <ul>
                <li><strong>PM2.5:</strong> ${pm25} µg/m³</li>
                <li><strong>VOC:</strong> ${voc} ppb</li>
                <li><strong>Temperature:</strong> ${temperature}°C</li>
                <li><strong>Humidity:</strong> ${humidity}%</li>
            </ul>
            
            <hr>
            
            <h3>⚡ IMMEDIATE ACTIONS REQUIRED:</h3>
            <ol>
                <li><strong>Stay indoors</strong> - Close all windows and doors</li>
                <li><strong>Use air purifier</strong> if available</li>
                <li><strong>Avoid physical activity</strong> - Do not exercise outdoors</li>
                <li><strong>Wear N95 mask</strong> if you must go outside</li>
                <li><strong>Check on vulnerable individuals</strong> - Children, elderly, people with respiratory conditions</li>
            </ol>
            
            <hr>
            
            <p style="font-size: 12px; color: #666;">
                AirSense Air Quality Monitor<br>
                This is an automated alert from your AirSense monitoring system.<br>
                © 2025 AirSense
            </p>
        </div>
    </body>
    </html>
    `;

    const subject = `🚨 CRITICAL Air Quality Alert - AQI ${aqi}`;
    
    return await sendEmail(userEmail, subject, htmlContent);
}

/**
 * Send unhealthy air quality alert
 */
async function sendUnhealthyAlert(sensorData, userEmail) {
    const { aqi, pm25, voc, temperature, humidity } = sensorData;
    const aqiInfo = getAQICategory(aqi);
    const timestamp = new Date().toLocaleString();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>⚠️ UNHEALTHY AIR QUALITY ALERT</h1>
            
            <p><strong>Alert Time:</strong> ${timestamp}</p>
            
            <hr>
            
            <h2>Current Air Quality Index: ${aqi}</h2>
            <p><strong>Status:</strong> ${aqiInfo.category} ${aqiInfo.icon}</p>
            <p><strong>Warning:</strong> 3 consecutive unhealthy readings detected</p>
            
            <hr>
            
            <h3>Additional Measurements:</h3>
            <ul>
                <li><strong>PM2.5:</strong> ${pm25} µg/m³</li>
                <li><strong>VOC:</strong> ${voc} ppb</li>
                <li><strong>Temperature:</strong> ${temperature}°C</li>
                <li><strong>Humidity:</strong> ${humidity}%</li>
            </ul>
            
            <hr>
            
            <h3>💡 Recommended Actions:</h3>
            <ol>
                <li><strong>Close windows and doors</strong> - Keep outdoor air out</li>
                <li><strong>Use air purifier</strong> if available</li>
                <li><strong>Limit outdoor activities</strong> - Especially for sensitive groups</li>
                <li><strong>Keep indoor air clean</strong> - Avoid smoking and burning candles</li>
                <li><strong>Monitor symptoms</strong> - Watch for breathing difficulties or irritation</li>
            </ol>
            
            <hr>
            
            <p style="font-size: 12px; color: #666;">
                AirSense Air Quality Monitor<br>
                This is an automated alert from your AirSense monitoring system.<br>
                © 2025 AirSense
            </p>
        </div>
    </body>
    </html>
    `;

    const subject = `⚠️ Air Quality Alert - AQI ${aqi}`;
    
    return await sendEmail(userEmail, subject, htmlContent);
}

/**
 * Generate and send weekly report
 */
async function generateWeeklyReport(weeklyData, userEmail) {
    try {
        // Calculate statistics
        const stats = calculateWeeklyStats(weeklyData);
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
                .container { max-width: 700px; margin: 0 auto; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f4f4f4; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📊 Weekly Air Quality Report</h1>
                <p><strong>Report Period:</strong> ${stats.dateRange}</p>
                
                <hr>
                
                <h2>Weekly Summary</h2>
                <table>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                    </tr>
                    <tr>
                        <td>Average AQI</td>
                        <td><strong>${stats.averageAQI}</strong></td>
                    </tr>
                    <tr>
                        <td>Good Days (AQI ≤ 50)</td>
                        <td><strong>${stats.goodDays}</strong></td>
                    </tr>
                    <tr>
                        <td>Unhealthy Days (AQI > 100)</td>
                        <td><strong>${stats.unhealthyDays}</strong></td>
                    </tr>
                </table>
                
                <hr>
                
                <h2>🌟 Best Day of the Week</h2>
                <p><strong>${stats.bestDay.name} - ${stats.bestDay.date}</strong></p>
                <ul>
                    <li>AQI: <strong>${stats.bestDay.aqi}</strong></li>
                    <li>PM2.5: ${stats.bestDay.pm25} µg/m³</li>
                    <li>VOC: ${stats.bestDay.voc} ppb</li>
                    <li>Temperature: ${stats.bestDay.temp}°C</li>
                </ul>
                
                <hr>
                
                <h2>⚠️ Worst Day of the Week</h2>
                <p><strong>${stats.worstDay.name} - ${stats.worstDay.date}</strong></p>
                <ul>
                    <li>AQI: <strong>${stats.worstDay.aqi}</strong></li>
                    <li>PM2.5: ${stats.worstDay.pm25} µg/m³</li>
                    <li>VOC: ${stats.worstDay.voc} ppb</li>
                    <li>Temperature: ${stats.worstDay.temp}°C</li>
                </ul>
                
                <hr>
                
                <h2>📈 Daily Breakdown</h2>
                <table>
                    <tr>
                        <th>Day</th>
                        <th>AQI</th>
                        <th>PM2.5</th>
                        <th>VOC</th>
                        <th>Humidity</th>
                    </tr>
                    ${stats.dailyBreakdown.map(day => `
                    <tr>
                        <td><strong>${day.name}</strong><br>${day.date}</td>
                        <td>${day.aqi}</td>
                        <td>${day.pm25} µg/m³</td>
                        <td>${day.voc} ppb</td>
                        <td>${day.humidity}%</td>
                    </tr>
                    `).join('')}
                </table>
                
                <hr>
                
                <h2>💡 Key Insights & Recommendations</h2>
                <ul>
                    ${stats.insights.map(insight => `<li>${insight}</li>`).join('')}
                </ul>
                
                <hr>
                
                <p style="font-size: 12px; color: #666;">
                    You're receiving this weekly report from AirSense Monitor.<br>
                    © 2025 AirSense. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        `;

        const subject = `📊 Your Weekly Air Quality Report - ${stats.dateRange}`;
        
        return await sendEmail(userEmail, subject, htmlContent);
    } catch (error) {
        console.error('Error generating weekly report:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Calculate weekly statistics
 */
function calculateWeeklyStats(weeklyData) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Calculate average AQI
    const totalAQI = weeklyData.reduce((sum, day) => sum + day.averageAQI, 0);
    const averageAQI = Math.round(totalAQI / weeklyData.length);

    // Count good and unhealthy days
    const goodDays = weeklyData.filter(day => day.averageAQI <= 50).length;
    const unhealthyDays = weeklyData.filter(day => day.averageAQI > 100).length;

    // Find best and worst days
    const bestDay = weeklyData.reduce((best, day) => 
        day.averageAQI < best.averageAQI ? day : best
    );
    const worstDay = weeklyData.reduce((worst, day) => 
        day.averageAQI > worst.averageAQI ? day : worst
    );

    // Generate insights
    const insights = [];
    
    if (averageAQI <= 50) {
        insights.push('✅ Great news! Your average air quality this week was <strong>Good</strong>.');
    } else if (averageAQI <= 100) {
        insights.push('😐 Your average air quality this week was <strong>Moderate</strong>. Consider using air purifiers on worse days.');
    } else {
        insights.push('⚠️ Your average air quality this week was <strong>Unhealthy</strong>. Take protective measures and limit outdoor activities.');
    }

    if (goodDays >= 5) {
        insights.push(`🌟 You had <strong>${goodDays} days</strong> of good air quality this week!`);
    }

    if (unhealthyDays > 0) {
        insights.push(`🚨 There were <strong>${unhealthyDays} unhealthy days</strong> this week. Monitor alerts and stay safe.`);
    }

    const avgPM25 = Math.round(weeklyData.reduce((sum, day) => sum + day.averagePM25, 0) / weeklyData.length);
    if (avgPM25 > 35) {
        insights.push(`💨 PM2.5 levels were high (${avgPM25} µg/m³). Consider keeping windows closed during peak pollution hours.`);
    }

    insights.push('📱 Keep monitoring your dashboard for real-time updates and alerts.');

    // Date range
    const startDate = new Date(weeklyData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = new Date(weeklyData[weeklyData.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return {
        averageAQI,
        goodDays,
        unhealthyDays,
        bestDay: {
            name: days[new Date(bestDay.date).getDay()],
            date: new Date(bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            aqi: bestDay.averageAQI,
            pm25: Math.round(bestDay.averagePM25),
            voc: Math.round(bestDay.averageVOC),
            temp: Math.round(bestDay.averageTemp)
        },
        worstDay: {
            name: days[new Date(worstDay.date).getDay()],
            date: new Date(worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            aqi: worstDay.averageAQI,
            pm25: Math.round(worstDay.averagePM25),
            voc: Math.round(worstDay.averageVOC),
            temp: Math.round(worstDay.averageTemp)
        },
        dailyBreakdown: weeklyData.map(day => ({
            name: days[new Date(day.date).getDay()],
            date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            aqi: day.averageAQI,
            pm25: Math.round(day.averagePM25),
            voc: Math.round(day.averageVOC),
            humidity: Math.round(day.averageHumidity)
        })),
        dateRange: `${startDate} - ${endDate}`,
        insights
    };
}

/**
 * Send test email
 */
async function sendTestEmail(userEmail) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; padding: 30px; }
            .header { text-align: center; color: #667eea; }
            h1 { color: #333; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Email Service Connected!</h1>
            </div>
            <p>Your AirSense email notifications are now configured and ready to use.</p>
            <p><strong>You will receive:</strong></p>
            <ul>
                <li>🚨 Alerts when air quality becomes unhealthy (after 3 consecutive readings)</li>
                <li>📊 Weekly air quality reports every Monday</li>
            </ul>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This is a test email from AirSense Monitor.
            </p>
        </div>
    </body>
    </html>
    `;

    return await sendEmail(userEmail, '✅ AirSense Notifications Activated', htmlContent);
}

/**
 * Test critical alert with custom AQI value
 */
async function testCriticalAlert(userEmail, testAqi = 160) {
    console.log('🧪 Testing critical alert with AQI:', testAqi);
    const testData = {
        aqi: testAqi,
        pm25: 50,
        voc: 250,
        temperature: 25,
        humidity: 60
    };
    return await sendCriticalAlert(testData, userEmail);
}

/**
 * Reset alert cooldown (for testing)
 */
function resetAlertCooldown() {
    lastAlertTimestamp = null;
    lastAlertType = null;
    criticalReadingsCount = 0;
    unhealthyReadingsCount = 0;
    console.log('✅ Alert cooldown and counters reset');
}

/**
 * Test weekly report with sample data
 */
async function testWeeklyReport(userEmail) {
    console.log('🧪 Testing weekly report with sample data');
    
    // Generate sample data for past 7 days
    const weeklyData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Generate realistic sample data with some variation
        const baseAQI = 50 + Math.floor(Math.random() * 100);
        
        weeklyData.push({
            date: date.toISOString().split('T')[0],
            averageAQI: baseAQI,
            averagePM25: 15 + Math.random() * 30,
            averageVOC: 100 + Math.random() * 200,
            averageTemp: 20 + Math.random() * 10,
            averageHumidity: 40 + Math.random() * 30
        });
    }
    
    console.log('📊 Sample weekly data generated:', weeklyData);
    
    // Send the weekly report
    const result = await generateWeeklyReport(weeklyData, userEmail);
    
    if (result.success) {
        console.log('✅ Test weekly report sent successfully!');
        console.log('📧 Check your email:', userEmail);
    } else {
        console.error('❌ Failed to send test weekly report:', result.error);
    }
    
    return result;
}

// Export functions
window.emailService = {
    sendEmail,
    monitorAirQuality,
    sendUnhealthyAlert,
    sendCriticalAlert,
    generateWeeklyReport,
    sendTestEmail,
    testCriticalAlert,
    testWeeklyReport,
    resetAlertCooldown,
    isUnhealthy,
    isCritical,
    getAQICategory
};
