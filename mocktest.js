// mocktest.js - Mock data generation and real-time updates for AirSense Dashboard

// Configuration
const CONFIG = {
    updateInterval: 5000, // 5 seconds
    aqiRange: { min: 0, max: 400 }, // Extended range to include hazardous levels
    tempRange: { min: 10, max: 45 },
    humidityRange: { min: 20, max: 90 },
    pm25Range: { min: 0, max: 150 }, // Extended for hazardous levels
    vocRange: { min: 0, max: 500 } // VOC in ppb (parts per billion), 0-500 ppb range
};

// Current data state
let currentData = {
    aqi: 50,
    temp: 33.32,
    humidity: 57.52,
    pm25: 17.83,
    voc: 125, // VOC in ppb (parts per billion)
    status: "Good"
};

// DOM Elements
const elements = {
    aqiValue: null,
    aqiStatus: null,
    aqiDescription: null,
    aqiProgress: null,
    aqiScaleLabels: null,
    aqiScaleContainer: null,
    tempValue: null,
    humidityValue: null,
    pm25Value: null,
    vocValue: null
};

// Initialize the mock data system
function initMockData() {
    // Get DOM elements - using more specific selectors
    const aqiCard = document.querySelector('[class*="aqi-card"]');
    if (aqiCard) {
        elements.aqiValue = aqiCard.querySelector('.text-5xl');
        elements.aqiStatus = aqiCard.querySelector('.text-xl.font-semibold');
        elements.aqiDescription = aqiCard.querySelector('.text-sm');
    }
    elements.aqiProgress = document.getElementById('aqi-progress-bar');
    // More specific selector to avoid duplicates - only select spans within the AQI scale container
    const aqiScaleContainer = document.querySelector('.flex.justify-between.text-xs');
    elements.aqiScaleLabels = aqiScaleContainer ? aqiScaleContainer.querySelectorAll('span') : null;
    
    // Get stats grid values
    const statsCards = document.querySelectorAll('.stats-grid .card-peaceful, .grid.grid-cols-2 .card-peaceful');
    if (statsCards.length >= 4) {
        elements.tempValue = statsCards[0].querySelector('.stat-value, .text-2xl');
        elements.humidityValue = statsCards[1].querySelector('.stat-value, .text-2xl');
        elements.pm25Value = statsCards[2].querySelector('.stat-value, .text-2xl');
        elements.vocValue = statsCards[3].querySelector('.stat-value, .text-2xl');
    }
    
    // Start data updates
    setInterval(updateAllData, CONFIG.updateInterval);
    
    // Initial update
    updateAllData();
}

// Generate a realistic value with more fluctuation
function generateRealisticValue(current, min, max, variation = 5) {
    // Increase variation for more fluctuation
    const change = (Math.random() * variation * 2) - variation;
    let newValue = current + change;
    
    // Occasionally create larger jumps to simulate real-world changes
    if (Math.random() < 0.2) { // 20% chance of a larger change
        const largeChange = (Math.random() * variation * 4) - (variation * 2);
        newValue = current + largeChange;
    }
    
    // Ensure value stays within bounds
    newValue = Math.max(min, Math.min(max, newValue));
    
    // Round to appropriate decimal places
    if (newValue < 10) {
        return Math.round(newValue * 100) / 100;
    } else {
        return Math.round(newValue * 10) / 10;
    }
}

// Determine AQI status based on value - matching React component categories
function getAQIStatus(aqi) {
    if (aqi <= 50) return { status: "Good", description: "Air quality is satisfactory", colorClass: "aqi-card-good" };
    if (aqi <= 100) return { status: "Moderate", description: "Acceptable for most people", colorClass: "aqi-card-warning" };
    if (aqi <= 150) return { status: "Unhealthy for Sensitive Groups", description: "Sensitive groups may experience symptoms", colorClass: "aqi-card-unhealthy-sensitive" };
    if (aqi <= 200) return { status: "Unhealthy", description: "Everyone may experience health effects", colorClass: "aqi-card-unhealthy" };
    if (aqi <= 300) return { status: "Very Unhealthy", description: "Health alert for everyone", colorClass: "aqi-card-very-unhealthy" };
    return { status: "Hazardous", description: "Emergency conditions for all", colorClass: "aqi-card-hazardous" };
}

