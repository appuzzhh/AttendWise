import { useState, useEffect } from 'react';
import {
    Calculator, TrendingUp, TrendingDown, CheckCircle2, ChevronLeft, ChevronRight,
    Layers, BookOpen, ShieldCheck, Target, RefreshCw, ClipboardCheck, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function Calculators() {
    const [mode, setMode] = useState(null); // null | 'overall' | 'subjectwise'
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [activeCalc, setActiveCalc] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/subjects')
            .then(res => setSubjects(res.data))
            .catch(err => console.error('Failed to load subjects:', err))
            .finally(() => setLoading(false));
    }, []);

    const overallAttended = subjects.reduce((sum, s) => sum + (s.attended || 0), 0);
    const overallTotal = subjects.reduce((sum, s) => sum + (s.total || 0), 0);

    const calcOptions = [
        { id: 'safeLeave', label: 'Safe Leave Calculator', desc: 'How many classes can I miss?', icon: ShieldCheck },
        { id: 'target', label: '75% Target Calculator', desc: 'How many classes to reach a target %?', icon: Target },
        { id: 'recovery', label: 'Recovery Calculator', desc: 'Can I still recover my attendance?', icon: RefreshCw },
        { id: 'eligibility', label: 'Exam Eligibility', desc: 'Am I eligible to write the exam?', icon: ClipboardCheck },
    ];

    const resetAll = () => {
        setMode(null);
        setSelectedSubject(null);
        setActiveCalc(null);
    };

    const dataForCalc = mode === 'overall'
        ? { name: 'Overall (All Subjects)', attended: overallAttended, total: overallTotal }
        : selectedSubject
            ? { name: selectedSubject.name, attended: selectedSubject.attended || 0, total: selectedSubject.total || 0 }
            : null;

    const activeCalcMeta = calcOptions.find(c => c.id === activeCalc);

    const crumbs = [];
    if (mode === 'overall') crumbs.push('Overall');
    if (mode === 'subjectwise') {
        crumbs.push('Subject-wise');
        if (selectedSubject) crumbs.push(selectedSubject.name);
    }
    if (activeCalcMeta) crumbs.push(activeCalcMeta.label);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <Calculator className="w-7 h-7 text-blue-600" />
                    Attendance Calculators
                </h1>
                <p className="text-slate-500 mt-2 font-medium">
                    Check overall attendance or drill into a specific subject
                </p>
            </div>

            {crumbs.length > 0 && (
                <div className="flex items-center flex-wrap gap-1.5 text-sm font-semibold text-slate-400 animate-fadeIn">
                    <button onClick={resetAll} className="hover:text-blue-600 transition-colors">Calculators</button>
                    {crumbs.map((crumb, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className={i === crumbs.length - 1 ? 'text-slate-800 font-bold' : ''}>{crumb}</span>
                        </span>
                    ))}
                </div>
            )}

            {!mode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fadeIn">
                    <button
                        onClick={() => setMode('overall')}
                        className="bg-white rounded-3xl p-8 shadow-sm border-2 border-slate-200/60 hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-left group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                            <Layers className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mb-1">Overall</h3>
                        <p className="text-sm text-slate-500 font-medium">Combined attendance across all your subjects</p>
                    </button>

                    <button
                        onClick={() => setMode('subjectwise')}
                        className="bg-white rounded-3xl p-8 shadow-sm border-2 border-slate-200/60 hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-left group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                            <BookOpen className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mb-1">Subject-wise</h3>
                        <p className="text-sm text-slate-500 font-medium">Pick a specific subject to calculate for</p>
                    </button>
                </div>
            )}

            {mode === 'subjectwise' && !selectedSubject && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 animate-fadeIn">
                    <button onClick={resetAll} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600 mb-5 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Choose a subject</h2>

                    {loading ? (
                        <SubjectSkeleton />
                    ) : subjects.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {subjects.map((s) => (
                                <button
                                    key={s._id}
                                    onClick={() => setSelectedSubject(s)}
                                    className="px-4 py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:border-blue-400 hover:bg-blue-50 hover:-translate-y-0.5 transition-all duration-200 text-left"
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {((mode === 'overall') || (mode === 'subjectwise' && selectedSubject)) && !activeCalc && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 animate-fadeIn">
                    <button
                        onClick={() => mode === 'overall' ? resetAll() : setSelectedSubject(null)}
                        className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600 mb-5 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <h2 className="text-lg font-bold text-slate-800 mb-1">
                        {dataForCalc.name}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mb-5">Choose what you want to calculate</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {calcOptions.map((c) => {
                            const Icon = c.icon;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveCalc(c.id)}
                                    className="flex items-start gap-3.5 px-5 py-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:-translate-y-0.5 transition-all duration-200 text-left"
                                >
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{c.label}</p>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">{c.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeCalc && dataForCalc && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 animate-fadeIn">
                    <button
                        onClick={() => setActiveCalc(null)}
                        className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600 mb-5 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="flex items-center gap-3 mb-1">
                        {activeCalcMeta && (
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-blue-100 flex items-center justify-center">
                                <activeCalcMeta.icon className="w-4.5 h-4.5 text-blue-600" />
                            </div>
                        )}
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{dataForCalc.name}</p>
                    </div>

                    {activeCalc === 'safeLeave' && <SafeLeaveCalculator data={dataForCalc} />}
                    {activeCalc === 'target' && <TargetCalculator data={dataForCalc} />}
                    {activeCalc === 'recovery' && <RecoveryCalculator data={dataForCalc} />}
                    {activeCalc === 'eligibility' && <EligibilityCalculator data={dataForCalc} />}
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.35s ease-out; }
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.96); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-popIn { animation: popIn 0.3s ease-out; }
            `}</style>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-10 px-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500 font-semibold mb-4">No subjects added yet.</p>
            <Link
                to="/add-subject"
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 text-sm"
            >
                <Plus className="w-4 h-4 mr-2" /> Add Your First Subject
            </Link>
        </div>
    );
}

function SubjectSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
            ))}
        </div>
    );
}

function PercentRing({ percent, safe }) {
    const clamped = Math.max(0, Math.min(100, percent));
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;
    const color = safe ? '#16a34a' : percent >= 75 ? '#ca8a04' : '#dc2626';

    return (
        <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
                <circle cx="40" cy="40" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle
                    cx="40" cy="40" r={radius} fill="none"
                    stroke={color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black text-slate-900">{percent}%</span>
            </div>
        </div>
    );
}

function SafeLeaveCalculator({ data }) {
    const [attended, setAttended] = useState(String(data.attended));
    const [total, setTotal] = useState(String(data.total));
    const [minPercent, setMinPercent] = useState('75');
    const [result, setResult] = useState(null);

    const calculate = () => {
        const a = parseFloat(attended);
        const t = parseFloat(total);
        const m = parseFloat(minPercent) / 100;

        if (isNaN(a) || isNaN(t) || t <= 0 || a > t) {
            setResult({ error: 'Please enter valid numbers (attended cannot exceed total).' });
            return;
        }

        const currentPercent = (a / t) * 100;
        const canMiss = Math.floor(a / m) - t;

        setResult({
            currentPercent: parseFloat(currentPercent.toFixed(1)),
            canMiss: canMiss > 0 ? canMiss : 0,
            safe: currentPercent >= parseFloat(minPercent),
        });
    };

    return (
        <div className="space-y-5 mt-4">
            <h2 className="text-lg font-bold text-slate-800">How many classes can I safely miss?</h2>
            <InputRow label="Classes Attended" value={attended} onChange={setAttended} placeholder="e.g. 20" />
            <InputRow label="Total Classes Held" value={total} onChange={setTotal} placeholder="e.g. 24" />
            <InputRow label="Minimum Required %" value={minPercent} onChange={setMinPercent} placeholder="75" />
            <CalcButton onClick={calculate} />

            {result && !result.error && (
                <ResultBox safe={result.safe}>
                    <div className="flex items-center gap-5">
                        <PercentRing percent={result.currentPercent} safe={result.safe} />
                        <div>
                            {result.canMiss > 0 ? (
                                <p className="text-green-700 font-bold">
                                    ✅ You can safely miss <span className="text-xl">{result.canMiss}</span> more classes
                                </p>
                            ) : (
                                <p className="text-red-600 font-bold">⚠️ You cannot miss any more classes right now</p>
                            )}
                        </div>
                    </div>
                </ResultBox>
            )}
            {result?.error && <ErrorBox message={result.error} />}
        </div>
    );
}

function TargetCalculator({ data }) {
    const [attended, setAttended] = useState(String(data.attended));
    const [total, setTotal] = useState(String(data.total));
    const [targetPercent, setTargetPercent] = useState('75');
    const [result, setResult] = useState(null);

    const calculate = () => {
        const a = parseFloat(attended);
        const t = parseFloat(total);
        const target = parseFloat(targetPercent) / 100;

        if (isNaN(a) || isNaN(t) || t <= 0 || a > t) {
            setResult({ error: 'Please enter valid numbers (attended cannot exceed total).' });
            return;
        }

        const currentPercent = (a / t) * 100;

        if (currentPercent >= parseFloat(targetPercent)) {
            setResult({ currentPercent: parseFloat(currentPercent.toFixed(1)), alreadyThere: true });
        } else {
            const needed = Math.ceil((target * t - a) / (1 - target));
            setResult({ currentPercent: parseFloat(currentPercent.toFixed(1)), needed, alreadyThere: false });
        }
    };

    return (
        <div className="space-y-5 mt-4">
            <h2 className="text-lg font-bold text-slate-800">How many classes to reach my target %?</h2>
            <InputRow label="Classes Attended" value={attended} onChange={setAttended} placeholder="e.g. 15" />
            <InputRow label="Total Classes Held" value={total} onChange={setTotal} placeholder="e.g. 22" />
            <InputRow label="Target %" value={targetPercent} onChange={setTargetPercent} placeholder="75" />
            <CalcButton onClick={calculate} />

            {result && !result.error && (
                <ResultBox safe={result.alreadyThere}>
                    <div className="flex items-center gap-5">
                        <PercentRing percent={result.currentPercent} safe={result.alreadyThere} />
                        <div>
                            {result.alreadyThere ? (
                                <p className="text-green-700 font-bold">✅ You've already reached your target!</p>
                            ) : (
                                <p className="text-yellow-700 font-bold">
                                    📚 Attend the next <span className="text-xl">{result.needed}</span> classes in a row to reach {targetPercent}%
                                </p>
                            )}
                        </div>
                    </div>
                </ResultBox>
            )}
            {result?.error && <ErrorBox message={result.error} />}
        </div>
    );
}

function RecoveryCalculator({ data }) {
    const [attended, setAttended] = useState(String(data.attended));
    const [total, setTotal] = useState(String(data.total));
    const [futureClasses, setFutureClasses] = useState('');
    const [minPercent, setMinPercent] = useState('75');
    const [result, setResult] = useState(null);

    const calculate = () => {
        const a = parseFloat(attended);
        const t = parseFloat(total);
        const f = parseFloat(futureClasses);
        const m = parseFloat(minPercent);

        if (isNaN(a) || isNaN(t) || isNaN(f) || t <= 0 || f < 0 || a > t) {
            setResult({ error: 'Please enter valid numbers.' });
            return;
        }

        const finalTotal = t + f;
        const bestPossible = ((a + f) / finalTotal) * 100;

        if (bestPossible < m) {
            setResult({ possible: false, bestPossible: parseFloat(bestPossible.toFixed(1)) });
        } else {
            let needed = 0;
            for (let x = 0; x <= f; x++) {
                const percent = ((a + x) / finalTotal) * 100;
                if (percent >= m) {
                    needed = x;
                    break;
                }
            }
            setResult({ possible: true, needed, outOf: f });
        }
    };

    return (
        <div className="space-y-5 mt-4">
            <h2 className="text-lg font-bold text-slate-800">Can I still recover my attendance?</h2>
            <InputRow label="Classes Attended So Far" value={attended} onChange={setAttended} placeholder="e.g. 10" />
            <InputRow label="Total Classes Held So Far" value={total} onChange={setTotal} placeholder="e.g. 18" />
            <InputRow label="Remaining Classes This Semester" value={futureClasses} onChange={setFutureClasses} placeholder="e.g. 20" />
            <InputRow label="Minimum Required %" value={minPercent} onChange={setMinPercent} placeholder="75" />
            <CalcButton onClick={calculate} />

            {result && !result.error && result.possible && (
                <ResultBox safe={true}>
                    <p className="text-green-700 font-bold">
                        ✅ Recovery possible! Attend at least{' '}
                        <span className="text-xl">{result.needed}</span> out of the remaining {result.outOf} classes.
                    </p>
                </ResultBox>
            )}
            {result && !result.error && !result.possible && (
                <ResultBox safe={false}>
                    <div className="flex items-center gap-5">
                        <PercentRing percent={result.bestPossible} safe={false} />
                        <p className="text-red-600 font-bold">
                            ⚠️ Not possible. Even attending all remaining classes, best you can reach is {result.bestPossible}%.
                        </p>
                    </div>
                </ResultBox>
            )}
            {result?.error && <ErrorBox message={result.error} />}
        </div>
    );
}

function EligibilityCalculator({ data }) {
    const [attended, setAttended] = useState(String(data.attended));
    const [total, setTotal] = useState(String(data.total));
    const [minPercent, setMinPercent] = useState('75');
    const [result, setResult] = useState(null);

    const calculate = () => {
        const a = parseFloat(attended);
        const t = parseFloat(total);
        const m = parseFloat(minPercent);

        if (isNaN(a) || isNaN(t) || t <= 0 || a > t) {
            setResult({ error: 'Please enter valid numbers.' });
            return;
        }

        const percent = (a / t) * 100;
        setResult({ percent: parseFloat(percent.toFixed(1)), eligible: percent >= m });
    };

    return (
        <div className="space-y-5 mt-4">
            <h2 className="text-lg font-bold text-slate-800">Am I eligible to write the exam?</h2>
            <InputRow label="Classes Attended" value={attended} onChange={setAttended} placeholder="e.g. 17" />
            <InputRow label="Total Classes Held" value={total} onChange={setTotal} placeholder="e.g. 24" />
            <InputRow label="Required Minimum %" value={minPercent} onChange={setMinPercent} placeholder="75" />
            <CalcButton onClick={calculate} />

            {result && !result.error && (
                <ResultBox safe={result.eligible}>
                    <div className="flex items-center gap-5">
                        <PercentRing percent={result.percent} safe={result.eligible} />
                        <div className="flex items-center gap-3">
                            {result.eligible ? (
                                <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
                            ) : (
                                <TrendingDown className="w-8 h-8 text-red-600 shrink-0" />
                            )}
                            <p className={`font-bold ${result.eligible ? 'text-green-700' : 'text-red-600'}`}>
                                {result.eligible ? 'Eligible to write the exam' : 'Not eligible — attendance too low'}
                            </p>
                        </div>
                    </div>
                </ResultBox>
            )}
            {result?.error && <ErrorBox message={result.error} />}
        </div>
    );
}

function InputRow({ label, value, onChange, placeholder }) {
    return (
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
            />
        </div>
    );
}

function CalcButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-200"
        >
            <TrendingUp className="w-5 h-5" />
            Calculate
        </button>
    );
}

function ResultBox({ safe, children }) {
    return (
        <div
            className={`rounded-2xl p-5 border-2 animate-popIn ${safe ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
        >
            {children}
        </div>
    );
}

function ErrorBox({ message }) {
    return (
        <div className="rounded-2xl p-4 border-2 bg-yellow-50 border-yellow-200 text-yellow-800 font-semibold text-sm animate-popIn">
            ⚠️ {message}
        </div>
    );
}