import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    Home, PlusCircle, CheckSquare, LogOut, Menu,
    CalendarDays, Calculator, User, BarChart3,
    History, FileText, Target, Bell
} from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Timetable', href: '/timetable', icon: CalendarDays },
        { name: 'Add Subject', href: '/add-subject', icon: PlusCircle },
        { name: 'Mark Attendance', href: '/mark-attendance', icon: CheckSquare },
        { name: 'Calculators', href: '/calculators', icon: Calculator },

        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'History', href: '/history', icon: History },
        { name: 'Reports', href: '/reports', icon: FileText },
        { name: 'Goals', href: '/goals', icon: Target },
        { name: 'Alerts', href: '/notifications', icon: Bell },

        { name: 'Profile', href: '/profile', icon: User }
    ];

    return (
        <div className="flex h-screen bg-slate-50">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center h-16 px-6 border-b border-slate-200">
                        <h1 className="text-xl font-black text-blue-600 flex items-center">
                            <span className="bg-blue-600 text-white p-1 rounded mr-2">
                                <CheckSquare size={16} />
                            </span>
                            Attendwise
                        </h1>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                            Menu
                        </p>

                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const active = location.pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${active
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <Icon
                                        className={`w-5 h-5 mr-3 ${active ? 'text-blue-100' : 'text-slate-400'
                                            }`}
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-200">
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                window.location.href = '/';
                            }}
                            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="lg:hidden flex items-center h-16 px-4 bg-white border-b border-slate-200">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 mr-2 text-slate-500"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <span className="text-lg font-bold text-blue-600">
                        Attendwise
                    </span>
                </header>

                <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}