import { useState, useEffect } from "react";
import { useAnalyticsStore } from "../store/analytics.store";
import { useAuthStore, isSuperAdmin } from "../store/auth.store";
import { ADMIN_DASHBOARD_VISIBILITY } from "../config/dashboardConfig";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, HardDrive, Eye } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, Legend } from "recharts";
import { bytesToGB } from "../utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, subDays } from "date-fns";

const SummaryCards = () => {
    const summary = useAnalyticsStore(state => state.dashboardStats?.summary);
    const user = useAuthStore(state => state.user);
    const superAdmin = isSuperAdmin(user);

    const visible = (key: keyof typeof ADMIN_DASHBOARD_VISIBILITY) =>
        superAdmin || ADMIN_DASHBOARD_VISIBILITY[key];

    if (!summary) return null;

    const statCards = [
        { title: "Total Users", value: summary.totalUsers, icon: Users, color: "text-blue-600", settingKey: "totalUsers" as const },
        { title: "Total Storage", value: `${bytesToGB(summary.totalStorageBytes)} GB`, icon: HardDrive, color: "text-purple-600", settingKey: "totalStorage" as const },
        { title: "Shared Link Views", value: summary.totalSharedLinkViews, icon: Eye, color: "text-orange-600", settingKey: "sharedLinkViews" as const },
    ].filter(s => visible(s.settingKey));

    return (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
            {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <Card key={index} className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950 transition-all hover:shadow-md hover:ring-slate-300 dark:hover:ring-slate-700">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-slate-500">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-full bg-slate-50 dark:bg-slate-900 ${stat.color}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

const NewUsersTrendSection = () => {
    const fetchDashboardStats = useAnalyticsStore(state => state.fetchDashboardStats);
    const trendData = useAnalyticsStore(state => state.dashboardStats?.trends.newUsersTrend);
    const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({
        start: subDays(new Date(), 6),
        end: new Date()
    });

    const data = trendData?.map((t) => ({
        name: format(new Date(t.date), 'MMM dd'),
        users: t.userCount,
    })) || [];

    const handleRangeChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setRange({ start, end });
        if (start && end) {
            fetchDashboardStats({
                newUsersTrendStartDate: format(start, 'yyyy-MM-dd'),
                newUsersTrendEndDate: format(end, 'yyyy-MM-dd'),
            });
        }
    };

    return (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-md">New Users Trend</CardTitle>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
                    <DatePicker
                        selectsRange={true}
                        startDate={range.start}
                        endDate={range.end}
                        onChange={(update) => handleRangeChange(update as [Date | null, Date | null])}
                        className="bg-transparent text-[11px] outline-none w-[190px] px-1 cursor-pointer font-medium"
                        dateFormat="MMM dd, yyyy"
                        maxDate={new Date()}
                        placeholderText="Select range"
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                            <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} name="New Users" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

const UsersTrendSection = () => {
    const fetchDashboardStats = useAnalyticsStore(state => state.fetchDashboardStats);
    const trendData = useAnalyticsStore(state => state.dashboardStats?.trends.usersTrend);
    const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({
        start: subDays(new Date(), 6),
        end: new Date()
    });

    const data = trendData?.map((t) => ({
        name: format(new Date(t.date), 'MMM dd'),
        active: t.activeCount,
        deleted: t.deletedCount,
    })) || [];

    const handleRangeChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setRange({ start, end });
        if (start && end) {
            fetchDashboardStats({
                usersTrendStartDate: format(start, 'yyyy-MM-dd'),
                usersTrendEndDate: format(end, 'yyyy-MM-dd'),
            });
        }
    };

    return (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-md">Active & Deleted Users Trend</CardTitle>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
                    <DatePicker
                        selectsRange={true}
                        startDate={range.start}
                        endDate={range.end}
                        onChange={(update) => handleRangeChange(update as [Date | null, Date | null])}
                        className="bg-transparent text-[11px] outline-none w-[190px] px-1 cursor-pointer font-medium"
                        dateFormat="MMM dd, yyyy"
                        maxDate={new Date()}
                        placeholderText="Select range"
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorDeleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                            <Area type="monotone" dataKey="active" stroke="#4ade80" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" name="Active" />
                            <Area type="monotone" dataKey="deleted" stroke="#f87171" strokeWidth={2} fillOpacity={1} fill="url(#colorDeleted)" name="Deleted" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

const StorageTrendSection = () => {
    const trendData = useAnalyticsStore(state => state.dashboardStats?.trends.storageUsageTrend);
    const data = trendData?.map((t) => ({
        name: format(new Date(t.month), 'MMM'),
        gb: t.storageGB,
    })) || [];

    return (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950">
            <CardHeader>
                <CardTitle className="text-md">Storage Usage Trend (GB)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorGb" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                            <Area type="monotone" dataKey="gb" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorGb)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

const FileViewsTrendSection = () => {
    const trendData = useAnalyticsStore(state => state.dashboardStats?.trends.fileViewsTrend);
    const visible = useAnalyticsStore(() => {
        const user = useAuthStore.getState().user;
        const superAdmin = isSuperAdmin(user);
        return superAdmin || ADMIN_DASHBOARD_VISIBILITY["fileViewsTrend"];
    });

    if (!visible) return null;

    const data = trendData?.map((t) => ({
        name: format(new Date(t.month), 'MMM'),
        views: t.viewCount,
    })) || [];

    return (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950">
            <CardHeader>
                <CardTitle className="text-md">File Views Trend (12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                            <Bar dataKey="views" fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export const Dashboard = () => {
    const { dashboardStats, fetchDashboardStats, loading } = useAnalyticsStore();

    useEffect(() => {
        if (!dashboardStats) {
            fetchDashboardStats();
        }
    }, [fetchDashboardStats, dashboardStats]);

    if (loading || !dashboardStats) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse space-y-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />)}
                    </div>
                    <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <style>
                {`
                .react-datepicker-popper {
                    z-index: 50 !important;
                }
                `}
            </style>

            <SummaryCards />

            <div className="grid gap-6 md:grid-cols-2">
                <NewUsersTrendSection />
                <UsersTrendSection />
                <StorageTrendSection />
                <FileViewsTrendSection />
            </div>
        </div>
    );
};
