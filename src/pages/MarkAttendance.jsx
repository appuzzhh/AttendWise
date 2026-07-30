import { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function MarkAttendance() {
    const [periods, setPeriods] = useState([]);
    const [todaySlots, setTodaySlots] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [choices, setChoices] = useState({}); // periodIndex -> chosen subject name (for 'choice' slots)
    const [statuses, setStatuses] = useState({}); // subjectId -> 'present' | 'absent'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [error, setError] = useState('');

    const today = new Date();
    const todayName = DAY_NAMES[today.getDay()];
    const todayLabel = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ttRes, subRes] = await Promise.all([
                api.get('/timetable'),
                api.get('/subjects'),
            ]);
            const ttPeriods = ttRes.data.periods || [];
            const daySlots = ttRes.data.schedule?.[todayName]?.slots || [];
            setPeriods(ttPeriods);
            setTodaySlots(daySlots);
            setSubjects(subRes.data || []);
        } catch (err) {
            setError('Failed to load timetable');
        } finally {
            setLoading(false);
        }
    };

    // Build the list of "things to mark today": each is either a fixed subject or a choice needing resolution
    const relevantSlots = todaySlots
        .map((slot, i) => ({ ...slot, period: periods[i] }))
        .filter(s => s.period?.type === 'class' && (s.kind === 'subject' || s.kind === 'choice'));

    // Resolve each relevant slot down to a final subject name (choices need a selection first)
    const resolvedSubjectNames = new Set();
    relevantSlots.forEach((slot, idx) => {
        if (slot.kind === 'subject') {
            resolvedSubjectNames.add(slot.subjectName);
        } else if (slot.kind === 'choice') {
            const chosen = choices[slot.periodIndex];
            if (chosen) resolvedSubjectNames.add(chosen);
        }
    });

    const findSubjectId = (name) => subjects.find(s => s.name === name)?._id;

    const setStatus = (subjectId, status) => {
        setStatuses(prev => ({ ...prev, [subjectId]: status }));
    };

    const markedCount = Object.keys(statuses).length;
    const totalToMark = resolvedSubjectNames.size;

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const records = Object.entries(statuses).map(([subjectId, status]) => ({ subjectId, status }));
            await api.post('/attendance', { records });
            setSaveMsg('Attendance saved successfully!');
            setTimeout(() => setSaveMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto py-16 text-center text-slate-400 font-semibold">
                Loading today's classes...
            </div>
        );
    }

    const hasAnyClassToday = relevantSlots.length > 0;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Mark Attendance
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Record your attendance for today's scheduled classes
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 font-bold text-sm">
                    <CalendarDays className="w-4 h-4" />
                    {todayLabel}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 font-semibold text-sm rounded-2xl p-4">
                    {error}
                </div>
            )}
            {saveMsg && (
                <div className="bg-green-50 border-2 border-green-200 text-green-700 font-semibold text-sm rounded-2xl p-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> {saveMsg}
                </div>
            )}

            {!hasAnyClassToday ? (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-12 text-center">
                    <p className="text-slate-500 font-semibold text-lg">No classes scheduled today.</p>
                    <p className="text-slate-400 text-sm mt-2">Set up your timetable to see today's subjects here.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                    {/* Resolve any choice slots first */}
                    {relevantSlots.filter(s => s.kind === 'choice' && !choices[s.periodIndex]).map(slot => (
                        <div key={`choice-${slot.periodIndex}`} className="p-6 border-b border-slate-100 bg-purple-50/50">
                            <p className="font-bold text-slate-800 mb-1">{slot.period.label} <span className="text-slate-400 font-medium text-sm">({slot.period.startTime}-{slot.period.endTime})</span></p>
                            <p className="text-sm text-slate-500 font-medium mb-4">Which lab session is scheduled today?</p>
                            <div className="flex gap-3">
                                {slot.options.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setChoices(prev => ({ ...prev, [slot.periodIndex]: opt }))}
                                        className="flex-1 px-4 py-3 rounded-xl border-2 border-purple-200 text-purple-700 font-bold hover:border-purple-500 hover:bg-purple-50 transition-all"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Show markable subjects once resolved */}
                    {[...resolvedSubjectNames].map(name => {
                        const subjectId = findSubjectId(name);
                        if (!subjectId) return null;
                        const status = statuses[subjectId];

                        return (
                            <div key={subjectId} className="p-6 border-b border-slate-100 last:border-b-0 flex items-center justify-between flex-wrap gap-4">
                                <p className="font-bold text-slate-800">{name}</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStatus(subjectId, 'present')}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${status === 'present'
                                            ? 'bg-green-600 border-green-600 text-white'
                                            : 'border-slate-200 text-slate-500 hover:border-green-400 hover:text-green-600'
                                            }`}
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Present
                                    </button>
                                    <button
                                        onClick={() => setStatus(subjectId, 'absent')}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${status === 'absent'
                                            ? 'bg-red-600 border-red-600 text-white'
                                            : 'border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-600'
                                            }`}
                                    >
                                        <XCircle className="w-4 h-4" /> Absent
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    <div className="p-6 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
                        <p className="text-sm font-semibold text-slate-500">
                            {markedCount} of {totalToMark} subjects marked
                        </p>
                        <button
                            onClick={handleSave}
                            disabled={saving || markedCount === 0}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Today's Attendance
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}