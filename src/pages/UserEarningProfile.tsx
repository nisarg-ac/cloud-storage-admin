import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserEarningProfile, RevenueEvent, earningService } from '../services/earning.service';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, AlertTriangle, CheckCircle, Ban, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { convertUnits } from '../utils';

type ActionType = 'suspend' | 'reinstate' | 'block-payouts' | 'unblock-payouts' | 'override-plan' | null;

const EVENT_STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
    PAYABLE: 'bg-blue-100 text-blue-800',
    IN_PAYOUT: 'bg-violet-100 text-violet-800',
    PAID: 'bg-indigo-100 text-indigo-800',
};

export const UserEarningProfileView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserEarningProfile | null>(null);
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

    const fetchProfile = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await earningService.getUserEarningProfile(id);
            setProfile(data);
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
        setActionError(null);
        setActiveAction(action);
    };

    const closeDialog = () => {
        setActiveAction(null);
        setActionError(null);
    };

    const handleSubmit = async () => {
        if (!profile) return;
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

    if (loading) return <div className="p-8 text-slate-500">Loading...</div>;
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
                            <div className="mt-4 pt-4 border-t col-span-2">
                                <h4 className="font-semibold mb-2">Current Plan</h4>
                                {profile.earningPlan ? (
                                    <div>
                                        <span className="font-medium text-lg">{profile.earningPlan.earningPlan.planName}</span>
                                        <Badge variant="secondary" className="ml-2">{profile.earningPlan.earningPlan.planType}</Badge>
                                        <div className="text-sm mt-1 text-slate-500">
                                            Switches: {profile.user.earningPlanSwitchCount} / {profile.user.maxEarningPlanSwitches}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-slate-500 italic">No plan selected</span>
                                )}
                            </div>
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
            <div>
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
            </div>

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
                                                ? <span>****{acctNum.slice(-4)}{ifsc ? ` · ${ifsc}` : ''}</span>
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
                        </DialogTitle>
                        <DialogDescription>
                            {activeAction === 'suspend' && 'Suspend earning for this user. New views and referrals will not generate revenue events while suspended.'}
                            {activeAction === 'reinstate' && 'Re-enable earning for this user. All suspension fields will be cleared.'}
                            {activeAction === 'block-payouts' && 'Prevent future payout settlements for this user.'}
                            {activeAction === 'unblock-payouts' && 'Remove the payout block for this user.'}
                            {activeAction === 'override-plan' && 'Assign an earning plan directly, bypassing the user\'s normal switch limits.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
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
                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                {activeAction === 'suspend' || activeAction === 'block-payouts' ? 'Note' : 'Note'}
                                {(activeAction === 'reinstate' || activeAction === 'unblock-payouts' || activeAction === 'override-plan')
                                    ? <span className="text-red-500"> *</span>
                                    : <span className="text-slate-400"> (optional)</span>}
                            </label>
                            <Input
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Admin note for audit log..."
                            />
                        </div>
                        {actionError && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {actionError}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog} disabled={submitting}>Cancel</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className={
                                activeAction === 'reinstate' || activeAction === 'unblock-payouts' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                    activeAction === 'suspend' || activeAction === 'block-payouts' ? 'bg-red-600 hover:bg-red-700' : ''
                            }
                        >
                            {submitting ? 'Submitting...' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
