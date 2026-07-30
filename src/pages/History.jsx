import { useEffect, useState } from 'react';
import { Download, History as HistoryIcon, Search } from 'lucide-react';
import api from '../lib/api';
import { Empty, Loading, Title } from './Analytics';

function exportCSV(records) {
    const rows = [
        'Date,Subject,Status',
        ...records.map((record) => {
            const date = new Date(record.date).toLocaleDateString();
            const subject = record.subjectId?.name || 'Deleted subject';

            return [date, subject, record.status]
                .map((item) => `"${String(item).replaceAll('"', '""')}"`)
                .join(',');
        })
    ];

    const blob = new Blob([rows.join('\n')], {
        type: 'text/csv;charset=utf-8'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'attendwise-history.csv';
    link.click();

    URL.revokeObjectURL(link.href);
}

export default function History() {
    const [records, setRecords] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        start: '',
        end: '',
        subjectId: '',
        search: ''
    });

    const loadHistory = async () => {
        setLoading(true);

        try {
            const params = {};

            if (filters.start) params.start = filters.start;
            if (filters.end) params.end = filters.end;
            if (filters.subjectId) params.subjectId = filters.subjectId;

            const response = await api.get('/attendance/history', { params });
            setRecords(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        api.get('/subjects')
            .then((response) => setSubjects(response.data))
            .catch(console.error);

        loadHistory();
    }, []);

    const visibleRecords = records.filter((record) => {
        const searchable = `
            ${record.subjectId?.name || ''}
            ${record.status}
            ${new Date(record.date).toLocaleDateString()}
        `.toLowerCase();

        return searchable.includes(filters.search.toLowerCase());
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Title
                icon={HistoryIcon}
                title="Attendance history"
                text="Search, filter and export your attendance records."
            />

            <section className="bg-white rounded-3xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <input
                    type="date"
                    value={filters.start}
                    onChange={(e) =>
                        setFilters({ ...filters, start: e.target.value })
                    }
                    className="field"
                />

                <input
                    type="date"
                    value={filters.end}
                    onChange={(e) =>
                        setFilters({ ...filters, end: e.target.value })
                    }
                    className="field"
                />

                <select
                    value={filters.subjectId}
                    onChange={(e) =>
                        setFilters({ ...filters, subjectId: e.target.value })
                    }
                    className="field"
                >
                    <option value="">All subjects</option>

                    {subjects.map((subject) => (
                        <option key={subject._id} value={subject._id}>
                            {subject.name}
                        </option>
                    ))}
                </select>

                <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 text-slate-400" />

                    <input
                        value={filters.search}
                        onChange={(e) =>
                            setFilters({ ...filters, search: e.target.value })
                        }
                        placeholder="Search"
                        className="field pl-9"
                    />
                </div>

                <div className="flex gap-2">
                    <button onClick={loadHistory} className="btn flex-1">
                        Filter
                    </button>

                    <button
                        onClick={() => exportCSV(visibleRecords)}
                        className="btn-secondary"
                        title="Download CSV"
                    >
                        <Download size={18} />
                    </button>
                </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <Loading />
                ) : !visibleRecords.length ? (
                    <Empty text="No attendance records match these filters." />
                ) : (
                    <div className="divide-y divide-slate-100">
                        {visibleRecords.map((record) => (
                            <div
                                key={record._id}
                                className="p-4 sm:px-6 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-bold text-slate-800">
                                        {record.subjectId?.name || 'Deleted subject'}
                                    </p>

                                    <p className="text-sm text-slate-400">
                                        {new Date(record.date).toLocaleDateString(
                                            undefined,
                                            { dateStyle: 'medium' }
                                        )}
                                    </p>
                                </div>

                                <span
                                    className={`px-3 py-1 rounded-full font-bold text-sm ${record.status === 'present'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}
                                >
                                    {record.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}