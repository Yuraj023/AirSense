// Analytics JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Analytics JS loaded');
    // Initialize charts
    initPM25TrendChart();
    initVOCTrendChart();
    initTempHumidityChart();
    initAQIChart();
    
    // Set up event listeners
    setupAnalyticsEventListeners();
    
    // Add resize listener to update charts on window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            // Destroy existing charts
            if (pm25TrendChart) pm25TrendChart.destroy();
            if (vocTrendChart) vocTrendChart.destroy();
            if (tempHumidityChart) tempHumidityChart.destroy();
            if (aqiChart) aqiChart.destroy();
            
            // Reinitialize charts
            initPM25TrendChart();
            initVOCTrendChart();
            initTempHumidityChart();
            initAQIChart();
        }, 250);
    });
});

// Chart instances
let pm25TrendChart, vocTrendChart, tempHumidityChart, aqiChart;

// Initialize PM2.5 Trend Chart
function initPM25TrendChart() {
    console.log('Initializing PM2.5 Trend Chart');
    const canvas = document.getElementById('pm25TrendChart');
    if (!canvas) {
        console.error('Canvas element not found for pm25TrendChart');
        return;
    }
    const ctx = canvas.getContext('2d');
    
    // Start with empty data - will be filled by real-time Adafruit IO data
    const hours = [];
    const pm25Data = [];
    
    // Check if we're on a mobile device
    const isMobile = window.innerWidth <= 768;
    
    pm25TrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'PM2.5 (µg/m³)',
                data: pm25Data,
                borderColor: 'hsl(210 85% 65%)',
                backgroundColor: 'hsla(210 85% 65% / 0.1)',
                borderWidth: isMobile ? 2 : 3,
                tension: 0.4,
                fill: true,
                pointRadius: isMobile ? 2 : 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'hsl(210 85% 65%)',
                pointHoverRadius: isMobile ? 4 : 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750
            },
            scales: {
                x: {
                    grid: {
                        color: 'hsla(225 30% 25% / 0.5)'
                    },
                    ticks: {
                        color: 'hsl(215 20% 75%)',
                        font: {
                            size: isMobile ? 10 : 12
                        },
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: {
                        color: 'hsla(225 30% 25% / 0.5)'
                    },
                    ticks: {
                        color: 'hsl(215 20% 75%)',
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    },
                    title: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'hsl(210 25% 95%)',
                        font: {
                            family: "'Inter', sans-serif",
                            size: isMobile ? 10 : 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'hsla(230 55% 6% / 0.95)',
                    titleColor: 'hsl(210 25% 95%)',
                    bodyColor: 'hsl(210 30% 98%)',
                    borderColor: 'hsl(230 35% 20%)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: isMobile ? 8 : 12,
                    titleFont: {
                        size: isMobile ? 12 : 14
                    },
                    bodyFont: {
                        size: isMobile ? 10 : 12
                    }
                }
            }
        }
    });
}

// Initialize VOC Trend Chart
function initVOCTrendChart() {
    console.log('Initializing VOC Trend Chart');
    const canvas = document.getElementById('vocTrendChart');
    if (!canvas) {
        console.error('Canvas element not found for vocTrendChart');
        return;
    }
    const ctx = canvas.getContext('2d');
    
    // Start with empty data - will be filled by real-time Adafruit IO data
    const hours = [];
    const vocData = [];
    
    // Check if we're on a mobile device
    const isMobile = window.innerWidth <= 768;
    
    vocTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'VOC (ppb)',
                data: vocData,
                borderColor: 'hsl(280 75% 65%)',
                backgroundColor: 'hsla(280 75% 65% / 0.1)',
                borderWidth: isMobile ? 2 : 3,
                tension: 0.4,
                fill: true,
                pointRadius: isMobile ? 2 : 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'hsl(280 75% 65%)',
                pointHoverRadius: isMobile ? 4 : 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750
            },
            scales: {
                x: {
                    grid: {
                        color: 'hsla(225 30% 25% / 0.5)'
                    },
                    ticks: {
                        color: 'hsl(215 20% 75%)',
                        font: {
                            size: isMobile ? 10 : 12
                        },
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: {
                        color: 'hsla(225 30% 25% / 0.5)'
                    },
                    ticks: {
                        color: 'hsl(215 20% 75%)',
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    },
                    title: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'hsl(210 25% 95%)',
                        font: {
                            family: "'Inter', sans-serif",
                            size: isMobile ? 10 : 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'hsla(230 55% 6% / 0.95)',
                    titleColor: 'hsl(210 25% 95%)',
                    bodyColor: 'hsl(210 30% 98%)',
                    borderColor: 'hsl(230 35% 20%)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: isMobile ? 8 : 12,
                    titleFont: {
                        size: isMobile ? 12 : 14
                    },
                    bodyFont: {
                        size: isMobile ? 10 : 12
                    }
                }
            }
        }
    });
}

