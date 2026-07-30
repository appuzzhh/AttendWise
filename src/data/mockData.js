export const mockUser = {
    name: "Abhijith VS",
    semester: "S5",
    registerNumber: "JIT24CS004",
    labBatch: "Batch 1" // Batch 1 or Batch 2
};

export const subjects = {
    CN: "Computer Networks",
    MC: "Microcontroller",
    ML: "Machine Learning",
    DAA: "Design and Analysis of Algorithm",
    SPM: "Software Project Management",
    NON_TRACKABLE: "NON_TRACKABLE"
};

export const mockAttendanceStats = [
    { id: 1, name: subjects.CN, attended: 22, total: 25 },
    { id: 2, name: subjects.MC, attended: 18, total: 20 },
    { id: 3, name: subjects.ML, attended: 15, total: 18 },
    { id: 4, name: subjects.DAA, attended: 20, total: 24 },
    { id: 5, name: subjects.SPM, attended: 19, total: 22 },
];

export const periodsMetadata = [
    { id: 1, name: "Period 1", time: "9:00 - 9:50" },
    { id: 2, name: "Period 2", time: "9:50 - 10:40" },
    { id: 'break1', name: "Break", time: "10:40 - 10:50", isBreak: true },
    { id: 3, name: "Period 3", time: "10:50 - 11:40" },
    { id: 4, name: "Period 4", time: "11:40 - 12:30" },
    { id: 'lunch', name: "Lunch Break", time: "12:30 - 1:15", isBreak: true },
    { id: 5, name: "Period 5", time: "1:15 - 2:05" },
    { id: 6, name: "Period 6", time: "2:05 - 2:55" },
    { id: 'break2', name: "Break", time: "2:55 - 3:05", isBreak: true },
    { id: 7, name: "Period 7", time: "3:05 - 4:00" }
];

export const weeklyTimetable = {
    Monday: {
        1: subjects.MC,
        2: subjects.CN,
        3: subjects.CN,
        4: subjects.DAA,
        5: subjects.DAA,
        6: subjects.ML,
        7: subjects.SPM
    },
    Tuesday: {
        1: subjects.DAA,
        2: subjects.ML,
        3: subjects.MC,
        4: subjects.CN,
        5: (batch) => batch === "Batch 1" ? subjects.CN : subjects.ML,
        6: (batch) => batch === "Batch 1" ? subjects.CN : subjects.ML,
        7: (batch) => batch === "Batch 1" ? subjects.CN : subjects.ML
    },
    Wednesday: {
        1: subjects.DAA,
        2: subjects.ML,
        3: subjects.MC,
        4: subjects.DAA,
        5: subjects.SPM,
        6: subjects.ML,
        7: subjects.SPM
    },
    Thursday: {
        1: subjects.SPM,
        2: subjects.MC,
        3: subjects.DAA,
        4: subjects.CN,
        5: (batch) => batch === "Batch 1" ? subjects.ML : subjects.CN,
        6: (batch) => batch === "Batch 1" ? subjects.ML : subjects.CN,
        7: (batch) => batch === "Batch 1" ? subjects.ML : subjects.CN
    },
    Friday: {
        1: subjects.SPM,
        2: subjects.ML,
        3: subjects.CN,
        4: subjects.MC,
        5: subjects.NON_TRACKABLE,  // Remedial Class
        6: subjects.DAA,
        7: subjects.NON_TRACKABLE   // Club Activity
    }
};

export const getSubjectsForDay = (day, batch) => {
    const daySchedule = weeklyTimetable[day];
    if (!daySchedule) return [];

    const result = [];
    for (let i = 1; i <= 7; i++) {
        let sub = daySchedule[i];
        if (typeof sub === 'function') {
            sub = sub(batch);
        }
        result.push({ period: i, subject: sub });
    }
    return result;
};