// Update AQI scale labels to fixed scale (0, 50, 100, 150, 200, 300+) - matching React component
// Note: Labels are now hardcoded in HTML, so this function only updates if they don't exist
function updateAQIScaleLabels() {
    if (elements.aqiScaleLabels && elements.aqiScaleLabels.length >= 6) {
        // Fixed scale points to match React component
        const scalePoints = [0, 50, 100, 150, 200, "300+"];
        
        // Only update if the labels are empty or incorrect
        for (let i = 0; i < 6; i++) {
            if (elements.aqiScaleLabels[i] && !elements.aqiScaleLabels[i].textContent.trim()) {
                elements.aqiScaleLabels[i].textContent = scalePoints[i];
            }
        }
    }
}

// Update AQI data
function updateAQIData() {
    // Generate new AQI value with more fluctuation
    currentData.aqi = generateRealisticValue(currentData.aqi, CONFIG.aqiRange.min, CONFIG.aqiRange.max, 10);
    
    // Get status information
    const statusInfo = getAQIStatus(currentData.aqi);
    currentData.status = statusInfo.status;
    
    // Update DOM elements if they exist - with smooth transition
    if (elements.aqiValue) {
        smoothUpdateText(elements.aqiValue, Math.round(currentData.aqi));
    }
    if (elements.aqiStatus) {
        smoothUpdateText(elements.aqiStatus, statusInfo.status);
    }
    if (elements.aqiDescription) {
        smoothUpdateText(elements.aqiDescription, statusInfo.description);
    }
    if (elements.aqiProgress) {
        // Calculate percentage based on the fixed 0-300 scale (matching React component)
        let percentage;
        if (currentData.aqi <= 300) {
            percentage = (currentData.aqi / 300) * 100;
        } else {
            percentage = 100;
        }
        smoothUpdateWidth(elements.aqiProgress, percentage);
    }
    
    // Update AQI scale labels
    updateAQIScaleLabels();
    
    // Update card styling based on AQI status
    const aqiCard = document.querySelector('[class*="aqi-card"]');
    if (aqiCard) {
        // Remove all status classes
        aqiCard.classList.remove('aqi-card-good', 'aqi-card-warning', 'aqi-card-unhealthy-sensitive', 
                               'aqi-card-unhealthy', 'aqi-card-very-unhealthy', 'aqi-card-hazardous');
        // Add appropriate class
        aqiCard.classList.add(statusInfo.colorClass || 'aqi-card-good');
    }
}

// Update temperature data with more fluctuation
function updateTempData() {
    currentData.temp = generateRealisticValue(currentData.temp, CONFIG.tempRange.min, CONFIG.tempRange.max, 2);
    if (elements.tempValue) {
        // Update with just the number, the unit should be in the label
        const textContent = elements.tempValue.textContent;
        if (textContent.includes('°C')) {
            smoothUpdateText(elements.tempValue, `${currentData.temp.toFixed(2)}°C`);
        } else {
            smoothUpdateText(elements.tempValue, currentData.temp.toFixed(2));
        }
    }
}

// Update humidity data with more fluctuation
function updateHumidityData() {
    currentData.humidity = generateRealisticValue(currentData.humidity, CONFIG.humidityRange.min, CONFIG.humidityRange.max, 3);
    if (elements.humidityValue) {
        // Update with just the number, the unit should be in the label
        const textContent = elements.humidityValue.textContent;
        if (textContent.includes('%')) {
            smoothUpdateText(elements.humidityValue, `${currentData.humidity.toFixed(2)}%`);
        } else {
            smoothUpdateText(elements.humidityValue, currentData.humidity.toFixed(2));
        }
    }
}

// Update PM2.5 data with more fluctuation
function updatePM25Data() {
    currentData.pm25 = generateRealisticValue(currentData.pm25, CONFIG.pm25Range.min, CONFIG.pm25Range.max, 5);
    if (elements.pm25Value) {
        smoothUpdateText(elements.pm25Value, currentData.pm25.toFixed(2));
    }
}