// Initialize Temperature & Humidity Chart
function initTempHumidityChart() {
    console.log('Initializing Temperature & Humidity Chart');
    const canvas = document.getElementById('tempHumidityChart');
    if (!canvas) {
        console.error('Canvas element not found for tempHumidityChart');
        return;
    }
    const ctx = canvas.getContext('2d');
    
    // Start with empty data - will be filled by real-time Adafruit IO data
    const hours = [];
    const tempData = [];
    const humidityData = [];
    
    // Check if we're on a mobile device
    const isMobile = window.innerWidth <= 768;
    
    tempHumidityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: tempData,
                    borderColor: 'hsl(210 85% 65%)',
                    backgroundColor: 'hsla(210 85% 65% / 0.1)',
                    borderWidth: isMobile ? 2 : 3,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y',
                    pointRadius: isMobile ? 2 : 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'hsl(210 85% 65%)',
                    pointHoverRadius: isMobile ? 4 : 6
                },
                {
                    label: 'Humidity (%)',
                    data: humidityData,
                    borderColor: 'hsl(160 65% 55%)',
                    backgroundColor: 'hsla(160 65% 55% / 0.1)',
                    borderWidth: isMobile ? 2 : 3,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1',
                    pointRadius: isMobile ? 2 : 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'hsl(160 65% 55%)',
                    pointHoverRadius: isMobile ? 4 : 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750
            },
            scales: {
                x: {
                    grid: {
                        color: 'hsla(225 30% 25% / 0.5)'
                    },
                    ticks: {
                        color: 'hsl(215 20% 75%)',
                        font: {
                            size: isMobile ? 10 : 12
                        },
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'hsla(225 30% 25% / 0.5)'
                    },
                    ticks: {
                        color: 'hsl(215 20% 75%)',
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    },
                    title: {
                        display: false
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: 'hsl(215 20% 75%)',
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    },
                    title: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'hsl(210 25% 95%)',
                        font: {
                            family: "'Inter', sans-serif",
                            size: isMobile ? 10 : 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'hsla(230 55% 6% / 0.95)',
                    titleColor: 'hsl(210 25% 95%)',
                    bodyColor: 'hsl(210 30% 98%)',
                    borderColor: 'hsl(230 35% 20%)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: isMobile ? 8 : 12,
                    titleFont: {
                        size: isMobile ? 12 : 14
                    },
                    bodyFont: {
                        size: isMobile ? 10 : 12
                    }
                }
            }
        }
    });
}

// Initialize AQI Chart
function initAQIChart() {
    console.log('Initializing AQI Chart');
    const canvas = document.getElementById('aqiChart');
    if (!canvas) {
        console.error('Canvas element not found for aqiChart');
        return;
    }
    const ctx = canvas.getContext('2d');
    
    // Start with empty data - will be filled by real-time Adafruit IO data
    const hours = [];
    const aqiData = [];
    
    // Check if we're on a mobile device
    const isMobile = window.innerWidth <= 768;
    
    aqiChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Air Quality Index',
                data: aqiData,
                borderColor: 'hsl(48 85% 65%)',
                backgroundColor: 'hsla(48 85% 65% / 0.1)',
                borderWidth: isMobile ? 2 : 3,
                tension: 0.4,
                fill: true,
                pointRadius: isMobile ? 2 : 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'hsl(48 85% 65%)',
                pointHoverRadius: isMobile ? 4 : 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750
            },
            scales: {
                x: {
                    grid: {
                        color: 'hsla(225 30% 25% / 0.5)'
                    },
                    ticks: {
                        color: 'hsl(215 20% 75%)',
                        font: {
                            size: isMobile ? 10 : 12
                        },
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: {
                        color: 'hsla(225 30% 25% / 0.5)'
                    },
                    ticks: {
                        color: 'hsl(215 20% 75%)',
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    },
                    title: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'hsl(210 25% 95%)',
                        font: {
                            family: "'Inter', sans-serif",
                            size: isMobile ? 10 : 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'hsla(230 55% 6% / 0.95)',
                    titleColor: 'hsl(210 25% 95%)',
                    bodyColor: 'hsl(210 30% 98%)',
                    borderColor: 'hsl(230 35% 20%)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: isMobile ? 8 : 12,
                    titleFont: {
                        size: isMobile ? 12 : 14
                    },
                    bodyFont: {
                        size: isMobile ? 10 : 12
                    }
                }
            }
        }
    });
}

