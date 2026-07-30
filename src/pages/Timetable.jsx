import { useState, useEffect } from 'react';
import { CalendarDays, Plus, Trash2, Save, Loader2, CheckCircle2, X } from 'lucide-react';
import api from '../lib/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
};

export default function Timetable() {
    const [periods, setPeriods] = useState([]);
    const [schedule, setSchedule] = useState({});
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState(false);
    const [error, setError] = useState('');
    const [editingSlot, setEditingSlot] = useState(null); // { day, periodIndex }

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [ttRes, subRes] = await Promise.all([
                api.get('/timetable'),
                api.get('/subjects'),
            ]);
            setPeriods(ttRes.data.periods || []);
            setSchedule(ttRes.data.schedule || {});
            setSubjects(subRes.data || []);
        } catch (err) {
            setError('Failed to load timetable');
        } finally {
            setLoading(false);
        }
    };

    const syncScheduleToPeriods = (newPeriods, oldSchedule) => {
        const newSchedule = {};
        DAYS.forEach(day => {
            const existingSlots = oldSchedule?.[day]?.slots || [];
            const newSlots = newPeriods.map((_, i) => {
                return existingSlots[i] || { periodIndex: i, kind: 'none', subjectName: '', options: [] };
            });
            newSchedule[day] = { slots: newSlots };
        });
        return newSchedule;
    };

    const updatePeriodField = (index, field, value) => {
        const updated = [...periods];
        updated[index] = { ...updated[index], [field]: value };
        setPeriods(updated);
    };

    const addPeriod = () => {
        const newPeriods = [
            ...periods,
            { label: `Period ${periods.length + 1}`, startTime: '09:00', endTime: '09:50', type: 'class' }
        ];
        setPeriods(newPeriods);
        setSchedule(syncScheduleToPeriods(newPeriods, schedule));
    };

    const removePeriod = (index) => {
        const newPeriods = periods.filter((_, i) => i !== index);
        setPeriods(newPeriods);
        setSchedule(syncScheduleToPeriods(newPeriods, schedule));
    };

    const updateSlot = (day, periodIndex, newSlot) => {
        setSchedule(prev => {
            const daySlots = [...(prev[day]?.slots || [])];
            daySlots[periodIndex] = { periodIndex, ...newSlot };
            return { ...prev, [day]: { slots: daySlots } };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const syncedSchedule = syncScheduleToPeriods(periods, schedule);
            const res = await api.put('/timetable', { periods, schedule: syncedSchedule });
            setPeriods(res.data.periods);
            setSchedule(res.data.schedule);
            setSavedMsg(true);
            setTimeout(() => setSavedMsg(false), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save timetable');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto py-16 text-center text-slate-400 font-semibold">
                Loading timetable...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <CalendarDays className="w-7 h-7 text-blue-600" />
                        Timetable
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Set up periods, timings, and which subject falls where
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:opacity-60"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : savedMsg ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    {saving ? 'Saving...' : savedMsg ? 'Saved!' : 'Save Timetable'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 font-semibold text-sm rounded-2xl p-4">
                    {error}
                </div>
            )}

            {subjects.length === 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 font-semibold text-sm rounded-2xl p-4">
                    ⚠️ You haven't added any subjects yet. Add subjects first so you can assign them to periods below.
                </div>
            )}

            {/* Periods editor */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60">
                <h2 className="text-lg font-bold text-slate-800 mb-1">Periods & Timings</h2>
                <p className="text-sm text-slate-500 font-medium mb-6">
                    Add, remove, or edit periods, breaks, and lunch — these apply across the whole week.
                </p>

                <div className="space-y-3">
                    <div className="hidden sm:grid grid-cols-12 gap-3 px-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <div className="col-span-4">Label</div>
                        <div className="col-span-2">Start</div>
                        <div className="col-span-2">End</div>
                        <div className="col-span-3">Type</div>
                        <div className="col-span-1"></div>
                    </div>

                    {periods.map((period, index) => (
                        <div key={index} className="grid grid-cols-2 sm:grid-cols-12 gap-3 items-center bg-slate-50 rounded-xl p-3 sm:p-2 sm:bg-transparent sm:rounded-none">
                            <div className="col-span-2 sm:col-span-4">
                                <input
                                    type="text"
                                    value={period.label}
                                    onChange={(e) => updatePeriodField(index, 'label', e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-semibold text-sm text-slate-800"
                                    placeholder="e.g. Period 1"
                                />
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                                <input
                                    type="time"
                                    value={period.startTime}
                                    onChange={(e) => updatePeriodField(index, 'startTime', e.target.value)}
                                    className="w-full px-2 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-semibold text-sm text-slate-800"
                                />
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                                <input
                                    type="time"
                                    value={period.endTime}
                                    onChange={(e) => updatePeriodField(index, 'endTime', e.target.value)}
                                    className="w-full px-2 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-semibold text-sm text-slate-800"
                                />
                            </div>
                            <div className="col-span-1 sm:col-span-3">
                                <select
                                    value={period.type}
                                    onChange={(e) => updatePeriodField(index, 'type', e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-semibold text-sm text-slate-800 bg-white"
                                >
                                    <option value="class">Class</option>
                                    <option value="break">Break</option>
                                    <option value="lunch">Lunch</option>
                                </select>
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <button
                                    onClick={() => removePeriod(index)}
                                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={addPeriod}
                    className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm"
                >
                    <Plus className="w-4 h-4" /> Add Period
                </button>
            </div>

            {/* Weekly grid - now clickable to assign subjects */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 overflow-x-auto">
                <h2 className="text-lg font-bold text-slate-800 mb-1">Weekly Schedule</h2>
                <p className="text-sm text-slate-500 font-medium mb-6">
                    Click any class cell to assign a subject, or set up a lab-rotation choice.
                </p>

                <table className="w-full min-w-[750px] border-collapse">
                    <thead>
                        <tr>
                            <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4">Day</th>
                            {periods.map((p, i) => (
                                <th key={i} className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 px-2 whitespace-nowrap">
                                    {p.label}
                                    <div className="text-[10px] font-medium text-slate-300 normal-case">{p.startTime}-{p.endTime}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map(day => (
                            <tr key={day} className="border-t border-slate-100">
                                <td className="py-3 pr-4 font-bold text-slate-700 text-sm whitespace-nowrap">{DAY_LABELS[day]}</td>
                                {periods.map((p, i) => {
                                    const slot = schedule?.[day]?.slots?.[i];
                                    const isClass = p.type === 'class';

                                    return (
                                        <td key={i} className="py-2 px-1.5">
                                            {!isClass ? (
                                                <div className="px-3 py-2 rounded-lg text-xs text-slate-300 italic text-center">
                                                    {p.type}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingSlot({ day, periodIndex: i })}
                                                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all border-2 ${slot?.kind === 'subject'
                                                            ? 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400'
                                                            : slot?.kind === 'choice'
                                                                ? 'bg-purple-50 border-purple-200 text-purple-700 hover:border-purple-400'
                                                                : 'bg-slate-50 border-dashed border-slate-200 text-slate-300 hover:border-slate-400 hover:text-slate-500'
                                                        }`}
                                                >
                                                    {slot?.kind === 'subject' ? slot.subjectName
                                                        : slot?.kind === 'choice' ? slot.options?.join(' / ')
                                                            : '+ Assign'}
                                                </button>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingSlot && (
                <SlotEditModal
                    dayLabel={DAY_LABELS[editingSlot.day]}
                    periodLabel={periods[editingSlot.periodIndex]?.label}
                    currentSlot={schedule?.[editingSlot.day]?.slots?.[editingSlot.periodIndex]}
                    subjects={subjects}
                    onCancel={() => setEditingSlot(null)}
                    onSave={(newSlot) => {
                        updateSlot(editingSlot.day, editingSlot.periodIndex, newSlot);
                        setEditingSlot(null);
                    }}
                />
            )}
        </div>
    );
}

function SlotEditModal({ dayLabel, periodLabel, currentSlot, subjects, onCancel, onSave }) {
    const [kind, setKind] = useState(currentSlot?.kind === 'none' ? 'subject' : (currentSlot?.kind || 'subject'));
    const [subjectName, setSubjectName] = useState(currentSlot?.kind === 'subject' ? currentSlot.subjectName : (subjects[0]?.name || ''));
    const [option1, setOption1] = useState(currentSlot?.options?.[0] || subjects[0]?.name || '');
    const [option2, setOption2] = useState(currentSlot?.options?.[1] || subjects[1]?.name || subjects[0]?.name || '');

    const handleSave = () => {
        if (kind === 'subject') {
            onSave({ kind: 'subject', subjectName, options: [] });
        } else {
            onSave({ kind: 'choice', subjectName: '', options: [option1, option2].filter(Boolean) });
        }
    };

    const handleClear = () => {
        onSave({ kind: 'none', subjectName: '', options: [] });
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-extrabold text-slate-900">{periodLabel}</h2>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-6">{dayLabel}</p>

                {subjects.length === 0 ? (
                    <p className="text-sm text-slate-500 font-medium">
                        No subjects available. Add a subject first from the "Add Subject" page.
                    </p>
                ) : (
                    <>
                        <div className="flex gap-2 mb-5">
                            <button
                                onClick={() => setKind('subject')}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${kind === 'subject' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-600'
                                    }`}
                            >
                                Single Subject
                            </button>
                            <button
                                onClick={() => setKind('choice')}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${kind === 'choice' ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-200 text-slate-600'
                                    }`}
                            >
                                Choice (Lab Rotation)
                            </button>
                        </div>

                        {kind === 'subject' ? (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject</label>
                                <select
                                    value={subjectName}
                                    onChange={(e) => setSubjectName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800 bg-white"
                                >
                                    {subjects.map(s => (
                                        <option key={s._id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-500 font-medium">
                                    On this day, you'll be asked to pick which one applies each week.
                                </p>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Option 1</label>
                                    <select
                                        value={option1}
                                        onChange={(e) => setOption1(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800 bg-white"
                                    >
                                        {subjects.map(s => (
                                            <option key={s._id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Option 2</label>
                                    <select
                                        value={option2}
                                        onChange={(e) => setOption2(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800 bg-white"
                                    >
                                        {subjects.map(s => (
                                            <option key={s._id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="flex gap-3 mt-7">
                    <button
                        onClick={handleClear}
                        className="px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors text-sm"
                    >
                        Clear
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    {subjects.length > 0 && (
                        <button
                            onClick={handleSave}
                            className="flex-1 px-5 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                        >
                            Apply
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}