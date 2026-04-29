// config.js - Configuration for AirSense Dashboard
// Feed names and update intervals

const CONFIG = {
    FEEDS: {
        TEMPERATURE: 'temperature',
        HUMIDITY: 'humidity',
        PM25: 'pm25',
        VOC: 'gas',  // 'gas' feed in Adafruit IO represents VOC (Volatile Organic Compounds)
        AQI: 'aqi'
    },
    UPDATE_INTERVAL: 20000 // 20 seconds (can be overridden by user preferences)
};

// Make config available globally
if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
