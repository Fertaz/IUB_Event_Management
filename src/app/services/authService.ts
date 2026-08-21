import { apiClient } from './apiClient';

export interface LoginCredentials {
  email: string;
  password?: string; // Optional for now during transition
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // In a real app, you would make a POST request to your backend:
    // return apiClient<AuthResponse>('/auth/login', {
    //   method: 'POST',
    //   body: JSON.stringify(credentials)
    // });
    
    // SIMULATED AUTH
    await apiClient('/auth/login');
    
    if (credentials.email === 'error@example.com') {
      throw new Error('Invalid credentials');
    }

    const mockResponse: AuthResponse = {
      token: 'mock-jwt-token-12345',
      user: {
        id: 'user_1', // Temporarily hardcoded for simulation
        email: credentials.email,
        role: 'student'
      }
    };

    this.setSession(mockResponse);
    return mockResponse;
  }

  async logout(): Promise<void> {
    // await apiClient('/auth/logout', { method: 'POST' });
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser() {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private setSession(response: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
  }
}

export const authService = new AuthService();
