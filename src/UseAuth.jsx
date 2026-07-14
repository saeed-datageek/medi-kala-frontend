import { useState, useEffect } from 'react';
import { sendCodeApi, verifyCodeApi, refreshTokenApi, setTokens, clearTokens } from './api';

export function useAuth() {
    const [mobile, setMobile] = useState(null);
    const [step, setStep] = useState('mobile');
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken'));
    const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'));
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
                    setStep('authenticated');
                }
            })
            .catch((err) => {
                console.error(err);
                clearTokens();
                setRefreshToken(null);
                setAccessToken(null);
                setStep('mobile');
            })
            .finally(() => setLoading(false));
    }, [refreshToken, accessToken]);

    useEffect(() => {
        if (accessToken) {
            setStep('authenticated');
        }
    }, [accessToken]);

    const handleSendCode = async (formData) => {
        const mobileNumber = typeof formData === 'string' ? formData : formData.mobile;

        setLoading(true);
        setError(null);

        try {
            const data = await sendCodeApi(mobileNumber);
            setMobile(mobileNumber);
            setStep('otp');
            return data;
        } catch (err) {
            console.error(err);
            setError('Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (formData) => {
        const otp = typeof formData === 'string' ? formData : formData.otp;

        setLoading(true);
        setError(null);

        try {
            const data = await verifyCodeApi(mobile, otp);
            setAccessToken(data.access);
            setRefreshToken(data.refresh);
            setTokens(data.access, data.refresh);
            setStep('authenticated');
            return data;
        } catch (err) {
            console.error(err);
            setError('Invalid or expired OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setAccessToken(null);
        setRefreshToken(null);
        setMobile(null);
        clearTokens();
        setStep('mobile');
        setError(null);
    };

    return { step, handleSendCode, handleVerifyOTP, accessToken, loading, logout, error };
}
