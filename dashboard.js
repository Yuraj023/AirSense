// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initAirQualityChart();
    initPM25Gauge();
    initTempSparkline();
    
    // Set up event listeners
    setupEventListeners();
    
    // Simulate real-time data updates
    setInterval(updateDashboardData, 5000);
    
    // Initialize tooltips
    initTooltips();
});

// Main air quality chart
let airQualityChart;

// Initialize the main air quality chart
function initAirQualityChart() {
    const canvas = document.getElementById('airQualityChart');
    if (!canvas) {
        console.warn('⚠️ airQualityChart canvas not found on this page, skipping chart initialization');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Sample data for demonstration
    const hours = [];
    const pm25Data = [];
    const vocData = [];
    const aqiData = [];
    
    // Generate sample data for the last 24 hours
    for (let i = 23; i >= 0; i--) {
        const time = new Date();
        time.setHours(time.getHours() - i);
        hours.push(time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        
        // Generate realistic sample data
        pm25Data.push(Math.floor(Math.random() * 50) + 30);
        vocData.push(Math.random() * 1.5);
        aqiData.push(Math.floor(Math.random() * 50) + 50);
    }
    
    airQualityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [
                {
                    label: 'PM2.5 (µg/m³)',
                    data: pm25Data,
                    borderColor: 'hsl(210 85% 65%)',
                    backgroundColor: 'hsla(210 85% 65% / 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'hsl(210 85% 65%)',
                    pointHoverRadius: 6
                },
                {
                    label: 'VOC (ppm)',
                    data: vocData,
                    borderColor: 'hsl(280 75% 65%)',
                    backgroundColor: 'hsla(280 75% 65% / 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1',
                    pointRadius: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'hsl(280 75% 65%)',
                    pointHoverRadius: 6
                },
                {
                    label: 'AQI',
                    data: aqiData,
                    borderColor: 'hsl(0 75% 55%)',
                    backgroundColor: 'hsla(0 75% 55% / 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y2',
                    pointRadius: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'hsl(0 75% 55%)',
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    grid: {
                        color: 'hsla(225 30% 25% / 0.5)'
                    },
                    ticks: {
                        color: 'hsl(215 20% 75%)'
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
                        color: 'hsl(215 20% 75%)'
                    },
                    title: {
                        display: true,
                        text: 'PM2.5 (µg/m³)',
                        color: 'hsl(215 20% 75%)'
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
                        color: 'hsl(215 20% 75%)'
                    },
                    title: {
                        display: true,
                        text: 'VOC (ppm)',
                        color: 'hsl(215 20% 75%)'
                    }
                },
                y2: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: 'hsl(215 20% 75%)'
                    },
                    title: {
                        display: true,
                        text: 'AQI',
                        color: 'hsl(215 20% 75%)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'hsl(210 25% 95%)',
                        font: {
                            size: 13,
                            family: "'Inter', sans-serif"
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'hsla(230 55% 6% / 0.95)',
                    titleColor: 'hsl(210 25% 95%)',
                    bodyColor: 'hsl(210 30% 98%)',
                    borderColor: 'hsl(230 35% 20%)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.dataset.label.includes('PM2.5')) {
                                    label += context.parsed.y.toFixed(1) + ' µg/m³';
                                } else if (context.dataset.label.includes('VOC')) {
                                    label += context.parsed.y.toFixed(2) + ' ppm';
                                } else {
                                    label += context.parsed.y.toFixed(0);
                                }
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Initialize PM2.5 gauge
let pm25Gauge;

function initPM25Gauge() {
    const ctx = document.getElementById('pm25Gauge').getContext('2d');
    
    pm25Gauge = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['PM2.5', 'Remaining'],
            datasets: [{
                data: [41.5, 58.5],
                backgroundColor: [
                    getColorForPM25(41.5),
                    'hsla(225 30% 25% / 0.3)'
                ],
                borderWidth: 0,
                circumference: 180,
                rotation: 270,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });
}

// Get color based on PM2.5 value
function getColorForPM25(value) {
    if (value <= 12) return 'hsl(160 65% 55%)'; // Good (Green)
    if (value <= 35) return 'hsl(48 85% 65%)'; // Moderate (Yellow)
    if (value <= 55) return 'hsl(25 90% 60%)'; // Unhealthy for sensitive groups (Orange)
    if (value <= 150) return 'hsl(0 80% 65%)'; // Unhealthy (Red)
    if (value <= 250) return 'hsl(280 75% 65%)'; // Very unhealthy (Purple)
    return 'hsl(350 80% 60%)'; // Hazardous (Maroon)
}

// Initialize temperature sparkline
let tempSparkline;

function initTempSparkline() {
    const ctx = document.getElementById('tempSparkline').getContext('2d');
    
    // Generate sample data for temperature trend (last 10 readings)
    const tempData = [];
    const tempLabels = [];
    
    for (let i = 9; i >= 0; i--) {
        tempLabels.push('');
        tempData.push(28.4 + (Math.random() * 2 - 1)); // Small variations around 28.4
    }
    
    tempSparkline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: tempLabels,
            datasets: [{
                data: tempData,
                borderColor: 'hsl(210 85% 65%)',
                backgroundColor: 'hsla(210 85% 65% / 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: false,
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Set up event listeners
function setupEventListeners() {
    // Time filter buttons
    const timeFilters = document.querySelectorAll('.card-peaceful .flex-wrap button');
    timeFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            // Remove active class from all filters
            timeFilters.forEach(f => f.classList.remove('bg-primary/10', 'text-primary'));
            timeFilters.forEach(f => f.classList.add('bg-muted', 'text-foreground'));
            // Add active class to clicked filter
            this.classList.remove('bg-muted', 'text-foreground');
            this.classList.add('bg-primary/10', 'text-primary');
            // In a real implementation, you would fetch new data here
        });
    });
    
    // Acknowledge alert buttons
    const acknowledgeButtons = document.querySelectorAll('button.text-xs.text-primary');
    acknowledgeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const alertItem = this.closest('.flex.items-start');
            if (alertItem) {
                // Change border color to indicate read status
                alertItem.classList.remove('border-warning', 'border-info');
                alertItem.classList.add('border-success');
                
                // Change background to indicate read status
                alertItem.classList.remove('bg-warning/10', 'bg-info/10');
                alertItem.classList.add('bg-success/10');
                
                // Disable the button
                this.textContent = 'Acknowledged';
                this.classList.remove('hover:text-primary/80');
                this.disabled = true;
            }
        });
    });
}

