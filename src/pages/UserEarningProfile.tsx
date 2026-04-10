import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserEarningProfile, StatusMetrics, earningService } from '../services/earning.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, AlertTriangle, CheckCircle, Ban, DollarSign, Mail, Phone, Calendar, Shield, User as UserIcon, Eye, Layers, Zap, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { convertUnits, formatDate } from '../utils';
import * as userService from '../services/user.service';
import { User } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useMemo } from 'react';

type ActionType = 'suspend' | 'reinstate' | 'block-payouts' | 'unblock-payouts' | 'override-plan' | 'reject-pending-percentage' | null;

export const UserEarningProfileView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserEarningProfile | null>(null);
    const [fullUser, setFullUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [activeAction, setActiveAction] = useState<ActionType>(null);
    const [submitting, setSubmitting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // Form fields
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [blockCategory, setBlockCategory] = useState('OTHER');
    const [overridePlanId, setOverridePlanId] = useState('');
    const [resetSwitchCount, setResetSwitchCount] = useState(false);
    const [percentage, setPercentage] = useState(10);
    const [bulkReason, setBulkReason] = useState('FRAUD_CONFIRMED');
    const [showConfirmation, setShowConfirmation] = useState(false);

    const fetchProfile = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const [profileData, userData] = await Promise.all([
                earningService.getUserEarningProfile(id),
                userService.getUserById(id)
            ]);
            console.log("🚀 ~ fetchProfile ~ profileData:", profileData)
            setProfile(profileData);
            if (userData) setFullUser(userData);
        } catch (error) {
            console.error('Failed to fetch user earning profile', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const openAction = (action: ActionType) => {
        setReason('');
        setNote('');
        setOverridePlanId('');
        setResetSwitchCount(false);
        setPercentage(10);
        setBulkReason('FRAUD_CONFIRMED');
        setActionError(null);
        setActiveAction(action);
    };

    const closeDialog = () => {
        setShowConfirmation(false);
        setActiveAction(null);
        setActionError(null);
    };

    const handleSubmit = async () => {
        if (!profile) return;

        if (activeAction === 'reject-pending-percentage' && !showConfirmation) {
            setShowConfirmation(true);
            return;
        }

        setSubmitting(true);
        setActionError(null);
        try {
            if (activeAction === 'suspend') {
                if (!reason.trim()) { setActionError('Reason is required.'); setSubmitting(false); return; }
                await earningService.suspendEarning(profile.user.id, reason);
            } else if (activeAction === 'reinstate') {
                if (!note.trim()) { setActionError('Note is required.'); setSubmitting(false); return; }
                await earningService.reinstateEarning(profile.user.id, note);
            } else if (activeAction === 'block-payouts') {
                if (!reason.trim()) { setActionError('Reason is required.'); setSubmitting(false); return; }
                await earningService.blockPayouts(profile.user.id, reason, blockCategory);
            } else if (activeAction === 'unblock-payouts') {
                if (!note.trim()) { setActionError('Note is required.'); setSubmitting(false); return; }
                await earningService.unblockPayouts(profile.user.id, note);
            } else if (activeAction === 'override-plan') {
                if (!overridePlanId.trim()) { setActionError('Plan ID is required.'); setSubmitting(false); return; }
                if (!note.trim()) { setActionError('Override note is required.'); setSubmitting(false); return; }
                await earningService.overrideEarningPlan(profile.user.id, overridePlanId, resetSwitchCount, note);
            } else if (activeAction === 'reject-pending-percentage') {
                if (percentage < 1 || percentage > 100) { setActionError('Percentage must be between 1 and 100.'); setSubmitting(false); return; }
                const willReject = Math.floor((percentage / 100) * (profile.earningStatus.pending.count || 0));
                if (willReject === 0) { setActionError('Percentage results in 0 events to reject.'); setSubmitting(false); return; }
                await earningService.rejectPendingByPercentage(profile.user.id, {
                    percentage,
                    reason: bulkReason,
                    note: note.trim() || undefined
                });
            }
            closeDialog();
            fetchProfile();
        } catch (err: unknown) {
            const error = err as import('axios').AxiosError<{ message?: string }>;
            setActionError(error?.response?.data?.message || 'Action failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const engagementData = useMemo(() => {
        if (!fullUser) return [];
        return [
            { name: 'Engagement', Views: fullUser.totalViews, Downloads: fullUser.totalDownloads, Affiliates: fullUser.referenceUserCount }
        ];
    }, [fullUser]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-pulse flex flex-col items-center space-y-4">
                    <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                    <div className="text-slate-500 font-medium">Loading user profile...</div>
                </div>
            </div>
        );
    }
    if (!profile) return <div className="p-8 text-slate-500">Earning Profile not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-emerald-500" />
                        User Earning Profile
                    </h1>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {profile.user.earningSuspended ? (
                        <Button onClick={() => openAction('reinstate')} className="bg-emerald-600 hover:bg-emerald-700">
                            <CheckCircle className="w-4 h-4 mr-2" /> Reinstate Earning
                        </Button>
                    ) : (
                        <Button onClick={() => openAction('suspend')} variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50">
                            <AlertTriangle className="w-4 h-4 mr-2" /> Suspend Earning
                        </Button>
                    )}

                    {profile.user.payoutBlocked ? (
                        <Button onClick={() => openAction('unblock-payouts')} className="bg-blue-600 hover:bg-blue-700">
                            Unblock Payouts
                        </Button>
                    ) : (
                        <Button onClick={() => openAction('block-payouts')} variant="destructive">
                            <Ban className="w-4 h-4 mr-2" /> Block Payouts
                        </Button>
                    )}

                    <Button onClick={() => openAction('override-plan')} variant="outline">
                        Override Plan
                    </Button>
                </div>
            </div>

            {fullUser && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* Profile Section */}
                    <Card className="md:col-span-1 border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950">
                        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 relative rounded-2xl shadow-sm overflow-hidden flex-shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                                            {(fullUser.name ?? '?').charAt(0)}
                                        </div>
                                        {fullUser.profilePic && (
                                            <img
                                                src={fullUser.profilePic}
                                                alt={fullUser.name}
                                                className="absolute inset-0 h-full w-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <CardTitle className="text-xl truncate">{fullUser.name}</CardTitle>
                                        <CardDescription className="text-xs uppercase tracking-wider mt-1 font-medium truncate">ID: {fullUser.id.split('-')[0]}...</CardDescription>
                                    </div>
                                </div>
                                {fullUser.isAdmin && <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md shrink-0">
                                    <Mail className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="flex-1 font-medium truncate" title={fullUser.email || 'N/A'}>{fullUser.email || 'N/A'}</span>
                                {fullUser.isEmailVerified ? (
                                    <Badge variant="secondary" className="shrink-0 bg-green-100/60 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-normal">Verified</Badge>
                                ) : (
                                    <Badge variant="outline" className="shrink-0 text-slate-500 dark:text-slate-400 font-normal">Unverified</Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md shrink-0">
                                    <Phone className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="flex-1 font-medium truncate" title={`${fullUser.countryCode || ''} ${fullUser.phoneNumber || ''}`.trim() || 'N/A'}>{fullUser.countryCode} {fullUser.phoneNumber || 'N/A'}</span>
                                {fullUser.isPhoneVerified ? (
                                    <Badge variant="secondary" className="shrink-0 bg-green-100/60 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-normal">Verified</Badge>
                                ) : (
                                    <Badge variant="outline" className="shrink-0 text-slate-500 dark:text-slate-400 font-normal">Unverified</Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                                    <Calendar className="h-4 w-4 text-slate-500" />
                                </div>
                                <span>Joined: <span className="font-medium">{formatDate(fullUser.createdAt)}</span></span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                                    <UserIcon className="h-4 w-4 text-slate-500" />
                                </div>
                                <span>Status:
                                    <span className={`ml-2 font-semibold ${!fullUser.deletedAt ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                        {!fullUser.deletedAt ? "Active" : "Soft Deleted"}
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
                                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{fullUser.totalViews}</div>
                                </div>
                                <div className="bg-teal-50/50 dark:bg-teal-950/20 p-5 rounded-2xl border border-teal-100 dark:border-teal-900/30">
                                    <div className="text-teal-600/80 dark:text-teal-500/80 font-semibold text-xs tracking-wider uppercase mb-1">Total Downloads</div>
                                    <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">{fullUser.totalDownloads}</div>
                                </div>
                                <div
                                    className="bg-purple-50/50 dark:bg-purple-950/20 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/30 cursor-pointer hover:bg-purple-100/60 dark:hover:bg-purple-950/40 transition-colors relative"
                                    onClick={() => navigate(`/user/${fullUser.id}/affiliates`)}
                                >
                                    <div className="font-semibold text-xs tracking-wider uppercase mb-1 text-purple-600/60 dark:text-purple-400/60">Affiliates</div>
                                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{fullUser.referenceUserCount}</div>
                                    <Eye className="absolute top-3 right-3 w-4 h-4 opacity-40 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>

                            <div className="h-[200px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
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
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader><CardTitle>Financial Summary</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                <span className="text-slate-500 font-semibold uppercase tracking-wider text-xs">Total Earned</span>
                                <div className="text-3xl font-bold text-emerald-600">${convertUnits(profile.totalEarned)}</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                <span className="text-slate-500 font-semibold uppercase tracking-wider text-xs">Total Paid</span>
                                <div className="text-3xl font-bold text-blue-600">${convertUnits(profile.totalPaid)}</div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="w-4 h-4 text-slate-400" />
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Status Breakdown</h4>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {(Object.entries(profile.earningStatus) as [keyof UserEarningProfile['earningStatus'], StatusMetrics][]).map(([status, metrics]) => (
                                    <div
                                        key={status}
                                        className={`p-3 rounded-xl border transition-all ${status === 'rejected' && metrics.count > 0
                                                ? 'bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30'
                                                : 'bg-slate-50/30 border-slate-100 dark:bg-slate-900/20 dark:border-slate-800/50'
                                            }`}
                                    >
                                        <div className="text-[10px] font-bold uppercase tracking-tight text-slate-500 mb-1 truncate">
                                            {status.replace(/([A-Z])/g, ' $1').trim()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-lg font-bold leading-none ${status === 'rejected' && metrics.count > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
                                                }`}>
                                                {metrics.count}
                                            </span>
                                            <span className="text-[10px] text-slate-500 mt-1 font-mono">
                                                ${parseFloat(metrics.totalUsd).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Current Plan</h4>
                                </div>
                            </div>

                            {profile.earningPlan ? (
                                <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        {/* <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                            <Zap className="w-6 h-6" />
                                        </div> */}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg text-slate-900 dark:text-slate-100">{profile.earningPlan.earningPlan.planName}</span>
                                                <Badge variant="secondary" className="bg-slate-200/50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0">{profile.earningPlan.earningPlan.planType}</Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 font-medium italic">Active Subscriber Plan</p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                            <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-tight text-slate-400 leading-none mb-1">Plan Switches</div>
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                {profile.user.earningPlanSwitchCount} <span className="text-slate-300 dark:text-slate-600 mx-1">/</span> {profile.user.maxEarningPlanSwitches}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl p-8 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                                        <Zap className="w-6 h-6 opacity-20" />
                                    </div>
                                    <p className="text-slate-500 font-medium italic">No active earning plan selected for this user</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Fraud Metrics</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-500 text-sm">Total Events</span>
                                <span className="font-medium">{profile.fraudSummary.totalEvents}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 text-sm">Flagged Events</span>
                                <span className="font-medium text-amber-600">{profile.fraudSummary.flaggedEvents}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 text-sm">Rejected Events</span>
                                <span className="font-medium text-red-600">{profile.fraudSummary.rejectedEvents}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="text-slate-500 text-sm font-semibold">Rejection Rate</span>
                                <span className="font-bold">{(profile.fraudSummary.rejectionRate * 100).toFixed(2)}%</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Layers className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bulk Actions</span>
                            </div>
                            <Button
                                className="w-full justify-start bg-red-50 text-red-600 hover:bg-red-100 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 dark:border-red-800"
                                variant="outline"
                                size="sm"
                                onClick={() => openAction('reject-pending-percentage')}
                                disabled={profile.earningStatus.pending.count === 0}
                            >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Reject Pending by Percentage
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {(profile.user.earningSuspended || profile.user.payoutBlocked) && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
                    <CardHeader>
                        <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Account Restrictions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {profile.user.earningSuspended && (
                            <div>
                                <h4 className="font-bold text-red-700">Earning Suspended</h4>
                                <p className="text-sm text-red-600 mt-1"><span className="font-semibold">Reason:</span> {profile.user.earningSuspendedReason}</p>
                                <p className="text-sm text-slate-600"><span className="font-semibold">At:</span> {profile.user.earningSuspendedAt ? format(new Date(profile.user.earningSuspendedAt), 'PPP p') : 'N/A'}</p>
                            </div>
                        )}
                        {profile.user.payoutBlocked && (
                            <div className={profile.user.earningSuspended ? 'border-t border-red-200 pt-4' : ''}>
                                <h4 className="font-bold text-red-700">Payouts Blocked</h4>
                                <p className="text-sm text-red-600 mt-1"><span className="font-semibold">Category:</span> {profile.user.payoutBlockedCategory}</p>
                                <p className="text-sm text-slate-600"><span className="font-semibold">At:</span> {profile.user.payoutBlockedAt ? format(new Date(profile.user.payoutBlockedAt), 'PPP p') : 'N/A'}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Recent Events */}
            {/* <div>
                <h3 className="font-semibold text-xl mb-3">Recent Revenue Events</h3>
                <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-2 font-medium text-slate-500 text-xs">Date</th>
                                <th className="px-4 py-2 font-medium text-slate-500 text-xs">Type</th>
                                <th className="px-4 py-2 font-medium text-slate-500 text-xs">Status</th>
                                <th className="px-4 py-2 font-medium text-slate-500 text-xs">Fraud Flags</th>
                                <th className="px-4 py-2 font-medium text-slate-500 text-xs text-right">Reward</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                            {profile.recentEvents.map((ev: RevenueEvent) => (
                                <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="px-4 py-2 text-xs">
                                        {ev.inserted_at || ev.insertedAt
                                            ? format(new Date((ev.inserted_at || ev.insertedAt) as string), 'MMM dd, yyyy')
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-2 font-medium text-xs">{ev.event_type || ev.eventType}</td>
                                    <td className="px-4 py-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${EVENT_STATUS_COLORS[ev.status] || 'bg-slate-100 text-slate-800'}`}>
                                            {ev.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs">
                                        {(ev.fraud_flags || ev.fraudFlags || []).length > 0
                                            ? <span className="text-red-500">{(ev.fraud_flags || ev.fraudFlags)?.join(', ')}</span>
                                            : <span className="text-slate-400">None</span>}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium">${convertUnits(ev.reward_units || ev.rewardUnits)}</td>
                                </tr>
                            ))}
                            {profile.recentEvents.length === 0 && (
                                <tr><td colSpan={5} className="text-center p-4 text-slate-500">No recent events</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div> */}


            {/* Recent Payouts */}
            <div>
                <h3 className="font-semibold text-xl mb-3">Recent Payouts</h3>
                <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-2 font-medium text-slate-500 text-xs">Date</th>
                                <th className="px-4 py-2 font-medium text-slate-500 text-xs">Status</th>
                                <th className="px-4 py-2 font-medium text-slate-500 text-xs">Paid At</th>
                                <th className="px-4 py-2 font-medium text-slate-500 text-xs">Bank Account</th>
                                <th className="px-4 py-2 font-medium text-slate-500 text-xs text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                            {profile.payouts.map(p => {
                                const acctNum = p.snapshot_account_number || p.snapshotAccountNumber;
                                const ifsc = p.snapshot_ifsc_code || p.snapshotIfscCode;
                                return (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-2 text-xs">{p.created_at || p.createdAt ? format(new Date((p.created_at || p.createdAt) as string), 'MMM dd, yyyy') : '—'}</td>
                                        <td className="px-4 py-2 text-xs font-medium">{p.status}</td>
                                        <td className="px-4 py-2 text-xs">{p.paid_at || p.paidAt ? format(new Date((p.paid_at || p.paidAt) as string), 'MMM dd, yyyy') : '—'}</td>
                                        <td className="px-4 py-2 text-xs font-mono">
                                            {acctNum
                                                ? <span>{acctNum}{ifsc ? ` · ${ifsc}` : ''}</span>
                                                : <span className="text-slate-400">Unavailable</span>}
                                        </td>
                                        <td className="px-4 py-2 text-right font-medium">${convertUnits(p.total_units || p.totalUnits)}</td>
                                    </tr>
                                );
                            })}
                            {profile.payouts.length === 0 && (
                                <tr><td colSpan={5} className="text-center p-4 text-slate-500">No recent payouts</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Dialog */}
            <Dialog open={activeAction !== null} onOpenChange={open => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {activeAction === 'suspend' && 'Suspend Earning'}
                            {activeAction === 'reinstate' && 'Reinstate Earning'}
                            {activeAction === 'block-payouts' && 'Block Payouts'}
                            {activeAction === 'unblock-payouts' && 'Unblock Payouts'}
                            {activeAction === 'override-plan' && 'Override Earning Plan'}
                            {activeAction === 'reject-pending-percentage' && 'Reject Pending by Percentage'}
                        </DialogTitle>
                        <DialogDescription>
                            {activeAction === 'suspend' && 'Suspend earning for this user. New views and referrals will not generate revenue events while suspended.'}
                            {activeAction === 'reinstate' && 'Re-enable earning for this user. All suspension fields will be cleared.'}
                            {activeAction === 'block-payouts' && 'Prevent future payout settlements for this user.'}
                            {activeAction === 'unblock-payouts' && 'Remove the payout block for this user.'}
                            {activeAction === 'override-plan' && 'Assign an earning plan directly, bypassing the user\'s normal switch limits.'}
                            {activeAction === 'reject-pending-percentage' && 'Reject a percentage of the user\'s PENDING revenue events, oldest-first. This action is transactional and cannot be undone.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {activeAction === 'reject-pending-percentage' && !showConfirmation && (
                            <div className="space-y-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Current pending events:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{profile.earningStatus.pending.count || 0}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Percentage to Reject (1-100) <span className="text-red-500">*</span></label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={percentage}
                                            onChange={e => setPercentage(parseInt(e.target.value) || 0)}
                                            className="w-24"
                                        />
                                        <span className="text-lg font-medium text-slate-400">%</span>
                                    </div>
                                    <div className="mt-2 text-xs space-y-1">
                                        {(() => {
                                            const pendingCount = profile.earningStatus.pending.count || 0;
                                            const willReject = Math.floor((percentage / 100) * pendingCount);
                                            const willLeave = pendingCount - willReject;

                                            if (willReject === 0 && percentage > 0) {
                                                return <p className="text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> This percentage is too small — 0 events would be rejected.</p>;
                                            }

                                            return (
                                                <>
                                                    <p className="text-slate-500 font-medium italic">Events selected: oldest {willReject} (by creation date)</p>
                                                    <div className="flex gap-4 mt-1">
                                                        <p className="text-slate-500">Will reject: <span className="font-semibold text-red-600">{willReject} events</span></p>
                                                        <p className="text-slate-500">Will leave: <span className="font-semibold text-slate-700 dark:text-slate-300">{willLeave} events</span></p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Rejection Reason <span className="text-red-500">*</span></label>
                                    <Select value={bulkReason} onValueChange={setBulkReason}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FRAUD_CONFIRMED">FRAUD_CONFIRMED</SelectItem>
                                            <SelectItem value="DUPLICATE">DUPLICATE</SelectItem>
                                            <SelectItem value="POLICY_VIOLATION">POLICY_VIOLATION</SelectItem>
                                            <SelectItem value="OTHER">OTHER</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {activeAction === 'reject-pending-percentage' && showConfirmation && (
                            <div className="space-y-4 py-2">
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
                                    <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
                                        You are about to reject {Math.floor((percentage / 100) * (profile.earningStatus.pending.count || 0))} events ({percentage}% of {profile.earningStatus.pending.count || 0} pending) for:
                                    </p>
                                    <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 font-bold text-xs">
                                            {fullUser?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{fullUser?.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">{fullUser?.id}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <p className="text-slate-500 uppercase tracking-tighter font-bold">Reason</p>
                                            <p className="font-semibold text-slate-700 dark:text-slate-300">{bulkReason}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 uppercase tracking-tighter font-bold">Events Selected</p>
                                            <p className="font-semibold text-slate-700 dark:text-slate-300">Oldest {Math.floor((percentage / 100) * (profile.earningStatus.pending.count || 0))}</p>
                                        </div>
                                    </div>
                                    {note && (
                                        <div className="text-xs">
                                            <p className="text-slate-500 uppercase tracking-tighter font-bold">Note</p>
                                            <p className="italic text-slate-600 dark:text-slate-400">"{note}"</p>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
                                        <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5" /> This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {(activeAction === 'suspend' || activeAction === 'block-payouts') && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Reason <span className="text-red-500">*</span></label>
                                <Input
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder={activeAction === 'suspend' ? 'e.g. Confirmed fraudulent account activity' : 'e.g. Legal hold — fraud investigation'}
                                />
                            </div>
                        )}
                        {activeAction === 'block-payouts' && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Category <span className="text-red-500">*</span></label>
                                <Select value={blockCategory} onValueChange={setBlockCategory}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACCOUNT_BAN">ACCOUNT_BAN</SelectItem>
                                        <SelectItem value="LEGAL_HOLD">LEGAL_HOLD</SelectItem>
                                        <SelectItem value="FRAUD_CONFIRMED">FRAUD_CONFIRMED</SelectItem>
                                        <SelectItem value="OTHER">OTHER</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {activeAction === 'override-plan' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Plan ID <span className="text-red-500">*</span></label>
                                    <Input
                                        value={overridePlanId}
                                        onChange={e => setOverridePlanId(e.target.value)}
                                        placeholder="UUID of the target earning plan"
                                    />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={resetSwitchCount}
                                        onChange={e => setResetSwitchCount(e.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm font-medium">Reset plan switch count to 0</span>
                                </label>
                            </>
                        )}
                        {((activeAction !== null && activeAction !== 'reject-pending-percentage') || (activeAction === 'reject-pending-percentage' && !showConfirmation)) && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">
                                    {activeAction === 'reject-pending-percentage' ? 'Audit Log Note' : 'Note'}
                                    {(activeAction === 'reinstate' || activeAction === 'unblock-payouts' || activeAction === 'override-plan')
                                        ? <span className="text-red-500"> *</span>
                                        : <span className="text-slate-400"> (optional)</span>}
                                </label>
                                <Input
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder={activeAction === 'reject-pending-percentage' ? "e.g. View inflation pattern detected — rejecting oldest 10%..." : "Admin note for audit log..."}
                                />
                            </div>
                        )}
                        {actionError && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {actionError}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => showConfirmation ? setShowConfirmation(false) : closeDialog()}
                            disabled={submitting}
                        >
                            {showConfirmation ? 'Back' : 'Cancel'}
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || (activeAction === 'reject-pending-percentage' && !showConfirmation && (percentage < 1 || Math.floor((percentage / 100) * (profile.earningStatus.pending.count || 0)) === 0))}
                            className={
                                activeAction === 'reinstate' || activeAction === 'unblock-payouts' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                    activeAction === 'suspend' || activeAction === 'block-payouts' || activeAction === 'reject-pending-percentage' ? 'bg-red-600 hover:bg-red-700' : ''
                            }
                        >
                            {submitting ? 'Submitting...' :
                                (activeAction === 'reject-pending-percentage' && !showConfirmation) ? 'Review Rejection' :
                                    (activeAction === 'reject-pending-percentage' && showConfirmation) ? 'Confirm Reject' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
