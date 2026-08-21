import { apiClient, setAuthToken } from "@/app/services/apiClient";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  student_id: string;
  department: string;
  password: string;
}

interface AuthResult {
  token: string;
  userId: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<string> {
    const result = await apiClient<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setAuthToken(result.token);
    return result.userId;
  }

  async register(payload: RegisterPayload): Promise<string> {
    const result = await apiClient<AuthResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setAuthToken(result.token);
    return result.userId;
  }

  async logout(): Promise<void> {
    try {
      await apiClient<void>("/auth/logout", { method: "POST" });
    } finally {
      setAuthToken(null);
    }
  }
}

export const authService = new AuthService();
