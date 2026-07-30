import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Percent, Plus } from 'lucide-react';
import api from '../lib/api';

export default function AddSubject() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData(e.target);
        try {
            await api.post('/subjects', {
                name: formData.get('subjectName'),
                minAttendance: Number(formData.get('minPercentage')),
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add subject. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-6">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add New Subject</h1>
                <p className="text-slate-500 mt-2 font-medium">Create a new course to start tracking your attendance</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="subjectName" className="block text-sm font-bold text-slate-800 mb-2">
                                Subject Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <BookOpen className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="subjectName"
                                    name="subjectName"
                                    type="text"
                                    required
                                    placeholder="e.g. Software Engineering"
                                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="minPercentage" className="block text-sm font-bold text-slate-800 mb-2">
                                Minimum Attendance Target
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Percent className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    id="minPercentage"
                                    name="minPercentage"
                                    type="number"
                                    min="0"
                                    max="100"
                                    defaultValue="75"
                                    required
                                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-900"
                                />
                            </div>
                            <p className="mt-2.5 text-sm font-medium text-slate-500">
                                Most institutions require 75% minimum attendance. We will alert you if you drop below this target.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="pt-6 mt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent rounded-xl shadow-md shadow-blue-200 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-5 h-5 mr-2 -ml-1" />
                            {loading ? 'Adding...' : 'Add Subject'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}