// Set up event listeners for analytics page
function setupAnalyticsEventListeners() {
    // Date range picker functionality
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs.length >= 2) {
        // Set default dates (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        dateInputs[0].valueAsDate = startDate;
        dateInputs[1].valueAsDate = endDate;
    }
    
    // Apply button
    const applyButton = document.querySelector('.card-peaceful button.gradient-primary');
    if (applyButton) {
        applyButton.addEventListener('click', function() {
            // In a real implementation, this would fetch data for the selected date range
            alert('In a real implementation, this would fetch data for the selected date range');
        });
    }
    
    // Filter selects
    const filterSelects = document.querySelectorAll('select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            // In a real implementation, this would update the filter
            console.log('Filter changed:', this.value);
        });
    });
    
    // Set up real-time chart updates every 30 seconds
    setInterval(updateChartsWithLiveData, 30000);
}

// Update charts with live sensor data - smooth updates without full page refresh
function updateChartsWithLiveData() {
    console.log('Updating charts with live data...');
    
    // Get current data from global scope if available
    const currentData = window.currentData || null;
    
    if (!currentData && typeof generateMockChartData !== 'function') {
        console.warn('No data source available for chart update');
        return;
    }
    
    // If we have currentData, add new point to existing charts
    if (currentData) {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Update PM2.5 chart with new data point
        if (pm25TrendChart) {
            pm25TrendChart.data.labels.push(timeLabel);
            pm25TrendChart.data.datasets[0].data.push(currentData.pm25);
            
            // Keep only last 24 points
            if (pm25TrendChart.data.labels.length > 24) {
                pm25TrendChart.data.labels.shift();
                pm25TrendChart.data.datasets[0].data.shift();
            }
            
            pm25TrendChart.update('none'); // 'none' for smooth update without animation
        }
        
        // Update VOC chart with new data point
        if (vocTrendChart) {
            vocTrendChart.data.labels.push(timeLabel);
            vocTrendChart.data.datasets[0].data.push(currentData.voc);
            
            if (vocTrendChart.data.labels.length > 24) {
                vocTrendChart.data.labels.shift();
                vocTrendChart.data.datasets[0].data.shift();
            }
            
            vocTrendChart.update('none');
        }
        
        // Update Temperature & Humidity chart with new data points
        if (tempHumidityChart) {
            tempHumidityChart.data.labels.push(timeLabel);
            tempHumidityChart.data.datasets[0].data.push(currentData.temp);
            tempHumidityChart.data.datasets[1].data.push(currentData.humidity);
            
            if (tempHumidityChart.data.labels.length > 24) {
                tempHumidityChart.data.labels.shift();
                tempHumidityChart.data.datasets[0].data.shift();
                tempHumidityChart.data.datasets[1].data.shift();
            }
            
            tempHumidityChart.update('none');
        }
        
        // Update AQI chart with new data point
        if (aqiChart) {
            aqiChart.data.labels.push(timeLabel);
            aqiChart.data.datasets[0].data.push(currentData.aqi);
            
            if (aqiChart.data.labels.length > 24) {
                aqiChart.data.labels.shift();
                aqiChart.data.datasets[0].data.shift();
            }
            
            aqiChart.update('none');
        }
    } else {
        // Fallback: regenerate all data
        const mockData = generateMockChartData(24);
        
        if (pm25TrendChart && mockData.pm25) {
            pm25TrendChart.data.labels = mockData.timestamps;
            pm25TrendChart.data.datasets[0].data = mockData.pm25;
            pm25TrendChart.update('none');
        }
        
        if (vocTrendChart && mockData.voc) {
            vocTrendChart.data.labels = mockData.timestamps;
            vocTrendChart.data.datasets[0].data = mockData.voc;
            vocTrendChart.update('none');
        }
        
        if (tempHumidityChart && mockData.temperature && mockData.humidity) {
            tempHumidityChart.data.labels = mockData.timestamps;
            tempHumidityChart.data.datasets[0].data = mockData.temperature;
            tempHumidityChart.data.datasets[1].data = mockData.humidity;
            tempHumidityChart.update('none');
        }
        
        if (aqiChart && mockData.aqi) {
            aqiChart.data.labels = mockData.timestamps;
            aqiChart.data.datasets[0].data = mockData.aqi;
            aqiChart.update('none');
        }
    }
    
    console.log('Charts updated successfully - no page refresh');
}