// Update VOC data with more fluctuation
function updateVOCData() {
    currentData.voc = generateRealisticValue(currentData.voc, CONFIG.vocRange.min, CONFIG.vocRange.max, 15);
    if (elements.vocValue) {
        smoothUpdateText(elements.vocValue, Math.round(currentData.voc));
    }
}

// Smooth text update function with fade effect
function smoothUpdateText(element, newValue) {
    if (!element) return;
    
    // Only update if value actually changed
    const currentText = element.textContent.trim();
    const newText = String(newValue).trim();
    
    if (currentText === newText) return;
    
    // Add fade-out class
    element.style.transition = 'opacity 0.3s ease';
    element.style.opacity = '0.5';
    
    // Update text after brief delay
    setTimeout(() => {
        element.textContent = newValue;
        element.style.opacity = '1';
    }, 150);
}

// Smooth width update function for progress bars
function smoothUpdateWidth(element, percentage) {
    if (!element) return;
    
    element.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    element.style.width = `${percentage}%`;
}

// Update all data
function updateAllData() {
    updateAQIData();
    updateTempData();
    updateHumidityData();
    updatePM25Data();
    updateVOCData();
    
    // Update global reference for alert system
    if (typeof window !== 'undefined') {
        window.currentData = currentData;
    }
    
    // Log updated data to console for debugging
    console.log('Updated AirSense Data:', currentData);
}

// Generate mock data for historical trends (24 hours) - matching React component structure
function generateMockChartData(hours = 24) {
    const now = new Date();
    const data = {
        timestamps: [],
        aqi: [],
        pm25: [],
        pm10: [],
        voc: [], // VOC in ppb (parts per billion)
        humidity: [], // Humidity percentage
        temperature: [] // Changed from temp to temperature to match React component
    };
    
    // Generate data for each hour with realistic variations
    for (let i = hours - 1; i >= 0; i--) {
        const time = new Date(now);
        time.setHours(time.getHours() - i);
        
        // Format time as "HH:00" for better readability
        const formattedTime = `${time.getHours().toString().padStart(2, '0')}:00`;
        
        data.timestamps.push(formattedTime);
        
        // Generate realistic values with variations
        // AQI values (0-300 range to match React component)
        const baseAQI = 50 + Math.sin(i / 4) * 30; // Sinusoidal pattern for natural variation
        data.aqi.push(Math.max(0, Math.min(300, Math.round(baseAQI + (Math.random() * 40 - 20)))));
        
        // PM2.5 values (0-100 range)
        const basePM25 = 20 + Math.sin(i / 3) * 15;
        data.pm25.push(Math.max(0, Math.min(100, Math.round(basePM25 + (Math.random() * 20 - 10)))));
        
        // PM10 values (0-100 range, typically higher than PM2.5)
        const basePM10 = 30 + Math.sin(i / 3) * 20;
        data.pm10.push(Math.max(0, Math.min(100, Math.round(basePM10 + (Math.random() * 25 - 12)))));
        
        // VOC values (0-500 ppb range) - Volatile Organic Compounds
        const baseVOC = 150 + Math.sin(i / 5) * 80;
        data.voc = data.voc || [];
        data.voc.push(Math.max(0, Math.min(500, Math.round(baseVOC + (Math.random() * 100 - 50)))));
        
        // Humidity values (20-90% range)
        const baseHumidity = 55 + Math.sin(i / 4) * 15;
        data.humidity.push(Math.max(20, Math.min(90, Math.round(baseHumidity + (Math.random() * 10 - 5)))));
        
        // Temperature values (10-45 range)
        const baseTemp = 25 + Math.sin(i / 6) * 10;
        data.temperature.push(Math.max(10, Math.min(45, Math.round((baseTemp + (Math.random() * 8 - 4)) * 10) / 10)));
    }
    
    return data;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initMockData,
        generateMockChartData,
        currentData,
        CONFIG
    };
} else {
    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMockData);
    } else {
        initMockData();
    }
    
    // Make currentData globally accessible for the alert system
    window.currentData = currentData;
    console.log('Mock data initialized and made globally accessible');
}
