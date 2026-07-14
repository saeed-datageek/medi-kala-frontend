import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminForm from "../AdminForm";
import { adminAuth } from "../AdminAuth";

function adminLogin(){
    const auth = adminAuth();
    const navigate = useNavigate();
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

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/admin");
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <AdminForm {...auth} step={isAuthenticated ? "authenticated" : auth.step} />
        </div>
    );
}

export default adminLogin