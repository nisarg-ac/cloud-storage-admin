import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUsersStore } from "../store/users.store";
import { calculateUserStorage, formatDate, formatSize, SizeUnits } from "../utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ArrowLeft, User as UserIcon, Shield, Mail, Phone, Calendar, HardDrive, FileText, Image, Video, Music, Archive, Trash2, RefreshCw, ChevronRight, Eye } from "lucide-react";
import { useAuthStore, isSuperAdmin } from "../store/auth.store";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export const UserDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fetchUserDetails, selectedUser, loading, error } = useUsersStore();
    const user = useAuthStore(state => state.user);
    const superAdmin = isSuperAdmin(user);

    useEffect(() => {
        if (id) {
            fetchUserDetails(id);
        }
    }, [id, fetchUserDetails]);

    if (loading || !selectedUser) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-pulse flex flex-col items-center space-y-4">
                    <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                    <div className="text-slate-500 font-medium">Loading user profile...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-red-500 bg-red-50 border border-red-100 rounded-lg">{error}</div>;
    }

    const storage = calculateUserStorage(selectedUser);

    const getChartData = () => {
        return [
            { name: 'Images', value: storage.breakdown.images },
            { name: 'Videos', value: storage.breakdown.videos },
            { name: 'Audio', value: storage.breakdown.audio },
            { name: 'Zip', value: storage.breakdown.zip },
            { name: 'Documents', value: storage.breakdown.documents },
            { name: 'Trash', value: storage.trashBytes }
        ].filter(item => item.value > 0);
    };

    const chartData = getChartData();

    const engagementData = [
        { name: 'Engagement', Views: selectedUser?.totalViews, Downloads: selectedUser?.totalDownloads, Affiliates: selectedUser?.referenceUserCount }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">User Details</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200"
                        onClick={() => navigate(`/revenue/users/${id}`)}
                    >
                        Earning Profile
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => id && fetchUserDetails(id)}
                        title="Refresh user data"
                    >
                        <RefreshCw className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Section */}
                <Card className="md:col-span-1 border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950">
                    <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 relative rounded-2xl shadow-sm overflow-hidden flex-shrink-0">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                                        {(selectedUser.name ?? '?').charAt(0)}
                                    </div>
                                    {selectedUser.profilePic && (
                                        <img
                                            src={selectedUser.profilePic}
                                            alt={selectedUser.name}
                                            className="absolute inset-0 h-full w-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                                <div>
                                    <CardTitle className="text-xl">{selectedUser.name}</CardTitle>
                                    <CardDescription className="text-xs uppercase tracking-wider mt-1 font-medium">ID: {selectedUser.id}</CardDescription>
                                </div>
                            </div>
                            {selectedUser.isAdmin && <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md shrink-0">
                                <Mail className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="flex-1 font-medium truncate" title={selectedUser.email || 'N/A'}>{selectedUser.email || 'N/A'}</span>
                            {selectedUser.isEmailVerified ? (
                                <Badge variant="secondary" className="shrink-0 bg-green-100/60 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-normal">Verified</Badge>
                            ) : (
                                <Badge variant="outline" className="shrink-0 text-slate-500 dark:text-slate-400 font-normal">Unverified</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md shrink-0">
                                <Phone className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="flex-1 font-medium truncate" title={`${selectedUser.countryCode || ''} ${selectedUser.phoneNumber || ''}`.trim() || 'N/A'}>{selectedUser.countryCode} {selectedUser.phoneNumber || 'N/A'}</span>
                            {selectedUser.isPhoneVerified ? (
                                <Badge variant="secondary" className="shrink-0 bg-green-100/60 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-normal">Verified</Badge>
                            ) : (
                                <Badge variant="outline" className="shrink-0 text-slate-500 dark:text-slate-400 font-normal">Unverified</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                                <Calendar className="h-4 w-4 text-slate-500" />
                            </div>
                            <span>Joined: <span className="font-medium">{formatDate(selectedUser.createdAt)}</span></span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                                <UserIcon className="h-4 w-4 text-slate-500" />
                            </div>
                            <span>Status:
                                <span className={`ml-2 font-semibold ${!selectedUser.deletedAt ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                    {!selectedUser.deletedAt ? "Active" : "Soft Deleted"}
                                </span>
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Engagement Section */}
                <Card className="md:col-span-2 border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950">
                    <CardHeader>
                        <CardTitle>Engagement Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-orange-50/50 dark:bg-orange-950/20 p-5 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                <div className="text-orange-600/80 dark:text-orange-500/80 font-semibold text-xs tracking-wider uppercase mb-1">Total Views</div>
                                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{selectedUser?.totalViews}</div>
                            </div>
                            <div className="bg-teal-50/50 dark:bg-teal-950/20 p-5 rounded-2xl border border-teal-100 dark:border-teal-900/30">
                                <div className="text-teal-600/80 dark:text-teal-500/80 font-semibold text-xs tracking-wider uppercase mb-1">Total Downloads</div>
                                <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">{selectedUser?.totalDownloads}</div>
                            </div>
                            <div
                                className="bg-purple-50/50 dark:bg-purple-950/20 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/30 cursor-pointer hover:bg-purple-100/60 dark:hover:bg-purple-950/40 transition-colors relative"
                                onClick={() => navigate(`/user/${id}/affiliates`)}
                            >
                                <div className="font-semibold text-xs tracking-wider uppercase mb-1" style={{ color: '#9333ea99' }}>Affiliates</div>
                                <div className="text-3xl font-bold" style={{ color: '#9333ea' }}>{selectedUser?.referenceUserCount}</div>
                                <Eye className="absolute top-3 right-3 w-4 h-4 opacity-40" style={{ color: '#9333ea' }} />
                            </div>
                        </div>

                        <div className="h-[200px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
                                <BarChart data={engagementData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" hide />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Legend iconType="circle" />
                                    <Bar dataKey="Views" fill="#f97316" radius={[0, 6, 6, 0]} maxBarSize={30} />
                                    <Bar dataKey="Downloads" fill="#14b8a6" radius={[0, 6, 6, 0]} maxBarSize={30} />
                                    <Bar dataKey="Affiliates" fill="#9333ea" radius={[0, 6, 6, 0]} maxBarSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Storage Breakdown Section */}
                <Card className="md:col-span-3 border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950 mt-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                                <HardDrive className="w-5 h-5" />
                            </div>
                            Storage Space & Files
                        </CardTitle>
                        <CardDescription>
                            User limit: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatSize(selectedUser.storageLimitInBytes, SizeUnits.Bytes)}</span> capacity
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-8 items-center pt-2">

                            <div className="w-full md:w-1/2 h-[350px]">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={300}>
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={90}
                                                outerRadius={120}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {chartData.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number | undefined) => [(((value || 0) / (1024 * 1024 * 1024)).toFixed(2)) + ' GB', 'Amount']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Legend iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Archive className="w-12 h-12 mb-3 opacity-20" />
                                        <p>No storage data</p>
                                    </div>
                                )}
                            </div>

                            <div className="w-full md:w-1/2 space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Used</div>
                                            <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                                                {formatSize(selectedUser.totalUsedStorageBytes, SizeUnits.Bytes)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Remaining</div>
                                            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                                                {formatSize(Math.max(0, selectedUser.storageLimitInBytes - selectedUser.totalUsedStorageBytes), SizeUnits.Bytes)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        {[
                                            { label: "Images", fileType: "images", size: storage.breakdown.images, icon: <Image className="w-4 h-4 text-blue-600" />, iconBg: "bg-blue-100 dark:bg-blue-900/50" },
                                            { label: "Videos", fileType: "videos", size: storage.breakdown.videos, icon: <Video className="w-4 h-4 text-emerald-600" />, iconBg: "bg-emerald-100 dark:bg-emerald-900/50" },
                                            { label: "Audio", fileType: "audio", size: storage.breakdown.audio, icon: <Music className="w-4 h-4 text-amber-600" />, iconBg: "bg-amber-100 dark:bg-amber-900/50" },
                                            { label: "Zip", fileType: "zip", size: storage.breakdown.zip, icon: <Archive className="w-4 h-4 text-rose-600" />, iconBg: "bg-rose-100 dark:bg-rose-900/50" },
                                            { label: "Documents", fileType: "documents", size: storage.breakdown.documents, icon: <FileText className="w-4 h-4 text-indigo-600" />, iconBg: "bg-indigo-100 dark:bg-indigo-900/50" },
                                        ].map(({ label, fileType, size, icon, iconBg }) => (
                                            <div
                                                key={fileType}
                                                className={`flex justify-between text-sm items-center p-1.5 -mx-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${superAdmin ? "cursor-pointer" : ""}`}
                                                onClick={() => superAdmin && navigate(`/user/${id}/files/${fileType}`)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 ${iconBg} rounded-md`}>{icon}</div>
                                                    <span className="font-medium">{label}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{formatSize(size, SizeUnits.Bytes)}</span>
                                                    {superAdmin && <ChevronRight className="w-4 h-4 text-slate-400" />}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-3 mt-3 border-t border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 -mx-1.5 rounded-lg transition-colors">
                                            <div className="flex justify-between text-sm items-center opacity-80">
                                                <div className="flex items-center gap-3"><div className="p-1.5 bg-slate-200 dark:bg-slate-800 rounded-md"><Trash2 className="w-4 h-4 text-slate-600 dark:text-slate-400" /></div> <span className="font-medium">Trash</span></div>
                                                <span className="font-semibold text-slate-600 dark:text-slate-400">{formatSize(storage.trashBytes, SizeUnits.Bytes)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
