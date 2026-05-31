import { createContext, ReactNode, useContext, useMemo, useState } from "react";

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  authError: string;
  signUp: (payload: AuthPayload) => Promise<void>;
  signIn: (payload: Pick<AuthPayload, "email" | "password">) => Promise<void>;
  signOut: () => void;
}

interface AuthPayload {
  name: string;
  email: string;
  password: string;
}

const USERS_STORAGE_KEY = "medical-analyzer-users";
const SESSION_STORAGE_KEY = "medical-analyzer-session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<StoredUser[]>(() => readUsers());
  const [user, setUser] = useState<AuthUser | null>(() => {
    const sessionUserId = localStorage.getItem(SESSION_STORAGE_KEY);
    const matchedUser = readUsers().find((storedUser) => storedUser.id === sessionUserId);
    return matchedUser ? toAuthUser(matchedUser) : null;
  });
  const [authError, setAuthError] = useState("");

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authError,
      signUp: async ({ name, email, password }) => {
        setAuthError("");
        const normalizedEmail = email.trim().toLowerCase();
        const cleanName = name.trim();

        if (!cleanName || !normalizedEmail || !password) {
          throwAuthError(setAuthError, "Name, email, and password are required.");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          throwAuthError(setAuthError, "Enter a valid email address.");
        }
        if (password.length < 8) {
          throwAuthError(setAuthError, "Password must be at least 8 characters.");
        }
        if (users.some((storedUser) => storedUser.email === normalizedEmail)) {
          throwAuthError(setAuthError, "An account with this email already exists.");
        }

        const createdUser: StoredUser = {
          id: crypto.randomUUID(),
          name: cleanName,
          email: normalizedEmail,
          passwordHash: await hashPassword(password),
          createdAt: new Date().toISOString(),
        };
        const nextUsers = [...users, createdUser];
        writeUsers(nextUsers);
        setUsers(nextUsers);
        setUser(toAuthUser(createdUser));
        localStorage.setItem(SESSION_STORAGE_KEY, createdUser.id);
      },
      signIn: async ({ email, password }) => {
        setAuthError("");
        const normalizedEmail = email.trim().toLowerCase();
        const matchedUser = users.find((storedUser) => storedUser.email === normalizedEmail);
        if (!matchedUser || matchedUser.passwordHash !== (await hashPassword(password))) {
          throwAuthError(setAuthError, "Email or password is incorrect.");
        }
        setUser(toAuthUser(matchedUser));
        localStorage.setItem(SESSION_STORAGE_KEY, matchedUser.id);
      },
      signOut: () => {
        setUser(null);
        setAuthError("");
        localStorage.removeItem(SESSION_STORAGE_KEY);
      },
    }),
    [authError, user, users],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}

function readUsers(): StoredUser[] {
  try {
    const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
    return rawUsers ? (JSON.parse(rawUsers) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

async function hashPassword(password: string): Promise<string> {
  const encodedPassword = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", encodedPassword);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function throwAuthError(setAuthError: (message: string) => void, message: string): never {
  setAuthError(message);
  throw new Error(message);
}