// Initialize tooltips
function initTooltips() {
    // In a real implementation, this would initialize any tooltip libraries
    // For now, we're using Chart.js built-in tooltips
}

// Smooth update helper function
function smoothUpdateElement(element, newValue) {
    if (!element) return;
    
    element.style.transition = 'opacity 0.3s ease';
    element.style.opacity = '0.5';
    
    setTimeout(() => {
        element.innerHTML = newValue;
        element.style.opacity = '1';
    }, 150);
}

// Update dashboard data (simulated) - smooth updates without page refresh
function updateDashboardData() {
    // Update card values with simulated data
    const pm25Element = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2 .card-peaceful:nth-child(1) .text-4xl');
    const vocElement = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2 .card-peaceful:nth-child(2) .text-4xl');
    const tempElement = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2 .card-peaceful:nth-child(3) .text-4xl');
    const humidityElement = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2 .card-peaceful:nth-child(4) .text-4xl');
    const aqiElement = document.querySelector('.aqi-card .text-5xl');
    
    // Quick stats elements
    const quickStats = document.querySelectorAll('.grid.grid-cols-2.sm\\:grid-cols-3 .card-peaceful');
    const pm25QuickStat = quickStats[2]?.querySelector('.text-2xl');
    const tempQuickStat = quickStats[0]?.querySelector('.text-2xl');
    const humidityQuickStat = quickStats[1]?.querySelector('.text-2xl');
    
    // Get current values
    const currentPM25 = parseFloat(pm25Element?.textContent || 0);
    const currentVOC = parseFloat(vocElement?.textContent || 0);
    const currentTemp = parseFloat(tempElement?.textContent || 0);
    const currentHumidity = parseFloat(humidityElement?.textContent || 0);
    const currentAQI = parseFloat(aqiElement?.textContent || 0);
    
    // Generate small random changes
    const newPM25 = Math.max(0, currentPM25 + (Math.random() * 4 - 2)).toFixed(1);
    const newVOC = Math.max(0, currentVOC + (Math.random() * 20 - 10)).toFixed(0);
    const newTemp = (currentTemp + (Math.random() * 0.4 - 0.2)).toFixed(1);
    const newHumidity = Math.min(100, Math.max(0, currentHumidity + (Math.random() * 2 - 1))).toFixed(1);
    const newAQI = Math.max(0, currentAQI + (Math.random() * 3 - 1.5)).toFixed(0);
    
    // Update values with smooth transitions
    smoothUpdateElement(pm25Element, `${newPM25} <span class="text-xl text-muted-foreground">μg/m³</span>`);
    smoothUpdateElement(vocElement, `${newVOC} <span class="text-xl text-muted-foreground">ppb</span>`);
    smoothUpdateElement(tempElement, `${newTemp} <span class="text-xl text-muted-foreground">°C</span>`);
    smoothUpdateElement(humidityElement, `${newHumidity} <span class="text-xl text-muted-foreground">%</span>`);
    smoothUpdateElement(aqiElement, newAQI);
    
    // Update quick stats
    smoothUpdateElement(pm25QuickStat, `${newPM25}`);
    smoothUpdateElement(tempQuickStat, `${newTemp}°C`);
    smoothUpdateElement(humidityQuickStat, `${newHumidity}%`);
    
    // Update gauge with smooth animation
    if (pm25Gauge) {
        pm25Gauge.data.datasets[0].data = [newPM25, 100 - newPM25];
        pm25Gauge.data.datasets[0].backgroundColor[0] = getColorForPM25(newPM25);
        pm25Gauge.update('none'); // 'none' for instant update, or 'active' for smooth animation
    }
    
    // Update humidity fill with smooth transition
    const humidityFill = document.querySelector('.humidity-fill .absolute');
    if (humidityFill) {
        humidityFill.style.transition = 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        humidityFill.style.height = `${newHumidity}%`;
    }
    
    // Update status indicators based on new values
    updateStatusIndicators(newPM25, newVOC, newAQI, newTemp, newHumidity);
    
    // Update last updated time with smooth transition
    const lastUpdatedElement = document.querySelector('.grid.grid-cols-3 .text-lg.font-semibold');
    if (lastUpdatedElement) {
        smoothUpdateElement(lastUpdatedElement, 'Just now');
    }
    
    // Update trend indicators
    updateTrendIndicators();
    
    // Update main chart with new data point
    updateMainChart(newPM25, newVOC, newAQI);
}

