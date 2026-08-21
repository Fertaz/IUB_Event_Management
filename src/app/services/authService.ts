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

const DEMO_CREDENTIALS: Record<
  string,
  { password: string; userId: string }
> = {
  "admin@iub.edu.bd": {
    password: "Admin@12345",
    userId: "user_3",
  },
  "shoikat.azad@iub.edu.bd": {
    password: "Club@12345",
    userId: "user_2",
  },
  "anika.rahman@iub.edu.bd": {
    password: "Student@12345",
    userId: "user_1",
  },
};

function resolveDemoUserId(
  credentials: LoginCredentials,
): string | null {
  const email = credentials.email.trim().toLowerCase();
  const demo = DEMO_CREDENTIALS[email];
  if (!demo || demo.password !== credentials.password) {
    return null;
  }
  return demo.userId;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<string> {
    try {
      const result = await apiClient<AuthResult>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      setAuthToken(result.token);
      return result.userId;
    } catch (error) {
      const demoUserId = resolveDemoUserId(credentials);
      if (!demoUserId) {
        throw error;
      }
      setAuthToken(null);
      return demoUserId;
    }
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
