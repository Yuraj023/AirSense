// Supabase Configuration - Load from environment variables
if (!window.ENV_CONFIG) {
    console.error('❌ Environment configuration not loaded! Make sure env-config.js is loaded before this script.');
}
const SUPABASE_URL = window.ENV_CONFIG?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.ENV_CONFIG?.SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if user is already logged in
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error checking auth:', error);
            return null;
        }
        
        return session;
    } catch (error) {
        console.error('Error in checkAuth:', error);
        return null;
    }
}

// Sign In with Email and Password
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        console.log('Sign in successful:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign Up with Email and Password
async function signUp(email, password, fullname) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullname
                },
                emailRedirectTo: undefined  // Disable email confirmation redirect
            }
        });

        if (error) {
            throw error;
        }

        console.log('Sign up successful:', data);
        
        // Check if email confirmation is required
        if (data?.user && !data.user.confirmed_at) {
            return { 
                success: true, 
                data,
                requiresConfirmation: true,
                message: 'Please check your email to confirm your account before logging in.'
            };
        }
        
        return { success: true, data, requiresConfirmation: false };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, error: error.message };
    }
}

// Sign Out
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error;
        }

        console.log('Sign out successful');
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
}

// Get Current User
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            throw error;
        }

        return { success: true, user };
    } catch (error) {
        console.error('Error getting user:', error);
        return { success: false, error: error.message };
    }
}

// Reset Password - Send Reset Email
async function resetPassword(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });

        if (error) {
            throw error;
        }

        console.log('Password reset email sent');
        return { success: true };
    } catch (error) {
        console.error('Password reset error:', error);
        return { success: false, error: error.message };
    }
}

// Send OTP to email
async function sendOTP(email) {
    try {
        const { data, error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                shouldCreateUser: false, // Only allow existing users
            }
        });

        if (error) {
            throw error;
        }

        console.log('OTP sent successfully');
        return { success: true, data };
    } catch (error) {
        console.error('Send OTP error:', error);
        return { success: false, error: error.message };
    }
}

// Verify OTP
async function verifyOTP(email, token) {
    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email: email,
            token: token,
            type: 'email'
        });

        if (error) {
            throw error;
        }

        console.log('OTP verified successfully');
        return { success: true, data };
    } catch (error) {
        console.error('Verify OTP error:', error);
        return { success: false, error: error.message };
    }
}

// Update Password
async function updatePassword(newPassword) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            throw error;
        }

        console.log('Password updated successfully');
        return { success: true, data };
    } catch (error) {
        console.error('Password update error:', error);
        return { success: false, error: error.message };
    }
}

// Listen to Auth State Changes
function onAuthStateChange(callback) {
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        callback(event, session);
    });
}

// Check if user is authenticated and redirect if needed
async function requireAuth() {
    const session = await checkAuth();
    
    if (!session) {
        // Not authenticated, redirect to login
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Redirect to dashboard if already authenticated
async function redirectIfAuthenticated() {
    const session = await checkAuth();
    
    if (session) {
        // Already authenticated, redirect to dashboard
        window.location.href = 'index.html';
        return true;
    }
    
    return false;
}

// Export functions for use in other files
window.authService = {
    checkAuth,
    signIn,
    signUp,
    signOut,
    getCurrentUser,
    resetPassword,
    updatePassword,
    onAuthStateChange,
    requireAuth,
    redirectIfAuthenticated,
    sendOTP,
    verifyOTP
};
