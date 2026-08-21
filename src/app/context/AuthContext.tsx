import { createContext, useContext } from "react";
import type { User } from "../lib/store";

// ─── Auth Context ─────────────────────────────────────────────────────────────

export interface AuthContextValue {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    student_id: string;
    department: string;
    password: string;
  }) => Promise<void>;
  switchRole: (userId: string) => void;
  logout: () => void;
  isStudent: boolean;
  isClubAdmin: boolean;
  isSuperAdmin: boolean;
}

export const AuthContext = createContext<AuthContextValue>(
  {} as AuthContextValue,
);
export const useAuth = () => useContext(AuthContext);
