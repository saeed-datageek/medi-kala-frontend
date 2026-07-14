import { useForm } from "react-hook-form";

import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const styles = {
    card: "bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4",
    input: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline",
    button: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline",
    error: "text-red-500 text-xs italic",
    label: "block text-gray-700 text-sm font-bold mb-2",
};

function MobileForm({ onSubmit }) {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(yup.object().shape({
            mobile: yup.string().required("Mobile number is required").matches(/^[0-9]{11}$/, "Mobile number must be 11 digits"),
            password: yup.string().required("Password is required").min(6, "Password must be at least 6 characters"),
        }))
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.label}>Mobile Number</div>
            <input {...register("mobile")} className={styles.input} type="text" placeholder="Enter your mobile number" />
            {errors.mobile && <span className={styles.error}>{errors.mobile.message}</span>}
            <div className={styles.label}>Password</div>
            <input {...register("password")} className={styles.input} type="password" placeholder="Enter your password" />
            {errors.password && <span className={styles.error}>{errors.password.message}</span>}
            <button type="submit" className={styles.button}>Login</button>
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

function AdminForm({ step = 'mobile', handleAdminLogin, logout, error }) {
    if (step === 'mobile') {
        return (
            <div className={styles.card}>
                {error && <p className={styles.error}>{error}</p>}
                <MobileForm onSubmit={handleAdminLogin} />
            </div>
        );
    }

    if (step === 'authenticated') {
        return <Authenticated logout={logout} />;
    }

    return (
        <div className={styles.card}>
            {error && <p className={styles.error}>{error}</p>}
            <MobileForm onSubmit={handleAdminLogin} />
        </div>
    );
}

export default AdminForm