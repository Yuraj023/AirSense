// User Preferences Service - Handles user settings storage in Supabase
const userPreferencesService = {
    /**
     * Get user preferences from Supabase
     */
    async getUserPreferences(userId) {
        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                // If no preferences exist yet, return null
                if (error.code === 'PGRST116') {
                    console.log('No preferences found for user, will create new');
                    return { success: true, data: null };
                }
                throw error;
            }

            console.log('✅ User preferences loaded:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error fetching user preferences:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Create new user preferences
     */
    async createUserPreferences(userId, preferences) {
        try {
            const defaultPreferences = {
                user_id: userId,
                theme: preferences.theme || 'dark',
                notifications_enabled: preferences.notifications_enabled !== undefined ? preferences.notifications_enabled : true,
                email_alerts_enabled: preferences.email_alerts_enabled !== undefined ? preferences.email_alerts_enabled : true,
                data_refresh_interval: preferences.data_refresh_interval || 20,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('user_preferences')
                .insert([defaultPreferences])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ User preferences created:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error creating user preferences:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update user preferences
     */
    async updateUserPreferences(userId, preferences) {
        try {
            const updateData = {
                ...preferences,
                updated_at: new Date().toISOString()
            };

            // Remove user_id and created_at from update
            delete updateData.user_id;
            delete updateData.created_at;

            const { data, error } = await supabase
                .from('user_preferences')
                .update(updateData)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;

            console.log('✅ User preferences updated:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error updating user preferences:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Save user preferences (create or update)
     */
    async saveUserPreferences(userId, preferences) {
        try {
            // First, try to get existing preferences
            const existing = await this.getUserPreferences(userId);

            if (existing.success && existing.data) {
                // Update existing preferences
                return await this.updateUserPreferences(userId, preferences);
            } else {
                // Create new preferences
                return await this.createUserPreferences(userId, preferences);
            }
        } catch (error) {
            console.error('❌ Error saving user preferences:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get preference value by key
     */
    async getPreference(userId, key) {
        try {
            const result = await this.getUserPreferences(userId);
            if (result.success && result.data) {
                return { success: true, value: result.data[key] };
            }
            return { success: false, error: 'No preferences found' };
        } catch (error) {
            console.error('❌ Error getting preference:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update single preference
     */
    async updatePreference(userId, key, value) {
        try {
            const update = {};
            update[key] = value;
            return await this.updateUserPreferences(userId, update);
        } catch (error) {
            console.error('❌ Error updating preference:', error);
            return { success: false, error: error.message };
        }
    }
};

// Export for use in other scripts
window.userPreferencesService = userPreferencesService;
