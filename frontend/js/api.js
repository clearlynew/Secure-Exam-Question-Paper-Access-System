'use strict';

/**
 * Secure Exam Question Paper System — API Client
 * Talks to the Express backend in ../backend (same origin, /api/*)
 */

const API = {
    baseUrl: '/api',

    getToken() {
        return localStorage.getItem('exam_auth_token');
    },

    setToken(token) {
        if (token) {
            localStorage.setItem('exam_auth_token', token);
        } else {
            localStorage.removeItem('exam_auth_token');
        }
    },

    getUser() {
        try {
            const raw = localStorage.getItem('exam_auth_user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    setUser(user) {
        if (user) {
            localStorage.setItem('exam_auth_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('exam_auth_user');
        }
    },

    clearAuth() {
        localStorage.removeItem('exam_auth_token');
        localStorage.removeItem('exam_auth_user');
    },

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = options.headers || {};

        const token = this.getToken();
        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (!(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle blob downloads (e.g. PDF decryption)
            if (options.isBlob) {
                if (!response.ok) {
                    const errJson = await response.json();
                    throw new Error(errJson.message || 'Download failed');
                }
                const blob = await response.blob();
                return { ok: true, blob };
            }

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 && !endpoint.includes('/auth/login')) {
                    // Token expired or invalid
                    this.clearAuth();
                    window.dispatchEvent(new CustomEvent('auth:expired'));
                }
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (err) {
            console.error(`[API Error] ${endpoint}:`, err.message);
            throw err;
        }
    },

    // Auth Endpoints  (backend: /api/auth/*)
    auth: {
        login(email, password) {
            return API.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
        },
        signup(payload) {
            return API.request('/auth/signup', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        },
        me() {
            return API.request('/auth/me');
        },
        // approvers + invigilators, used to pick who receives key shares
        approvers() {
            return API.request('/auth/approvers');
        }
    },

    // Paper Endpoints  (backend: /api/papers/*)
    papers: {
        list() {
            return API.request('/papers');
        },
        status(id) {
            return API.request(`/papers/${id}/status`);
        },
        upload(formData) {
            return API.request('/papers', {
                method: 'POST',
                body: formData
            });
        },
        approve(id) {
            return API.request(`/papers/${id}/approve`, {
                method: 'POST'
            });
        },
        // Invigilator only: gated decrypt (approvals + time-lock). Returns the file.
        unlock(id) {
            return API.request(`/papers/${id}/unlock`, {
                method: 'POST',
                isBlob: true
            });
        }
    },

    // Audit Endpoints  (backend: /api/audit)
    audit: {
        history(paperId) {
            return API.request(`/audit${paperId ? `?paperId=${encodeURIComponent(paperId)}` : ''}`);
        },
        verify() {
            return API.request('/audit/verify');
        }
    }
};

window.API = API;
