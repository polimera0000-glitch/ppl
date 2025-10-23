// src/services/authService.js
class AuthService {
  constructor() {
    this.TOKEN_KEY = 'eph_jwt_token';
    this.USER_KEY = 'eph_user_json';
  }

  saveToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  saveUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser() {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  saveTokenAndUser(token, user) {
    this.saveToken(token);
    if (user) this.saveUser(user);
  }

  isLoggedIn() {
    const token = this.getToken();
    if (!token || token.length === 0) return false;
    
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        // Token is expired, clear it
        this.clearToken();
        return false;
      }
      
      return true;
    } catch (error) {
      // Invalid token format, clear it
      this.clearToken();
      return false;
    }
  }

  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Check if token is valid and not expired
  isTokenValid() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token expires within next 5 minutes (300 seconds)
      if (payload.exp && payload.exp < (currentTime + 300)) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get token expiry time
  getTokenExpiry() {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();