// Update status indicators based on values
function updateStatusIndicators(pm25, voc, aqi, temp, humidity) {
    // PM2.5 status
    const pm25Status = document.querySelectorAll('.grid.grid-cols-1.lg\\:grid-cols-2 .card-peaceful:nth-child(1) .inline-flex');
    const pm25QuickStatStatus = document.querySelectorAll('.grid.grid-cols-2.sm\\:grid-cols-3 .card-peaceful:nth-child(3) .inline-flex');
    
    pm25Status.forEach(el => {
        el.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ' + getStatusClass(pm25, 'pm25');
        el.innerHTML = `<i class="${getStatusIcon(pm25, 'pm25')} mr-1"></i> ${getStatusText(pm25, 'pm25')}`;
    });
    
    pm25QuickStatStatus.forEach(el => {
        el.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ' + getStatusClass(pm25, 'pm25');
        el.innerHTML = `<i class="${getStatusIcon(pm25, 'pm25')} mr-1"></i> ${getStatusText(pm25, 'pm25')}`;
    });
    
    // VOC status
    const vocStatus = document.querySelectorAll('.grid.grid-cols-1.lg\\:grid-cols-2 .card-peaceful:nth-child(2) .inline-flex');
    const vocQuickStatStatus = document.querySelectorAll('.grid.grid-cols-2.sm\\:grid-cols-3 .card-peaceful:nth-child(4) .inline-flex');
    
    vocStatus.forEach(el => {
        el.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ' + getStatusClass(voc, 'voc');
        el.innerHTML = `<i class="${getStatusIcon(voc, 'voc')} mr-1"></i> ${getStatusText(voc, 'voc')}`;
    });
    
    vocQuickStatStatus.forEach(el => {
        el.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ' + getStatusClass(voc, 'voc');
        el.innerHTML = `<i class="${getStatusIcon(voc, 'voc')} mr-1"></i> ${getStatusText(voc, 'voc')}`;
    });
    
    // Temperature status
    const tempStatus = document.querySelectorAll('.grid.grid-cols-1.lg\\:grid-cols-2 .card-peaceful:nth-child(3) .inline-flex');
    const tempQuickStatStatus = document.querySelectorAll('.grid.grid-cols-2.sm\\:grid-cols-3 .card-peaceful:nth-child(1) .inline-flex');
    
    tempStatus.forEach(el => {
        el.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ' + getStatusClass(temp, 'temp');
        el.innerHTML = `<i class="${getStatusIcon(temp, 'temp')} mr-1"></i> ${getStatusText(temp, 'temp')}`;
    });
    
    tempQuickStatStatus.forEach(el => {
        el.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ' + getStatusClass(temp, 'temp');
        el.innerHTML = `<i class="${getStatusIcon(temp, 'temp')} mr-1"></i> ${getStatusText(temp, 'temp')}`;
    });
    
    // Humidity status
    const humidityStatus = document.querySelectorAll('.grid.grid-cols-1.lg\\:grid-cols-2 .card-peaceful:nth-child(4) .inline-flex');
    const humidityQuickStatStatus = document.querySelectorAll('.grid.grid-cols-2.sm\\:grid-cols-3 .card-peaceful:nth-child(2) .inline-flex');
    
    humidityStatus.forEach(el => {
        el.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ' + getStatusClass(humidity, 'humidity');
        el.innerHTML = `<i class="${getStatusIcon(humidity, 'humidity')} mr-1"></i> ${getStatusText(humidity, 'humidity')}`;
    });
    
    humidityQuickStatStatus.forEach(el => {
        el.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ' + getStatusClass(humidity, 'humidity');
        el.innerHTML = `<i class="${getStatusIcon(humidity, 'humidity')} mr-1"></i> ${getStatusText(humidity, 'humidity')}`;
    });
    
    // AQI status
    const aqiCard = document.querySelector('.aqi-card');
    const aqiStatusText = document.querySelector('.aqi-card .text-2xl');
    const aqiDescription = document.querySelector('.aqi-card p');
    
    // Update AQI card class
    aqiCard.className = 'aqi-card mb-4 ' + getAQIClass(aqi);
    aqiStatusText.textContent = getStatusText(aqi, 'aqi');
    aqiDescription.textContent = getStatusDescription(aqi, 'aqi');
    
    // Update AQI progress bar
    const aqiProgress = document.querySelector('.aqi-card .h-full');
    const percentage = Math.min((aqi / 300) * 100, 100);
    aqiProgress.style.width = `${percentage}%`;
    
    // Update AQI Scale progress bar
    const aqiScaleBar = document.getElementById('aqi-progress-bar');
    if (aqiScaleBar) {
        const scalePercentage = Math.min((aqi / 300) * 100, 100);
        aqiScaleBar.style.width = `${scalePercentage}%`;
    }
}

