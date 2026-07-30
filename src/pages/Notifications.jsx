import { useEffect, useState } from 'react';
import { Bell, CalendarClock, TriangleAlert } from 'lucide-react';
import api from '../lib/api';
import { Empty, Loading, Title } from './Analytics';

export default function Notifications() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/subjects')
            .then((response) => setSubjects(response.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const lowAttendanceSubjects = subjects.filter((subject) => {
        if (!subject.total) return false;

        const percentage = (subject.attended * 100) / subject.total;
        const target = subject.goalPercentage || subject.minAttendance || 75;

        return percentage < target;
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Title
                icon={Bell}
                title="Attendance alerts"
                text="Reminders and low-attendance warnings."
            />

            {loading ? (
                <Loading />
            ) : (
                <>
                    <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 flex gap-4">
                        <CalendarClock className="text-blue-600 shrink-0" />

                        <div>
                            <p className="font-bold text-blue-900">
                                Daily reminder
                            </p>

                            <p className="text-sm text-blue-700 mt-1">
                                Mark today's attendance after your last class.
                            </p>
                        </div>
                    </div>

                    {!lowAttendanceSubjects.length ? (
                        <Empty text="Great work - no low-attendance alerts right now." />
                    ) : (
                        lowAttendanceSubjects.map((subject) => {
                            const percentage = Math.round(
                                (subject.attended * 100) / subject.total
                            );

                            const target =
                                subject.goalPercentage ||
                                subject.minAttendance ||
                                75;

                            return (
                                <div
                                    key={subject._id}
                                    className="bg-red-50 border border-red-200 rounded-3xl p-5 flex gap-4"
                                >
                                    <TriangleAlert className="text-red-600 shrink-0" />

                                    <div>
                                        <p className="font-bold text-red-900">
                                            Low attendance: {subject.name}
                                        </p>

                                        <p className="text-sm text-red-700 mt-1">
                                            You are at {percentage}%, below your {target}% goal.
                                            Attend the next classes regularly.
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </>
            )}
        </div>
    );
}