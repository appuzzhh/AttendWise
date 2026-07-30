import { useState, useEffect } from 'react';
import {
    LockKeyhole,
    CheckCircle2,
    User,
    Mail,
    Hash,
    GraduationCap,
    Pencil,
    X,
    Loader2,
    Save,
} from "lucide-react";
import api from '../lib/api';

const SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState(false);
    const [error, setError] = useState('');

    // Editable fields
    const [name, setName] = useState('');
    const [semester, setSemester] = useState('');


    useEffect(() => {
        loadProfile();
    }, []);

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: ''
    });

    const [passwordMessage, setPasswordMessage] = useState('');

    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth/profile');
            setProfile(res.data);
            setName(res.data.name);
            setSemester(res.data.semester);

        } catch (err) {
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = () => {
        setName(profile.name);
        setSemester(profile.semester);

        setEditing(true);
        setError('');
    };

    const handleCancel = () => {
        setEditing(false);
        setError('');
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await api.put('/auth/profile', { name, semester });
            setProfile(res.data);

            // Keep localStorage user in sync so Dashboard welcome header updates too
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                localStorage.setItem('user', JSON.stringify({ ...parsed, ...res.data }));
            }

            setEditing(false);
            setSavedMsg(true);
            setTimeout(() => setSavedMsg(false), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (event) => {
        event.preventDefault();

        setError('');
        setPasswordMessage('');

        try {
            const response = await api.put(
                '/auth/change-password',
                passwords
            );

            setPasswordMessage(response.data.message);

            setPasswords({
                currentPassword: '',
                newPassword: ''
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to change password'
            );
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto py-16 text-center text-slate-400 font-semibold">
                Loading profile...
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-2xl mx-auto py-16 text-center text-red-500 font-semibold">
                {error || 'Could not load profile.'}
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <form
                onSubmit={handleChangePassword}
                className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 sm:p-8"
            >
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                        <LockKeyhole className="w-5 h-5" />
                    </div>

                    <div>
                        <h2 className="font-extrabold text-slate-900">
                            Change password
                        </h2>
                        <p className="text-sm text-slate-500">
                            Use at least 6 characters.
                        </p>
                    </div>
                </div>

                {passwordMessage && (
                    <div className="notice-success mb-4">
                        {passwordMessage}
                    </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3">
                    <input
                        type="password"
                        required
                        value={passwords.currentPassword}
                        onChange={(event) =>
                            setPasswords({
                                ...passwords,
                                currentPassword: event.target.value
                            })
                        }
                        placeholder="Current password"
                        className="field"
                    />

                    <input
                        type="password"
                        required
                        minLength="6"
                        value={passwords.newPassword}
                        onChange={(event) =>
                            setPasswords({
                                ...passwords,
                                newPassword: event.target.value
                            })
                        }
                        placeholder="New password"
                        className="field"
                    />
                </div>

                <button type="submit" className="btn mt-4">
                    Change password
                </button>
            </form>
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    My Profile
                </h1>
                <p className="text-slate-500 mt-2 font-medium">
                    View and update your account details
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 font-semibold text-sm rounded-2xl p-4">
                    {error}
                </div>
            )}
            {savedMsg && (
                <div className="bg-green-50 border-2 border-green-200 text-green-700 font-semibold text-sm rounded-2xl p-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Profile updated successfully!
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                {/* Header */}
                <div className="p-8 bg-gradient-to-br from-blue-50 to-white border-b border-slate-100 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-blue-200">
                        {profile.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900">{profile.name}</h2>
                        <p className="text-slate-500 font-medium text-sm">{profile.registerNumber}</p>
                    </div>
                </div>

                {/* Details */}
                <div className="p-6 sm:p-8 space-y-5">
                    <ProfileField
                        icon={User}
                        label="Full Name"
                        editing={editing}
                        value={editing ? name : profile.name}
                        onChange={setName}
                    />

                    <ProfileField
                        icon={Mail}
                        label="Email"
                        editing={false} // never editable
                        value={profile.email}
                    />

                    <ProfileField
                        icon={Hash}
                        label="Register Number"
                        editing={false} // never editable
                        value={profile.registerNumber}
                    />

                    <ProfileField
                        icon={GraduationCap}
                        label="Semester"
                        editing={editing}
                        value={editing ? semester : profile.semester}
                        onChange={setSemester}
                        type="select"
                        options={SEMESTERS}
                    />


                </div>

                {/* Actions */}
                <div className="p-6 sm:p-8 pt-0 flex gap-3">
                    {!editing ? (
                        <button
                            onClick={handleEditClick}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                        >
                            <Pencil className="w-4 h-4" /> Edit Profile
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                            >
                                <X className="w-4 h-4" /> Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:opacity-60"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProfileField({ icon: Icon, label, editing, value, onChange, type = 'text', options = [] }) {
    return (
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center mt-0.5">
                <Icon className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                {!editing ? (
                    <p className="font-bold text-slate-800">{value}</p>
                ) : type === 'select' ? (
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-semibold text-slate-800 bg-white"
                    >
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-semibold text-slate-800"
                    />
                )}
            </div>
        </div>
    );
}