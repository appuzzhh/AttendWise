import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

import api from '../lib/api';
import { Empty, Loading, Title } from './Analytics';

function exportCSV(report) {
    const rows = [
        'Subject,Attended,Total Classes,Attendance %,Goal %',
        ...report.subjects.map(
            (subject) =>
                `${subject.name},${subject.attended},${subject.total},${subject.percentage}%,${subject.goalPercentage}%`
        )
    ];

    const blob = new Blob([rows.join('\n')], {
        type: 'text/csv;charset=utf-8'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendwise-${report.period}-report.csv`;
    link.click();

    URL.revokeObjectURL(link.href);
}

function exportPDF(report) {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Attendwise Attendance Report', 14, 20);

    doc.setFontSize(11);
    doc.text(
        `${report.period.toUpperCase()} SUMMARY - Overall attendance: ${report.overallPercentage}%`,
        14,
        29
    );

    autoTable(doc, {
        startY: 37,
        head: [['Subject', 'Attended', 'Total', 'Attendance', 'Goal']],
        body: report.subjects.map((subject) => [
            subject.name,
            subject.attended,
            subject.total,
            `${subject.percentage}%`,
            `${subject.goalPercentage}%`
        ]),
        headStyles: {
            fillColor: [37, 99, 235]
        }
    });

    doc.save(`attendwise-${report.period}-report.pdf`);
}

function Metric({ label, value }) {
    return (
        <div className="bg-slate-50 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="text-2xl font-black text-slate-800 mt-1">
                {value}
            </p>
        </div>
    );
}

export default function Reports() {
    const [period, setPeriod] = useState('month');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadReport = () => {
        setLoading(true);

        api.get('/attendance/report', { params: { period } })
            .then((response) => setReport(response.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadReport();
    }, [period]);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Title
                icon={FileText}
                title="Reports"
                text="Weekly, monthly and semester attendance summaries."
            />

            <div className="flex flex-wrap gap-3 justify-between">
                <div className="flex gap-2">
                    {['week', 'month', 'semester'].map((item) => (
                        <button
                            key={item}
                            onClick={() => setPeriod(item)}
                            className={
                                period === item
                                    ? 'btn capitalize'
                                    : 'btn-secondary capitalize'
                            }
                        >
                            {item}
                        </button>
                    ))}
                </div>

                {report && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => exportCSV(report)}
                            className="btn-secondary"
                        >
                            <Download size={17} />
                            CSV
                        </button>

                        <button
                            onClick={() => exportPDF(report)}
                            className="btn"
                        >
                            <Download size={17} />
                            PDF
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <Loading />
            ) : (
                <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    {!report?.subjects?.length ? (
                        <Empty text="No attendance was recorded in this period." />
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-3 mb-7">
                                <Metric
                                    label="Overall"
                                    value={`${report.overallPercentage}%`}
                                />
                                <Metric label="Present" value={report.attended} />
                                <Metric label="Classes" value={report.total} />
                            </div>

                            <div className="divide-y divide-slate-100">
                                {report.subjects.map((subject) => (
                                    <div
                                        key={subject.subjectId}
                                        className="py-4 flex justify-between gap-4"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-800">
                                                {subject.name}
                                            </p>

                                            <p className="text-sm text-slate-400">
                                                {subject.attended} of {subject.total} classes
                                            </p>
                                        </div>

                                        <p
                                            className={
                                                subject.percentage >=
                                                    subject.goalPercentage
                                                    ? 'font-black text-green-600'
                                                    : 'font-black text-red-600'
                                            }
                                        >
                                            {subject.percentage}%
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}