// AuthContext.jsx
import { createContext, useContext } from "react";
import { adminAuth } from "./AdminAuth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = adminAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);