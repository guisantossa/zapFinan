// Utility functions for debugging authentication issues

export const authDebug = {
  // Check current tokens in localStorage
  checkTokens() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    console.group('[Auth Debug] Current Tokens');
    console.log('Access Token:', accessToken ? 'Present' : 'Missing');
    console.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');

    if (accessToken) {
      try {
        // Basic JWT payload check (without verification)
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        console.log('Token Payload:', payload);
        console.log('Token Expires:', new Date(payload.exp * 1000));
        console.log('Is Expired:', payload.exp * 1000 < Date.now());
      } catch (error) {
        console.log('Invalid token format');
      }
    }
    console.groupEnd();

    return { accessToken, refreshToken };
  },

  // Clear all tokens
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    console.log('[Auth Debug] Tokens cleared');
  },

  // Check authentication flow
  async testAuthFlow() {
    console.group('[Auth Debug] Testing Auth Flow');

    // Check tokens
    this.checkTokens();

    // Test /user/me endpoint
    try {
      const response = await fetch('/api/user/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      console.log('GET /user/me status:', response.status);

      if (response.ok) {
        const user = await response.json();
        console.log('User data:', user);
      } else {
        console.log('Error response:', await response.text());
      }
    } catch (error) {
      console.log('Network error:', error);
    }

    console.groupEnd();
  },

  // Enable debug logs
  enableLogs() {
    localStorage.setItem('debug-auth', 'true');
    console.log('[Auth Debug] Debug logs enabled');
  },

  // Disable debug logs
  disableLogs() {
    localStorage.removeItem('debug-auth');
    console.log('[Auth Debug] Debug logs disabled');
  }
};

// Expose to window for easy debugging
if (typeof window !== 'undefined') {
  (window as any).authDebug = authDebug;
}