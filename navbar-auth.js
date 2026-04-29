// ============================================
// NAVBAR WITH LOGOUT FUNCTIONALITY
// ============================================
// Add this script after auth.js is loaded

document.addEventListener('DOMContentLoaded', async function() {
    // Get current user and display info
    const userResult = await authService.getCurrentUser();
    
    if (userResult.success && userResult.user) {
        const user = userResult.user;
        
        // Update user display in navbar if element exists
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
            userEmailElement.textContent = user.email;
        }
        
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
            userNameElement.textContent = fullName;
        }
    }
    
    // Add logout functionality
    const logoutButtons = document.querySelectorAll('.logout-btn, #logout-btn, [data-logout]');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to logout?')) {
                const result = await authService.signOut();
                
                if (result.success) {
                    // Redirect to login page
                    window.location.href = 'login.html';
                } else {
                    alert('Logout failed: ' + result.error);
                }
            }
        });
    });
});

// Add logout button styles dynamically
const style = document.createElement('style');
style.textContent = `
    .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        color: white;
    }
    
    .user-profile {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .user-avatar {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
    }
    
    .logout-btn {
        padding: 0.5rem 1.2rem;
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .logout-btn:hover {
        background: rgba(239, 68, 68, 0.3);
        border-color: rgba(239, 68, 68, 0.5);
        transform: translateY(-2px);
    }
    
    .logout-btn i {
        font-size: 16px;
    }
    
    @media (max-width: 768px) {
        .user-info {
            flex-direction: column;
            gap: 0.5rem;
        }
    }
`;
document.head.appendChild(style);
