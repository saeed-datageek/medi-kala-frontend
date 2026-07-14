import { useEffect, useState } from "react";
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";

import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";

function PrivateRoute({children}) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem("accessToken")));

  useEffect(() => {
    const syncAuth = () => setIsAuthenticated(Boolean(localStorage.getItem("accessToken")));
    syncAuth();
    window.addEventListener("auth:changed", syncAuth);
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener("auth:changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  return isAuthenticated ? children : <Navigate to="/" replace />;
}


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="/admin" element={ <PrivateRoute><AdminDashboard /></PrivateRoute> } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;