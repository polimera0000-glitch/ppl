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
    return token && token.length > 0;
  }

  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

export const authService = new AuthService();