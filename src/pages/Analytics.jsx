import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import api from '../lib/api';

export function Title({ icon: Icon, title, text }) {
    return (
        <div className="flex gap-4 items-center">
            <div className="p-3 bg-blue-100 rounded-2xl text-blue-700">
                <Icon />
            </div>
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {title}
                </h1>
                <p className="text-slate-500 mt-1 font-medium">{text}</p>
            </div>
        </div>
    );
}

export function Loading() {
    return (
        <div className="py-20 text-center text-slate-400 font-bold">
            Loading...
        </div>
    );
}

export function Empty({ text }) {
    return (
        <p className="py-10 text-center text-slate-400 font-medium">
            {text}
        </p>
    );
}

export default function Analytics() {
    const [data, setData] = useState({
        comparison: [],
        trend: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/attendance/analytics')
            .then((res) => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const trend = data.trend.slice(-14);

    const points = trend
        .map((item, index) => {
            const x = index * (100 / Math.max(trend.length - 1, 1));
            const y = 100 - item.percentage;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Title
                icon={BarChart3}
                title="Analytics"
                text="Compare subjects and see your attendance trend."
            />

            {loading ? (
                <Loading />
            ) : (
                <>
                    <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                        <h2 className="font-extrabold text-slate-900">
                            Subject comparison
                        </h2>

                        {data.comparison.length === 0 ? (
                            <Empty text="Add subjects and attendance records to see analytics." />
                        ) : (
                            <div className="mt-7 space-y-5">
                                {data.comparison.map((item) => (
                                    <div key={item.subjectId}>
                                        <div className="flex justify-between gap-4 text-sm font-bold">
                                            <span className="text-slate-700 truncate">
                                                {item.name}
                                            </span>

                                            <span
                                                className={
                                                    item.percentage >= item.goalPercentage
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                }
                                            >
                                                {item.percentage}% / {item.goalPercentage}% goal
                                            </span>
                                        </div>

                                        <div className="h-3 rounded-full bg-slate-100 mt-2 overflow-hidden">
                                            <div
                                                className={
                                                    item.percentage >= item.goalPercentage
                                                        ? 'h-full bg-green-500'
                                                        : 'h-full bg-red-500'
                                                }
                                                style={{
                                                    width: `${Math.min(item.percentage, 100)}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                        <h2 className="font-extrabold text-slate-900">
                            Attendance trend
                        </h2>

                        {!trend.length ? (
                            <Empty text="Your daily trend appears after you mark attendance." />
                        ) : (
                            <>
                                <div className="mt-6 h-56 relative">
                                    <div className="absolute inset-0 grid grid-rows-4">
                                        {[0, 1, 2, 3].map((item) => (
                                            <div
                                                key={item}
                                                className="border-t border-slate-100"
                                            />
                                        ))}
                                    </div>

                                    <svg
                                        viewBox="0 0 100 100"
                                        preserveAspectRatio="none"
                                        className="w-full h-full relative overflow-visible"
                                    >
                                        <polyline
                                            points={points}
                                            fill="none"
                                            stroke="#2563eb"
                                            strokeWidth="2.5"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    </svg>
                                </div>

                                <div className="flex justify-between text-xs text-slate-400 font-semibold">
                                    <span>{trend[0].date}</span>
                                    <span>{trend[trend.length - 1].date}</span>
                                </div>
                            </>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}