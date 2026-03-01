import { useEffect, useMemo, useState } from "react";
import { useUsersStore } from "../store/users.store";
import { formatSize, SizeUnits } from "../utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { HardDrive, Download, Eye, FileType, RefreshCw } from "lucide-react";
import { mockDownloads, mockViews } from "../services/mockData";
import { getTopDownloaded, getTopViewed, getTopUsers } from "../services/analytics.service";
import { TopUser } from "../types";

export const Analytics = () => {
    const { loading } = useUsersStore();

    // New states for real API data
    const [topDownloadedData, setTopDownloadedData] = useState<any[]>([]);
    const [topViewedData, setTopViewedData] = useState<any[]>([]);
    const [topUsersData, setTopUsersData] = useState<TopUser[]>([]);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const [downloadedRes, viewedRes, topUsersRes] = await Promise.all([
                getTopDownloaded({ limit: 10 }),
                getTopViewed({ limit: 10 }),
                getTopUsers({ limit: 10 })
            ]);
            setTopDownloadedData(downloadedRes.data || []);
            setTopViewedData(viewedRes.data || []);
            setTopUsersData(topUsersRes.data || []);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fileTypeViews = useMemo(() => {
        const counts: Record<string, number> = {};
        mockViews.forEach(v => { counts[v.fileType || 'unknown'] = (counts[v.fileType || 'unknown'] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, []);

    const fileTypeDownloads = useMemo(() => {
        const counts: Record<string, number> = {};
        mockDownloads.forEach(d => { counts[d.fileType || 'unknown'] = (counts[d.fileType || 'unknown'] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, []);

    if (loading || analyticsLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-pulse flex flex-col items-center space-y-4">
                    <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                    <div className="text-slate-500 font-medium">Loading analytics...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Global Analytics</h2>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => { fetchAnalytics(); }}
                    title="Refresh analytics data"
                >
                    <RefreshCw className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg dark:bg-blue-900/40"><FileType className="w-5 h-5" /></div>
                            Most Viewed File Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 pt-2">
                            {fileTypeViews.map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                                    <Badge variant="outline" className="font-mono bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-3 py-1">{type}</Badge>
                                    <div className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm">{count} views</div>
                                </div>
                            ))}
                            {fileTypeViews.length === 0 && <div className="text-slate-500">No data</div>}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg dark:bg-emerald-900/40"><FileType className="w-5 h-5" /></div>
                            Most Downloaded File Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 pt-2">
                            {fileTypeDownloads.map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                                    <Badge variant="outline" className="font-mono bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-3 py-1">{type}</Badge>
                                    <div className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm">{count} downloads</div>
                                </div>
                            ))}
                            {fileTypeDownloads.length === 0 && <div className="text-slate-500">No data</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4">

                <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <HardDrive className="w-5 h-5 text-purple-600" /> Top Storage
                        </CardTitle>
                        <CardDescription>Highest storage consumers</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/80">
                                <TableRow>
                                    <TableHead className="pl-6">User</TableHead>
                                    <TableHead className="text-right pr-6">Storage Used</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topUsersData.map((user) => (
                                    <TableRow key={user.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                        <TableCell className="pl-6 max-w-[150px] sm:max-w-[200px]">
                                            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate" title={user.name}>{user.name}</div>
                                            <div className="text-xs text-slate-500 truncate" title={user.email}>{user.email}</div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 font-bold text-lg text-purple-600 dark:text-purple-400">
                                            {formatSize(user.totalStorageBytes, SizeUnits.Bytes)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {topUsersData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-slate-500 py-4">No storage data available</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Eye className="w-5 h-5 text-orange-600" /> Top Views
                        </CardTitle>
                        <CardDescription>Highest link view counts</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/80">
                                <TableRow>
                                    <TableHead className="pl-6">User</TableHead>
                                    <TableHead className="text-right pr-6">Total Views</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topViewedData.map((item: any, idx: number) => (
                                    <TableRow key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                        <TableCell className="pl-6 max-w-[150px] sm:max-w-[200px]">
                                            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate" title={item.name || "Unknown File"}>{item.name || "Unknown File"}</div>
                                            <div className="text-xs text-slate-500 truncate capitalize">{item?.sourceType.toLowerCase() || ""}</div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 font-bold text-lg text-orange-600 dark:text-orange-400">
                                            {item.viewCount || 0}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {topViewedData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-slate-500 py-4">No view data available</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Download className="w-5 h-5 text-teal-600" /> Top Downloads
                        </CardTitle>
                        <CardDescription>Highest download activity</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/80">
                                <TableRow>
                                    <TableHead className="pl-6">User</TableHead>
                                    <TableHead className="text-right pr-6">Total Downloads</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topDownloadedData.map((item: any, idx: number) => (
                                    <TableRow key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                        <TableCell className="pl-6 max-w-[150px] sm:max-w-[200px]">
                                            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate" title={item.name || "Unknown File"}>{item.name || "Unknown File"}</div>
                                            <div className="text-xs text-slate-500 truncate capitalize">{item?.sourceType.toLowerCase() || ""}</div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 font-bold text-lg text-teal-600 dark:text-teal-400">
                                            {item.downloadCount || 0}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {topDownloadedData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-slate-500 py-4">No download data available</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};