// Update trend indicators
function updateTrendIndicators() {
    // In a real implementation, this would update based on actual trend data
    // For now, we'll just randomize the trend indicators
    const trends = document.querySelectorAll('.flex.items-center.text-sm.text-muted-foreground');
    trends.forEach(trend => {
        const random = Math.random();
        const newHTML = random < 0.33 
            ? '<i class="fas fa-arrow-down text-success mr-1"></i> <span>' + (Math.random() * 2).toFixed(1) + '</span>'
            : random < 0.66 
            ? '<i class="fas fa-arrow-up text-destructive mr-1"></i> <span>' + (Math.random() * 2).toFixed(1) + '</span>'
            : '<i class="fas fa-minus text-muted-foreground mr-1"></i> <span>0.0</span>';
        
        smoothUpdateElement(trend, newHTML);
    });
}

// Update main chart with new data point (smooth update without redraw)
function updateMainChart(newPM25, newVOC, newAQI) {
    if (!airQualityChart) return;
    
    // Get current time
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Add new data point and remove oldest if we have more than 24 points
    airQualityChart.data.labels.push(timeLabel);
    airQualityChart.data.datasets[0].data.push(parseFloat(newPM25));
    airQualityChart.data.datasets[1].data.push(parseFloat(newVOC) / 100); // Scale VOC for display
    airQualityChart.data.datasets[2].data.push(parseFloat(newAQI));
    
    if (airQualityChart.data.labels.length > 24) {
        airQualityChart.data.labels.shift();
        airQualityChart.data.datasets[0].data.shift();
        airQualityChart.data.datasets[1].data.shift();
        airQualityChart.data.datasets[2].data.shift();
    }
    
    // Update chart smoothly without animation
    airQualityChart.update('none');
}

