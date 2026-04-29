// adafruit-io.js - Adafruit IO integration for AirSense Dashboard

// Detect if running on localhost or production
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '';

// Get Adafruit IO configuration from environment variables
if (!window.ENV_CONFIG) {
    console.error('❌ Environment configuration not loaded! Make sure env-config.js is loaded before this script.');
} else {
    console.log('✅ Environment configuration loaded successfully');
}

const AIO_USERNAME = window.ENV_CONFIG?.ADAFRUIT_USERNAME;
const AIO_KEY = window.ENV_CONFIG?.ADAFRUIT_API_KEY;
const AIO_BASE_URL = window.ENV_CONFIG?.ADAFRUIT_BASE_URL;

// Validate configuration
if (!AIO_USERNAME || !AIO_KEY || !AIO_BASE_URL) {
    console.error('❌ Adafruit IO configuration is incomplete:');
    console.error('  - Username:', AIO_USERNAME ? '✓' : '✗');
    console.error('  - API Key:', AIO_KEY ? '✓' : '✗');
    console.error('  - Base URL:', AIO_BASE_URL ? '✓' : '✗');
} else {
    console.log('✅ Adafruit IO configuration validated');
    console.log('  - Username:', AIO_USERNAME);
    console.log('  - Base URL:', AIO_BASE_URL);
    console.log('  - API Key:', AIO_KEY ? '✓ Present' : '✗ Missing');
}

// Function to fetch data from Adafruit IO
async function fetchAIOData(feedKey) {
    try {
        console.log(`🔍 Fetching feed: ${feedKey}`);
        
        let url, fetchOptions;
        
        if (isLocalhost) {
            // On localhost: Call Adafruit IO API directly (for development)
            url = `${AIO_BASE_URL}/${AIO_USERNAME}/feeds/${feedKey}/data/last`;
            fetchOptions = {
                method: 'GET',
                headers: {
                    'X-AIO-Key': AIO_KEY,
                    'Content-Type': 'application/json'
                }
            };
            console.log(`📡 [LOCALHOST] Calling Adafruit IO API directly: ${url}`);
        } else {
            // On Vercel: Use serverless proxy to keep API key secure
            url = `/api/adafruit?feed=${feedKey}`;
            fetchOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            console.log(`📡 [PRODUCTION] Calling API proxy: ${url}`);
        }
        
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API responded with status: ${response.status} ${response.statusText}`);
            console.error(`Error details: ${errorText}`);
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Successfully fetched ${feedKey}:`, data.value);
        return data;
    } catch (error) {
        console.error(`❌ Error fetching data from Adafruit IO feed ${feedKey}:`, error);
        throw error;
    }
}

// Function to fetch multiple feeds
async function fetchMultipleFeeds(feedKeys) {
    const promises = feedKeys.map(feedKey => fetchAIOData(feedKey));
    const results = await Promise.all(promises);
    
    // Create an object with feed keys as properties
    const data = {};
    feedKeys.forEach((feedKey, index) => {
        data[feedKey] = results[index];
    });
    
    return data;
}

// Function to initialize Adafruit IO data fetching
function initAIOData() {
    // Validate configuration before starting
    if (!AIO_USERNAME || !AIO_KEY || !AIO_BASE_URL) {
        console.error('❌ Cannot initialize Adafruit IO: Configuration is incomplete');
        console.error('Please check that env-config.js is loaded and contains all required values');
        return;
    }
    
    console.log('🚀 Initializing Adafruit IO data fetching...');
    console.log('📍 Running on:', isLocalhost ? 'localhost' : 'production');
    
    // Define the feeds we want to monitor
    // Note: 'gas' feed from Adafruit IO is mapped to VOC (Volatile Organic Compounds)
    const feeds = ['temperature', 'humidity', 'pm25', 'gas', 'aqi'];
    console.log('📋 Monitoring feeds:', feeds.join(', '));
    
    // Fetch initial data immediately
    console.log('⏱️ Fetching initial data...');
    fetchAIODataPeriodically(feeds);
    
    // Get update interval from config (default to 20 seconds)
    const updateInterval = (window.APP_CONFIG && window.APP_CONFIG.UPDATE_INTERVAL) || 20000;
    
    // Set up periodic updates
    setInterval(() => fetchAIODataPeriodically(feeds), updateInterval);
    
    console.log(`✅ Adafruit IO updates scheduled every ${updateInterval / 1000} seconds`);
}

