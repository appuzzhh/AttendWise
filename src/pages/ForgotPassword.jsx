import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import api from '../lib/api';

export default function ForgotPassword() {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setError('');

        const form = new FormData(event.target);

        try {
            const response = await api.post(
                '/auth/forgot-password',
                Object.fromEntries(form)
            );

            setMessage(response.data.message);

            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Could not reset password'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-white max-w-md w-full rounded-3xl border border-slate-200 shadow-xl p-8 space-y-5"
            >
                <div className="text-center">
                    <div className="inline-flex p-3 bg-blue-100 text-blue-700 rounded-2xl">
                        <KeyRound />
                    </div>

                    <h1 className="text-2xl font-extrabold text-slate-900 mt-4">
                        Reset password
                    </h1>

                    <p className="text-sm text-slate-500 mt-2">
                        Enter your registered email and register number.
                    </p>
                </div>

                <input
                    name="email"
                    type="email"
                    required
                    placeholder="Email address"
                    className="field"
                />

                <input
                    name="registerNumber"
                    required
                    placeholder="Register number"
                    className="field"
                />

                <input
                    name="newPassword"
                    type="password"
                    minLength="6"
                    required
                    placeholder="New password (minimum 6 characters)"
                    className="field"
                />

                {message && <p className="notice-success">{message}</p>}
                {error && <p className="notice-error">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn w-full justify-center"
                >
                    {loading ? 'Resetting...' : 'Reset password'}
                </button>

                <Link
                    to="/"
                    className="block text-center text-sm font-bold text-blue-600"
                >
                    Back to sign in
                </Link>
            </form>
        </div>
    );
}