// Get status class based on value and metric
function getStatusClass(value, metric) {
    switch(metric) {
        case 'pm25':
            if (value <= 12) return 'bg-success/20 text-success';
            if (value <= 35) return 'bg-success/20 text-success';
            if (value <= 55) return 'bg-warning/20 text-warning';
            if (value <= 150) return 'bg-destructive/20 text-destructive';
            return 'bg-destructive/20 text-destructive';
        case 'voc':
            if (value <= 0.5) return 'bg-success/20 text-success';
            if (value <= 1.0) return 'bg-warning/20 text-warning';
            return 'bg-destructive/20 text-destructive';
        case 'temp':
            if (value >= 18 && value <= 24) return 'bg-success/20 text-success';
            if (value >= 15 && value <= 27) return 'bg-warning/20 text-warning';
            return 'bg-destructive/20 text-destructive';
        case 'humidity':
            if (value >= 30 && value <= 60) return 'bg-success/20 text-success';
            if (value >= 25 && value <= 65) return 'bg-warning/20 text-warning';
            return 'bg-destructive/20 text-destructive';
        default:
            return 'bg-success/20 text-success';
    }
}

// Get AQI class based on value
function getAQIClass(value) {
    if (value <= 50) return 'aqi-card aqi-good';
    if (value <= 100) return 'aqi-card aqi-moderate';
    if (value <= 150) return 'aqi-card aqi-unhealthy-sensitive';
    if (value <= 200) return 'aqi-card aqi-unhealthy';
    if (value <= 300) return 'aqi-card aqi-very-unhealthy';
    return 'aqi-card aqi-hazardous';
}

// Get status icon based on value and metric
function getStatusIcon(value, metric) {
    switch(metric) {
        case 'pm25':
        case 'voc':
        case 'temp':
        case 'humidity':
            if (getStatusClass(value, metric).includes('success')) return 'fas fa-check-circle';
            if (getStatusClass(value, metric).includes('warning')) return 'fas fa-exclamation-circle';
            return 'fas fa-times-circle';
        case 'aqi':
            if (value <= 50) return 'fas fa-smile';
            if (value <= 100) return 'fas fa-meh';
            return 'fas fa-frown';
        default:
            return 'fas fa-check-circle';
    }
}

// Get status text based on value and metric
function getStatusText(value, metric) {
    switch(metric) {
        case 'pm25':
            if (value <= 12) return 'Good';
            if (value <= 35) return 'Good';
            if (value <= 55) return 'Moderate';
            if (value <= 150) return 'Unhealthy';
            return 'Very Unhealthy';
        case 'voc':
            if (value <= 0.5) return 'Good';
            if (value <= 1.0) return 'Moderate';
            return 'Poor';
        case 'temp':
            if (value >= 18 && value <= 24) return 'Good';
            if (value >= 15 && value <= 27) return 'Moderate';
            return 'Poor';
        case 'humidity':
            if (value >= 30 && value <= 60) return 'Good';
            if (value >= 25 && value <= 65) return 'Moderate';
            return 'Poor';
        case 'aqi':
            if (value <= 50) return 'Good';
            if (value <= 100) return 'Moderate';
            if (value <= 150) return 'Sensitive';
            if (value <= 200) return 'Unhealthy';
            if (value <= 300) return 'Very Unhealthy';
            return 'Hazardous';
        default:
            return 'Good';
    }
}

// Get status description based on value and metric
function getStatusDescription(value, metric) {
    switch(metric) {
        case 'aqi':
            if (value <= 50) return 'Air quality is satisfactory';
            if (value <= 100) return 'Acceptable for most people';
            if (value <= 150) return 'Sensitive groups may experience symptoms';
            if (value <= 200) return 'Everyone may experience health effects';
            if (value <= 300) return 'Health alert for everyone';
            return 'Emergency conditions for all';
        default:
            return 'Condition is ' + getStatusText(value, metric).toLowerCase();
    }
}