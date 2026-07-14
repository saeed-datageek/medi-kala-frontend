import { useEffect, useState } from "react";
import { adminLogin, refreshTokenApi, setTokens, clearTokens } from "./api";

export function adminAuth() {
    const [mobile, setMobile] = useState(null);
    const [step, setStep] = useState("mobile");
    const [password, setPassword] = useState(null);
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("refreshToken"));
    const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken"));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!refreshToken || accessToken) return;

        setLoading(true);
        refreshTokenApi(refreshToken)
            .then((data) => {
                if (data.access) {
                    setAccessToken(data.access);
                    setTokens(data.access, refreshToken);
                    setStep("authenticated");
                }
            })
            .catch((err) => {
                console.error(err);
                clearTokens();
                setRefreshToken(null);
                setAccessToken(null);
                setStep("mobile");
            })
            .finally(() => setLoading(false));
    }, [refreshToken, accessToken]);

    const handleAdminLogin = async (formData) => {
        const mobileNumber = typeof formData === "string" ? formData : formData?.mobile ?? "";
        const passwordValue = typeof formData === "string" ? formData : formData?.password ?? "";

        if (!mobileNumber || !passwordValue) {
            setError("Please enter your mobile number and password.");
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await adminLogin(mobileNumber, passwordValue);
            const access = data?.access ?? data?.accessToken;
            const refresh = data?.refresh ?? data?.refreshToken;

            if (!access || !refresh) {
                throw new Error("Login response did not include authentication tokens.");
            }

            setTokens(access, refresh);
            setAccessToken(access);
            setRefreshToken(refresh);
            setMobile(mobileNumber);
            setPassword(passwordValue);
            setStep("authenticated");
            window.dispatchEvent(new Event("auth:changed"));
            return data;
        } catch (err) {
            console.error(err);
            setError("Failed to login. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const logOut = () => {
        setAccessToken(null);
        setRefreshToken(null);
        setMobile(null);
        clearTokens();
        setStep("mobile");
        setError(null);
        window.dispatchEvent(new Event("auth:changed"));
    };

    return { step, handleAdminLogin, accessToken, loading, error, logout: logOut };
}

export default adminAuth;

