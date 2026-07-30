import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AddSubject from './pages/AddSubject';
import MarkAttendance from './pages/MarkAttendance';
import Timetable from './pages/Timetable';
import Calculators from './pages/Calculators';
import Profile from './pages/Profile';

import Analytics from './pages/Analytics';
import History from './pages/History';
import Reports from './pages/Reports';
import Goals from './pages/Goals';
import Notifications from './pages/Notifications';
import ForgotPassword from './pages/ForgotPassword';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/timetable" element={<Timetable />} />
                    <Route path="/add-subject" element={<AddSubject />} />
                    <Route path="/mark-attendance" element={<MarkAttendance />} />
                    <Route path="/calculators" element={<Calculators />} />
                    <Route path="/profile" element={<Profile />} />

                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/notifications" element={<Notifications />} />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;