import { useEffect, useState } from 'react';
import { Target } from 'lucide-react';
import api from '../lib/api';
import { Empty, Loading, Title } from './Analytics';

export default function Goals() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const loadSubjects = () => {
        setLoading(true);

        api.get('/subjects')
            .then((response) => setSubjects(response.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadSubjects();
    }, []);

    const saveGoal = async (subject) => {
        try {
            await api.put(`/subjects/${subject._id}`, {
                goalPercentage: Number(subject.goalPercentage)
            });

            setMessage('Goal updated successfully');

            setTimeout(() => setMessage(''), 2000);
            loadSubjects();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Title
                icon={Target}
                title="Attendance goals"
                text="Set a target percentage for every subject."
            />

            {message && <div className="notice-success">{message}</div>}

            {loading ? (
                <Loading />
            ) : !subjects.length ? (
                <Empty text="Add a subject first to create attendance goals." />
            ) : (
                <div className="space-y-4">
                    {subjects.map((subject) => {
                        const percentage = subject.total
                            ? Math.round(
                                (subject.attended * 100) / subject.total
                            )
                            : 0;

                        const goal = Number(
                            subject.goalPercentage || subject.minAttendance || 75
                        );

                        const requiredClasses = Math.max(
                            0,
                            Math.ceil(
                                (goal * subject.total - 100 * subject.attended) /
                                (100 - goal || 1)
                            )
                        );

                        return (
                            <div
                                key={subject._id}
                                className="bg-white rounded-3xl border border-slate-200 p-6"
                            >
                                <div className="flex flex-wrap justify-between gap-4">
                                    <div>
                                        <h2 className="font-extrabold text-slate-800">
                                            {subject.name}
                                        </h2>

                                        <p className="text-sm text-slate-500 mt-1">
                                            Current: {percentage}% -
                                            {' '}
                                            {requiredClasses
                                                ? `Attend next ${requiredClasses} class${requiredClasses > 1 ? 'es' : ''} to reach your goal`
                                                : 'Goal achieved!'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={subject.goalPercentage || 75}
                                            onChange={(e) =>
                                                setSubjects(
                                                    subjects.map((item) =>
                                                        item._id === subject._id
                                                            ? {
                                                                ...item,
                                                                goalPercentage: e.target.value
                                                            }
                                                            : item
                                                    )
                                                )
                                            }
                                            className="field w-20"
                                        />

                                        <span className="font-bold text-slate-500">
                                            %
                                        </span>

                                        <button
                                            onClick={() => saveGoal(subject)}
                                            className="btn"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>

                                <div className="h-3 rounded-full bg-slate-100 overflow-hidden mt-5">
                                    <div
                                        className="h-full bg-blue-600"
                                        style={{
                                            width: `${Math.min(percentage, 100)}%`
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}