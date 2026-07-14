import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../AuthForm";
import { useAuth } from "../UseAuth";

function Login() {
    const auth = useAuth();

    const navigate = useNavigate();

    useEffect(() => {
        if (auth.step === 'authenticated') {
            navigate("/admin");
        }
    }, [auth.step, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <AuthForm {...auth} />
        </div>
    )
}

export default Login