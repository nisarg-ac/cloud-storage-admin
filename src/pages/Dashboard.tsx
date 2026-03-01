import { useEffect } from "react";
import { useAnalyticsStore } from "../store/analytics.store";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, HardDrive, Eye, Download, UserCheck, UserX } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { bytesToGB } from "../utils";

export const Dashboard = () => {
    const { dashboardStats, fetchDashboardStats, loading } = useAnalyticsStore();

    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);

    if (loading || !dashboardStats) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse space-y-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />)}
                    </div>
                    <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
                </div>
            </div>
        );
    }

    const statCards = [
        { title: "Total Users", value: dashboardStats.summary.totalUsers, icon: Users, color: "text-blue-600" },
        { title: "Active Users", value: dashboardStats.summary.activeUsers, icon: UserCheck, color: "text-green-600" },
        { title: "Deleted Users", value: dashboardStats.summary.deletedUsers, icon: UserX, color: "text-red-600" },
        { title: "Total Storage", value: `${bytesToGB(dashboardStats.summary.totalStorageBytes)} GB`, icon: HardDrive, color: "text-purple-600" },
        { title: "Shared Link Views", value: dashboardStats.summary.totalSharedLinkViews, icon: Eye, color: "text-orange-600" },
        { title: "Total Downloads", value: dashboardStats.summary.totalDownloads, icon: Download, color: "text-teal-600" },
    ];

    const storageData = dashboardStats.trends.storageUsageTrend?.map((t) => ({
        name: new Date(t.month).toLocaleString('default', { month: 'short' }),
        gb: t.storageGB,
    })) || [];

    const viewsData = dashboardStats.trends.fileViewsTrend?.map((t) => ({
        name: new Date(t.month).toLocaleString('default', { month: 'short' }),
        views: t.viewCount || 0,
    })) || [];

    const downloadsData = dashboardStats.trends.downloadsTrend?.map((t) => ({
        name: new Date(t.month).toLocaleString('default', { month: 'short' }),
        downloads: t.downloadCount || 0,
    })) || [];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                                    {stat.value}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 hover:shadow-sm">
                {/* Storage Usage Trend */}
                <Card className="col-span-1 lg:col-span-2 border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950">
                    <CardHeader>
                        <CardTitle>Storage Usage Trend (GB)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={storageData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorGb" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="gb" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorGb)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Downloads & Views charts */}
                <div className="space-y-6 flex flex-col justify-between">
                    <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 flex-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">File Views Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[100px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={viewsData}>
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="views" fill="#f97316" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 flex-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Downloads Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[100px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={downloadsData}>
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="downloads" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
