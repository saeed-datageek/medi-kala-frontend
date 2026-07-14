import {useForm} from "react-hook-form";

import {yupResolver} from "@hookform/resolvers/yup";
import * as yup from "yup";
import OTPInput from "react-otp-input";


const styles ={
    card: "bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4",
    input: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline",
    button: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline",
    error: "text-red-500 text-xs italic",
    link: "text-blue-500 hover:text-blue-800",
    label: "block text-gray-700 text-sm font-bold mb-2",
    otpInput: "flex justify-center",
    otpInputContainer: "flex justify-center items-center",
    otpInputInput: "w-10 h-10 border border-gray-300 rounded text-center",
    otpInputInputActive: "bg-gray-200",
    otpInputInputDisabled: "bg-gray-100",
    otpInputInputError: "border-red-500",
    otpInputSeparator: "mx-2",
    otpInputSeparatorDisabled: "bg-gray-100",
    otpInputSeparatorActive: "bg-gray-200",
  };    



function MobileForm({onSubmit}) {
    const {register, handleSubmit, formState: {errors}} = useForm({
        resolver: yupResolver(yup.object().shape({
            mobile: yup.string().required("Mobile number is required").matches(/^[0-9]{11}$/, "Mobile number must be 11 digits"),
        }))
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.label}>Mobile Number</div>
            <input {...register("mobile")} className={styles.input} type="text" placeholder="Enter your mobile number" />
            {errors.mobile && <span className={styles.error}>{errors.mobile.message}</span>}
            <button type="submit" className={styles.button}>Send OTP</button>
        </form>
    );
  }

function OTPForm({onSubmit}) {
    const {register, handleSubmit, formState: {errors}} = useForm({
        resolver: yupResolver(yup.object().shape({
            otp: yup.string().required("OTP is required").matches(/^[0-9]{6}$/, "OTP must be 6 digits"),
        }))
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.label}>OTP</div>
            <input {...register("otp")} className={styles.input} type="text" placeholder="Enter the OTP" />
            {errors.otp && <span className={styles.error}>{errors.otp.message}</span>}
            <button type="submit" className={styles.button}>Verify OTP</button>
        </form>
    );
  }

function Authenticated({ logout }) {
    return (
        <div>
            <p>Authenticated</p>
            <button onClick={logout} className={styles.button}>
                Logout
            </button>
        </div>
    );
  }

  

function AuthForm({ step = 'mobile', handleSendCode, handleVerifyOTP, logout, error }){    
    if (step === 'mobile') return (
        <>
            {error && <p className={styles.error}>{error}</p>}
            <MobileForm onSubmit={handleSendCode} />
        </>
    );
    if (step === 'otp') return (
        <>
            {error && <p className={styles.error}>{error}</p>}
            <OTPForm onSubmit={handleVerifyOTP} />
        </>
    );
    if (step === 'authenticated') return <Authenticated logout={logout} />;

    return <MobileForm onSubmit={handleSendCode} />;
}

export default AuthForm;