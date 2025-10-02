// src/services/apiService.js
import { authService } from './authService';

class ApiService {
  constructor() {
    this.baseHost =
      window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : window.location.origin;

    this.baseUrl =
      import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api/v1`;
  }

  buildUrl = (url) => {
    if (!url) return this.baseUrl;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) return `${this.baseUrl}${url}`;
    return `${this.baseUrl}/${url}`;
  };

  async makeRequest(url, options = {}) {
    const token = authService.getToken?.();

    // Detect FormData bodies so we DON'T set JSON headers or stringify
    const isFormData =
      typeof FormData !== 'undefined' && options?.body instanceof FormData;

    const defaultHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    };

    const finalOptions = {
      method: options.method || 'GET',
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    // Auto-JSONify plain objects when not FormData/Blob/ArrayBuffer
    if (
      !isFormData &&
      finalOptions.body &&
      typeof finalOptions.body === 'object' &&
      !(finalOptions.body instanceof Blob) &&
      !(finalOptions.body instanceof ArrayBuffer)
    ) {
      finalOptions.body = JSON.stringify(finalOptions.body);
    }

    const finalUrl = this.buildUrl(url);
    const resp = await fetch(finalUrl, finalOptions);

    // Parse response safely
    const text = await resp.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!resp.ok) {
      const message =
        (data && (data.message || data.error)) ||
        `HTTP ${resp.status} ${resp.statusText}`;
      const err = new Error(message);
      err.status = resp.status;
      err.data = data;
      throw err;
    }

    return data ?? {};
  }

  // ===== Auth =====
  async register(userData) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  async login({ email, password, role }) {
    const body = { email, password };
    if (role) body.role = role;
    return this.makeRequest('/auth/login', { method: 'POST', body });
  }

  async forgotPassword(email) {
    return this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }

  async resetPassword(token, newPassword) {
    return this.makeRequest('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
    });
  }

  async changePassword({ currentPassword, newPassword }) {
    const body = { newPassword };
    if (currentPassword) body.currentPassword = currentPassword;

    const res = await this.makeRequest('/auth/change-password', {
      method: 'POST',
      body,
    });

    try {
      const profile = await this.getProfile();
      const updated = profile?.data?.user ?? profile?.user ?? profile?.data;
      if (updated && authService.setUser) authService.setUser(updated);
    } catch (_) {}

    return res;
  }

  async getProfile() {
    return this.makeRequest('/auth/profile');
  }

  async updateProfile(payload) {
  const res = await this.makeRequest('/auth/profile', {
    method: 'PUT',
    body: payload,
  });
  const updated = res?.data?.user ?? res?.user ?? res?.data;
  if (updated && authService.setUser) authService.setUser(updated);
  return res;
}

  async logout() {
    try {
      await this.makeRequest('/auth/logout', { method: 'POST' });
    } finally {
      authService.clear?.();
    }
  }

  // ===== OAuth =====
  async getGoogleAuthUrl(redirectUri, state) {
  const params = new URLSearchParams();
  if (redirectUri) params.append('redirect_uri', redirectUri);
  if (state) params.append('state', state);
  
  // Return the direct URL instead of making a request
  return {
    data: {
      authUrl: this.buildUrl(`/auth/google?${params.toString()}`)
    }
  };
}

async getGitHubAuthUrl(redirectUri, state) {
  const params = new URLSearchParams();
  if (redirectUri) params.append('redirect_uri', redirectUri);
  if (state) params.append('state', state);
  
  // Return the direct URL instead of making a request
  return {
    data: {
      authUrl: this.buildUrl(`/auth/github?${params.toString()}`)
    }
  };
}

  async exchangeOAuthCode({ code, provider, redirectUri }) {
    const body = { code, provider };
    if (redirectUri) body.redirect_uri = redirectUri;
    return this.makeRequest('/auth/oauth/exchange', {
      method: 'POST',
      body,
    });
  }

  // ===== Admin =====
  async inviteAdmin({ name, email }) {
    return this.makeRequest('/admin/invite', {
      method: 'POST',
      body: { name, email },
    });
  }

  async getAdminList() {
    return this.makeRequest('/admin/list');
  }

  async deactivateAdmin(adminId) {
    return this.makeRequest(`/admin/${adminId}/deactivate`, { method: 'DELETE' });
  }

  // ===== Competitions =====
  async listCompetitions() {
    return this.makeRequest('/competitions');
  }

  async getCompetition(id) {
    return this.makeRequest(`/competitions/${id}`);
  }

  async registerForCompetition(id, payload = {}) {
    return this.makeRequest(`/competitions/${id}/register`, {
      method: 'POST',
      body: payload,
    });
  }

  async submitCompetitionEntry(id, payload) {
    return this.makeRequest(`/competitions/${id}/submit`, {
      method: 'POST',
      body: payload,
    });
  }

  async createCompetition(payload) {
    return this.makeRequest('/competitions', {
      method: 'POST',
      body: payload,
    });
  }

  async updateCompetition(id, payload) {
    return this.makeRequest(`/competitions/${id}`, {
      method: 'PUT',
      body: payload,
    });
  }

  async deleteCompetition(id) {
    return this.makeRequest(`/competitions/${id}`, { method: 'DELETE' });
  }

  // ===== Videos / Feed =====
  async getFeed({ page = 1, limit = 12, search, tags, uploader } = {}) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (tags) params.set('tags', tags);
    if (uploader) params.set('uploader', uploader);
    return this.makeRequest(`/videos/feed?${params.toString()}`);
  }

  async getVideoById(id) {
    return this.makeRequest(`/videos/${id}`);
  }

  async toggleVideoLike(id, liked) {
    const body = {};
    if (typeof liked === 'boolean') body.liked = liked;
    return this.makeRequest(`/videos/${id}/like`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Uploads a project/video using multipart FormData.
   * Expects the caller to pass a FormData with fields:
   *  - video (File), title, [summary], [repo_url], [drive_url], [competition_id], [zip], [attachments...]
   */
  async uploadVideo(formData) {
    return this.makeRequest('/videos', {
      method: 'POST',
      body: formData,
      headers: {}, // let browser set multipart boundary
    });
  }

  // ===== Perks =====
  async getPerks({ page = 1, limit = 50, search } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set('search', search);
    return this.makeRequest(`/perks?${params.toString()}`);
  }

  async redeemPerk(perkId) {
    return this.makeRequest(`/perks/${perkId}/redeem`, { method: 'POST' });
  }

  // ===== Users by role =====
  async getUsersByRole(role) {
    return this.makeRequest(`/users?role=${encodeURIComponent(role)}`);
  }

  // ===== Submissions (JSON APIs)
  async createSubmission(competitionId, payload) {
    return this.makeRequest(`/submissions/${competitionId}`, {
      method: 'POST',
      body: payload,
    });
  }

  async listMySubmissions() {
    return this.makeRequest('/submissions/my');
  }

  async listSubmissionsByCompetition(competitionId) {
    return this.makeRequest(`/submissions/competition/${encodeURIComponent(competitionId)}`);
  }

  async updateSubmission(submissionId, payload) {
    return this.makeRequest(`/submissions/${submissionId}`, {
      method: 'PUT',
      body: payload,
    });
  }

  async getCompetitionLeaderboard(competitionId) {
  return this.makeRequest(`/competitions/${competitionId}/leaderboard`);
}

async getCompetitionRegistrationStats(competitionId) {
  return this.makeRequest(`/competitions/${competitionId}/registration-stats`);
}
}

export const apiService = new ApiService();
