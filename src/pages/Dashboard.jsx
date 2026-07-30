import { useState, useEffect } from 'react';
import { MoreVertical, Plus, Pencil, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function Dashboard() {
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : { name: 'Student', semester: 'S5' };

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [editingSubject, setEditingSubject] = useState(null); // subject object being edited
    const [deletingSubject, setDeletingSubject] = useState(null); // subject object pending delete confirm
    const [actionError, setActionError] = useState('');

    const loadSubjects = () => {
        setLoading(true);
        api.get('/subjects')
            .then(res => setSubjects(res.data))
            .catch(err => console.error('Failed to load subjects:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadSubjects();
    }, []);

    const getAttendanceData = (attended, total) => {
        const percentage = total === 0 ? 0 : Math.round((attended / total) * 100);

        let statusClass = "bg-green-100 text-green-700 border-green-200 ring-green-100";
        if (percentage < 75) statusClass = "bg-red-100 text-red-700 border-red-200 ring-red-100";
        else if (percentage < 78) statusClass = "bg-yellow-100 text-yellow-800 border-yellow-200 ring-yellow-100";

        let subtext = "";
        if (percentage < 75) {
            const required = Math.ceil(3 * total - 4 * attended);
            subtext = `Attend next ${required} classes to reach 75%`;
        } else {
            const canMiss = Math.floor((attended * 4) / 3) - total;
            subtext = canMiss === 0 ? "You cannot miss any classes" : `You can safely miss ${canMiss} classes`;
        }

        return { percentage, statusClass, subtext };
    };

    const handleDeleteConfirmed = async () => {
        if (!deletingSubject) return;
        try {
            await api.delete(`/subjects/${deletingSubject._id}`);
            setDeletingSubject(null);
            loadSubjects();
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to delete subject');
        }
    };

    const handleEditSave = async (updatedName, updatedMin) => {
        if (!editingSubject) return;
        try {
            await api.put(`/subjects/${editingSubject._id}`, {
                name: updatedName,
                minAttendance: updatedMin,
            });
            setEditingSubject(null);
            loadSubjects();
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to update subject');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 mb-2 flex items-center justify-between">
                <div>
                    <div className="flex items-center space-x-3">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Welcome back, {user.name}
                        </h1>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-sm font-bold shadow-sm">
                            {user.semester}
                        </span>
                    </div>
                    <p className="text-slate-500 mt-2 font-medium">Ready to track your attendance today?</p>
                </div>
            </div>

            {actionError && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 font-semibold text-sm rounded-2xl p-4 flex items-center justify-between">
                    {actionError}
                    <button onClick={() => setActionError('')} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex justify-between items-end mb-8 mt-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Your Overview</h1>
                    <p className="text-slate-500 mt-1.5 font-medium text-sm">Track your attendance across all subjects</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16 text-slate-400 font-semibold">Loading subjects...</div>
            ) : subjects.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-12 text-center flex flex-col items-center justify-center min-h-[250px]">
                    <p className="text-slate-500 font-semibold text-lg mb-4">No subjects added yet.</p>
                    <Link to="/add-subject" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">
                        <Plus className="w-5 h-5 mr-2" /> Add Your First Subject
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                    {subjects.map((subject) => {
                        const { percentage, statusClass, subtext } = getAttendanceData(subject.attended, subject.total);

                        return (
                            <div key={subject._id} className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200/60 hover:shadow-lg hover:border-slate-300 transition-all duration-300 relative overflow-visible group">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="font-bold text-slate-800 pr-8 leading-snug text-lg">{subject.name}</h3>
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === subject._id ? null : subject._id)}
                                            className="text-slate-400 hover:text-blue-600 transition-colors absolute right-0 -top-1 p-2 rounded-full hover:bg-blue-50"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>

                                        {openMenuId === subject._id && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setOpenMenuId(null)}
                                                />
                                                <div className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 overflow-hidden">
                                                    <button
                                                        onClick={() => {
                                                            setEditingSubject(subject);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4 text-slate-400" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDeletingSubject(subject);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-baseline space-x-3 my-2">
                                    <span className="text-5xl font-black tracking-tight text-slate-900">
                                        {percentage}%
                                    </span>
                                    <span className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border ring-4 ring-opacity-50 ${statusClass}`}>
                                        {percentage >= 78 ? 'Safe' : percentage >= 75 ? 'Warning' : 'Critical'}
                                    </span>
                                </div>

                                <p className="text-sm text-slate-500 font-semibold mb-6">
                                    {subject.attended} <span className="font-medium">out of</span> {subject.total} <span className="font-medium">classes attended</span>
                                </p>

                                <div className="pt-5 border-t border-slate-100">
                                    <p className={`text-sm font-semibold flex items-center ${percentage < 75 ? 'text-red-600' : 'text-slate-600'}`}>
                                        {subtext}
                                    </p>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100 rounded-b-3xl overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out ${percentage >= 78 ? 'bg-green-500' : percentage >= 75 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {editingSubject && (
                <EditSubjectModal
                    subject={editingSubject}
                    onCancel={() => setEditingSubject(null)}
                    onSave={handleEditSave}
                />
            )}

            {deletingSubject && (
                <DeleteConfirmModal
                    subject={deletingSubject}
                    onCancel={() => setDeletingSubject(null)}
                    onConfirm={handleDeleteConfirmed}
                />
            )}
        </div>
    );
}

function EditSubjectModal({ subject, onCancel, onSave }) {
    const [name, setName] = useState(subject.name);
    const [minAttendance, setMinAttendance] = useState(subject.minAttendance || 75);

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-extrabold text-slate-900">Edit Subject</h2>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Minimum Attendance Target (%)</label>
                        <input
                            type="number"
                            value={minAttendance}
                            onChange={(e) => setMinAttendance(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-7">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(name, minAttendance)}
                        className="flex-1 px-5 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeleteConfirmModal({ subject, onCancel, onConfirm }) {
    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-xl">
                <h2 className="text-lg font-extrabold text-slate-900 mb-2">Delete "{subject.name}"?</h2>
                <p className="text-sm text-slate-500 font-medium mb-7">
                    This will permanently delete this subject along with all its attendance records. This action cannot be undone.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-5 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-md shadow-red-200"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}