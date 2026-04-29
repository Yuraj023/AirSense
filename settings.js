// Settings JavaScript
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for user to be authenticated
    await waitForAuth();
    
    // Initialize settings with database values or defaults
    await initializeSettings();
    
    // Set up event listeners for settings page
    setupSettingsEventListeners();
});

// Wait for authentication
async function waitForAuth() {
    return new Promise((resolve) => {
        const checkAuth = () => {
            if (window.currentUserId) {
                resolve();
            } else {
                setTimeout(checkAuth, 100);
            }
        };
        checkAuth();
    });
}

// Default settings
const defaultSettings = {
    theme: 'dark',
    notifications_enabled: true,
    email_alerts_enabled: true,
    data_refresh_interval: 20
};

// Current settings state
let currentSettings = {...defaultSettings};

// Initialize settings with database values or defaults
async function initializeSettings() {
    try {
        if (!window.currentUserId) {
            console.error('❌ No user ID available');
            return;
        }

        // Load settings from Supabase
        const result = await userPreferencesService.getUserPreferences(window.currentUserId);
        
        if (result.success && result.data) {
            // Use database settings
            currentSettings = {
                theme: result.data.theme || 'dark',
                notifications_enabled: result.data.notifications_enabled !== undefined ? result.data.notifications_enabled : true,
                email_alerts_enabled: result.data.email_alerts_enabled !== undefined ? result.data.email_alerts_enabled : true,
                data_refresh_interval: result.data.data_refresh_interval || 20
            };
            console.log('✅ Settings loaded from database:', currentSettings);
        } else {
            // Use default settings
            currentSettings = {...defaultSettings};
            console.log('📝 Using default settings:', currentSettings);
        }
        
        // Apply settings to UI
        applySettingsToUI();
        
    } catch (e) {
        console.error('❌ Error loading settings:', e);
        currentSettings = {...defaultSettings};
        applySettingsToUI();
    }
}

// Apply current settings to UI elements
function applySettingsToUI() {
    // Theme - will add dark/light mode toggle
    // For now, just set the value
    
    // Notifications
    const notificationsToggle = document.getElementById('notifications');
    if (notificationsToggle) {
        notificationsToggle.checked = currentSettings.notifications_enabled;
    }
    
    // Email alerts (Sound alerts in UI)
    const soundToggle = document.getElementById('sound');
    if (soundToggle) {
        soundToggle.checked = currentSettings.email_alerts_enabled;
    }
    
    // Data refresh interval
    const refreshSlider = document.getElementById('refresh-interval');
    const refreshValue = document.getElementById('refreshValue');
    if (refreshSlider) {
        refreshSlider.value = currentSettings.data_refresh_interval;
        if (refreshValue) {
            refreshValue.textContent = currentSettings.data_refresh_interval + (currentSettings.data_refresh_interval === 1 ? ' second' : ' seconds');
        }
    }
}

// Save settings to Supabase database
async function saveSettings() {
    try {
        if (!window.currentUserId) {
            showToast("Error", "Please log in to save settings.", "error");
            return;
        }

        // Show loading state
        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        }

        // Save to Supabase
        const result = await userPreferencesService.saveUserPreferences(
            window.currentUserId,
            currentSettings
        );

        if (result.success) {
            console.log('✅ Settings saved to database:', currentSettings);
            showToast("Settings Saved", "Your preferences have been updated successfully.", "success");
            
            // Apply settings immediately
            applySettingsInRealTime();
        } else {
            console.error('❌ Failed to save settings:', result.error);
            showToast("Error", "Failed to save settings. Please try again.", "error");
        }

        // Reset button state
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = 'Save Settings';
        }
    } catch (e) {
        console.error('❌ Error saving settings:', e);
        showToast("Error", "Failed to save settings. Please try again.", "error");
        
        // Reset button state
        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = 'Save Settings';
        }
    }
}

// Apply settings in real-time without page refresh
function applySettingsInRealTime() {
    // Update data refresh interval if on dashboard or live page
    if (currentSettings.data_refresh_interval) {
        // Update the config for adafruit-io.js
        if (window.UPDATE_INTERVAL) {
            window.UPDATE_INTERVAL = currentSettings.data_refresh_interval * 1000;
            console.log(`✅ Data refresh interval updated to ${currentSettings.data_refresh_interval} seconds`);
        }
    }
    
    // Enable/disable notifications
    if ('Notification' in window && currentSettings.notifications_enabled) {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    
    // Email alerts are controlled by email-service.js
    console.log(`✅ Email alerts ${currentSettings.email_alerts_enabled ? 'enabled' : 'disabled'}`);
    
    console.log('✅ Settings applied in real-time');
}

// Show toast notification
function showToast(title, message, type = "success") {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast show';
    
    const icon = type === 'success' ? '✅' : '❌';
    const bgColor = type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    const borderColor = type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
    
    toast.style.background = bgColor;
    toast.style.borderLeft = `4px solid ${borderColor}`;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: start; gap: 12px;">
            <div style="font-size: 24px;">${icon}</div>
            <div>
                <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 14px; opacity: 0.9;">${message}</div>
            </div>
        </div>
    `;
    
    // Add to container
    const container = document.getElementById('toast-container') || document.body;
    container.appendChild(toast);
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Set up event listeners for settings page
function setupSettingsEventListeners() {
    // Notifications toggle
    const notificationsToggle = document.getElementById('notifications');
    if (notificationsToggle) {
        notificationsToggle.addEventListener('change', function() {
            currentSettings.notifications_enabled = this.checked;
        });
    }
    
    // Email alerts toggle (mapped to "sound" in UI)
    const soundToggle = document.getElementById('sound');
    if (soundToggle) {
        soundToggle.addEventListener('change', function() {
            currentSettings.email_alerts_enabled = this.checked;
        });
    }
    
    // Data refresh interval slider
    const refreshSlider = document.getElementById('refresh-interval');
    const refreshValue = document.getElementById('refreshValue');
    if (refreshSlider && refreshValue) {
        // Set min to 10 seconds, max to 60 seconds
        refreshSlider.min = 10;
        refreshSlider.max = 60;
        refreshSlider.step = 5;
        
        refreshSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            currentSettings.data_refresh_interval = value;
            refreshValue.textContent = value + (value === 1 ? ' second' : ' seconds');
        });
    }
    
    // Save settings button
    const saveButton = document.getElementById('save-settings');
    if (saveButton) {
        saveButton.addEventListener('click', async function() {
            await saveSettings();
        });
    }
}