// Function to periodically fetch data and update the dashboard
async function fetchAIODataPeriodically(feeds) {
    try {
        console.log('🔄 Fetching data from Adafruit IO feeds:', feeds);
        const data = await fetchMultipleFeeds(feeds);
        
        // Log the fetched data
        console.log('📥 Data received from Adafruit IO:');
        feeds.forEach(feed => {
            if (data[feed] && data[feed].value) {
                console.log(`  ✓ ${feed}: ${data[feed].value}`);
            } else {
                console.warn(`  ✗ ${feed}: No data`);
            }
        });
        
        // Update the dashboard with the fetched data
        updateDashboardWithData(data);
    } catch (error) {
        console.error('❌ Error in periodic data fetching:', error);
    }
}

// Function to update dashboard with Adafruit IO data - smooth updates without page refresh
function updateDashboardWithData(data) {
    console.log('🔄 Updating dashboard with Adafruit IO data:', data);
    
    // Helper function to get AQI status based on value
    function getAQIStatus(aqi) {
        if (aqi <= 50) return { status: "Good", description: "Air quality is satisfactory", colorClass: "aqi-card-good" };
        if (aqi <= 100) return { status: "Moderate", description: "Acceptable for most people", colorClass: "aqi-card-warning" };
        if (aqi <= 150) return { status: "Unhealthy for Sensitive Groups", description: "Sensitive groups may experience symptoms", colorClass: "aqi-card-unhealthy-sensitive" };
        if (aqi <= 200) return { status: "Unhealthy", description: "Everyone may experience health effects", colorClass: "aqi-card-unhealthy" };
        if (aqi <= 300) return { status: "Very Unhealthy", description: "Health alert for everyone", colorClass: "aqi-card-very-unhealthy" };
        return { status: "Hazardous", description: "Emergency conditions for all", colorClass: "aqi-card-hazardous" };
    }
    
    // Helper function for smooth text update
    function smoothUpdateText(element, newValue) {
        if (!element) {
            console.warn('⚠️ Element not found for update');
            return;
        }
        const currentText = element.textContent.trim();
        const newText = String(newValue).trim();
        if (currentText === newText) return;
        
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0.5';
        setTimeout(() => {
            element.textContent = newValue;
            element.style.opacity = '1';
        }, 150);
    }
    
    // Update AQI Card
    if (data.aqi && data.aqi.value) {
        const aqiValue = parseFloat(data.aqi.value);
        const statusInfo = getAQIStatus(aqiValue);
        console.log('📊 Updating AQI:', aqiValue);
        
        // Find AQI elements
        const aqiCard = document.querySelector('[class*="aqi-card"]');
        if (aqiCard) {
            // Update AQI value
            const aqiValueElement = aqiCard.querySelector('.text-5xl');
            if (aqiValueElement) {
                smoothUpdateText(aqiValueElement, Math.round(aqiValue));
                console.log('✅ AQI value updated');
            } else {
                console.warn('⚠️ AQI value element not found');
            }
            
            // Update AQI status
            const aqiStatusElement = aqiCard.querySelector('.text-xl.font-semibold');
            if (aqiStatusElement) {
                smoothUpdateText(aqiStatusElement, statusInfo.status);
            }
            
            // Update AQI description
            const aqiDescElement = aqiCard.querySelector('.text-sm');
            if (aqiDescElement) {
                smoothUpdateText(aqiDescElement, statusInfo.description);
            }
            
            // Update card color class
            const oldClasses = ['aqi-card-good', 'aqi-card-warning', 'aqi-card-unhealthy-sensitive', 
                               'aqi-card-unhealthy', 'aqi-card-very-unhealthy', 'aqi-card-hazardous'];
            oldClasses.forEach(cls => aqiCard.classList.remove(cls));
            aqiCard.classList.add(statusInfo.colorClass);
            
            // Update progress bar
            const progressBar = document.getElementById('aqi-progress-bar');
            if (progressBar) {
                const percentage = Math.min((aqiValue / 300) * 100, 100);
                progressBar.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                progressBar.style.width = `${percentage}%`;
            }
        } else {
            console.warn('⚠️ AQI card not found');
        }
    }
    
    // Update Temperature
    if (data.temperature && data.temperature.value) {
        const tempValue = parseFloat(data.temperature.value).toFixed(2);
        console.log('🌡️ Updating Temperature:', tempValue);
        const statsCards = document.querySelectorAll('.stats-grid .card-peaceful');
        console.log('📦 Found stats cards:', statsCards.length);
        if (statsCards[0]) {
            const tempElement = statsCards[0].querySelector('.stat-value');
            if (tempElement) {
                smoothUpdateText(tempElement, `${tempValue}°C`);
                console.log('✅ Temperature updated');
            } else {
                console.warn('⚠️ Temperature element not found');
            }
        }
    }
    
    // Update Humidity
    if (data.humidity && data.humidity.value) {
        const humidityValue = parseFloat(data.humidity.value).toFixed(2);
        console.log('💧 Updating Humidity:', humidityValue);
        const statsCards = document.querySelectorAll('.stats-grid .card-peaceful');
        if (statsCards[1]) {
            const humidityElement = statsCards[1].querySelector('.stat-value');
            if (humidityElement) {
                smoothUpdateText(humidityElement, `${humidityValue}%`);
                console.log('✅ Humidity updated');
            } else {
                console.warn('⚠️ Humidity element not found');
            }
        }
    }
    
    // Update PM2.5
    if (data.pm25 && data.pm25.value) {
        const pm25Value = parseFloat(data.pm25.value).toFixed(2);
        console.log('🌫️ Updating PM2.5:', pm25Value);
        const statsCards = document.querySelectorAll('.stats-grid .card-peaceful');
        if (statsCards[2]) {
            const pm25Element = statsCards[2].querySelector('.stat-value');
            if (pm25Element) {
                smoothUpdateText(pm25Element, pm25Value);
                console.log('✅ PM2.5 updated');
            } else {
                console.warn('⚠️ PM2.5 element not found');
            }
        }
    }
    
    // Update VOC (from 'gas' feed in Adafruit IO)
    if (data.gas && data.gas.value) {
        const vocValue = Math.round(parseFloat(data.gas.value));
        console.log('🧪 Updating VOC:', vocValue);
        const statsCards = document.querySelectorAll('.stats-grid .card-peaceful');
        if (statsCards[3]) {
            const vocElement = statsCards[3].querySelector('.stat-value');
            if (vocElement) {
                smoothUpdateText(vocElement, vocValue);
                console.log('✅ VOC updated');
            } else {
                console.warn('⚠️ VOC element not found');
            }
        }
    }
    
    console.log('✅ Dashboard update completed successfully');
    
    // Store sensor data in Supabase and monitor air quality
    if (typeof sensorDataService !== 'undefined' && typeof window.currentUserId !== 'undefined') {
        const sensorData = {
            temperature: data.temperature?.value || 0,
            humidity: data.humidity?.value || 0,
            pm25: data.pm25?.value || 0,
            gas: data.gas?.value || 0,
            voc: data.gas?.value || 0,
            aqi: data.aqi?.value || 0
        };
        
        console.log('💾 Storing sensor data to Supabase:', sensorData);
        
        // Store in Supabase
        sensorDataService.autoStoreSensorData(sensorData, window.currentUserId)
            .then(result => {
                if (result.success) {
                    console.log('✅ Sensor data stored in Supabase successfully');
                } else {
                    console.warn('⚠️ Failed to store sensor data:', result.error);
                }
            })
            .catch(err => {
                console.error('❌ Error storing sensor data:', err);
            });

        // Monitor air quality and send alerts if needed
        if (typeof emailService !== 'undefined' && window.currentUserEmail) {
            console.log('📊 Monitoring air quality - AQI:', sensorData.aqi, 'User:', window.currentUserEmail);
            emailService.monitorAirQuality(sensorData, window.currentUserEmail)
                .then(result => {
                    if (result.success) {
                        console.log('✅ Air quality monitoring active');
                    } else {
                        console.error('❌ Air quality monitoring failed:', result.error);
                    }
                })
                .catch(err => {
                    console.error('❌ Error monitoring air quality:', err);
                });
        } else {
            if (typeof emailService === 'undefined') {
                console.warn('⚠️ Email service not loaded');
            }
            if (!window.currentUserEmail) {
                console.warn('⚠️ User email not available');
            }
        }
    } else {
        if (typeof sensorDataService === 'undefined') {
            console.warn('⚠️ Sensor data service not loaded');
        }
        if (typeof window.currentUserId === 'undefined') {
            console.warn('⚠️ User ID not available');
        }
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchAIOData,
        fetchMultipleFeeds,
        initAIOData,
        updateDashboardWithData
    };
} else {
    // Make functions available globally
    window.fetchAIOData = fetchAIOData;
    window.fetchMultipleFeeds = fetchMultipleFeeds;
    window.initAIOData = initAIOData;
    window.updateDashboardWithData = updateDashboardWithData;
}