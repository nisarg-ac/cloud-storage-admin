import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Payout, earningService } from '../services/earning.service';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { convertUnits } from '../utils';

type ActionType = 'approve' | 'hold' | 'release' | 'mark-paid' | 'mark-failed' | 'retry' | null;

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    ON_HOLD: 'bg-orange-100 text-orange-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    PAID: 'bg-emerald-100 text-emerald-800',
    FAILED: 'bg-red-100 text-red-800',
};

export const PayoutDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [payout, setPayout] = useState<Payout | null>(null);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [activeAction, setActiveAction] = useState<ActionType>(null);
    const [submitting, setSubmitting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // Form fields
    const [note, setNote] = useState('');
    const [holdReason, setHoldReason] = useState('');
    const [failReason, setFailReason] = useState('INVALID_BANK_DETAILS');
    const [providerName, setProviderName] = useState('');
    const [transactionRef, setTransactionRef] = useState('');

    const fetchPayout = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await earningService.getPayoutById(id);
            setPayout(data);
        } catch (error) {
            console.error('Failed to fetch payout', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayout();
    }, [id]);

    const openAction = (action: ActionType) => {
        setNote('');
        setHoldReason('');
        setProviderName('');
        setTransactionRef('');
        setActionError(null);
        setActiveAction(action);
    };

    const closeDialog = () => {
        setActiveAction(null);
        setActionError(null);
    };

    const handleSubmit = async () => {
        if (!payout) return;
        setSubmitting(true);
        setActionError(null);
        try {
            if (activeAction === 'approve') {
                await earningService.approvePayout(payout.id, note || undefined);
            } else if (activeAction === 'hold') {
                if (!holdReason.trim()) {
                    setActionError('Hold reason is required.');
                    setSubmitting(false);
                    return;
                }
                await earningService.holdPayout(payout.id, holdReason);
            } else if (activeAction === 'release') {
                await earningService.releasePayoutHold(payout.id, note || undefined);
            } else if (activeAction === 'mark-paid') {
                if (!providerName.trim() || !transactionRef.trim()) {
                    setActionError('Provider name and transaction reference are required.');
                    setSubmitting(false);
                    return;
                }
                await earningService.markPayoutPaid(payout.id, providerName, transactionRef, note || undefined);
            } else if (activeAction === 'mark-failed') {
                await earningService.markPayoutFailed(payout.id, failReason, note || undefined);
            } else if (activeAction === 'retry') {
                await earningService.retryPayout(payout.id, note || undefined);
            }
            closeDialog();
            fetchPayout();
        } catch (err: any) {
            setActionError(err?.response?.data?.message || 'Action failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading...</div>;
    if (!payout) return <div className="p-8 text-slate-500">Payout not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/revenue/payouts')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">Payout Details</h1>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {payout.status === 'PENDING' && (
                        <>
                            <Button onClick={() => openAction('approve')} className="bg-emerald-600 hover:bg-emerald-700">
                                Approve
                            </Button>
                            <Button onClick={() => openAction('hold')} variant="destructive">
                                Hold
                            </Button>
                        </>
                    )}
                    {payout.status === 'PROCESSING' && (
                        <>
                            <Button onClick={() => openAction('hold')} variant="outline" className="border-orange-400 text-orange-600 hover:bg-orange-50">
                                Hold
                            </Button>
                            <Button onClick={() => openAction('mark-paid')} className="bg-blue-600 hover:bg-blue-700">
                                Mark Paid
                            </Button>
                            <Button onClick={() => openAction('mark-failed')} variant="destructive">
                                Mark Failed
                            </Button>
                        </>
                    )}
                    {payout.status === 'ON_HOLD' && (
                        <Button onClick={() => openAction('release')} variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50">
                            Release Hold
                        </Button>
                    )}
                    {payout.status === 'FAILED' && (
                        <Button onClick={() => openAction('retry')} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Retry Payout
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Payment Information</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <Row label="Status" value={
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[payout.status] || 'bg-slate-100 text-slate-800'}`}>
                                {payout.status}
                            </span>
                        } />
                        <Row label="Amount" value={`$${convertUnits(payout.total_units || payout.totalUnits)} ${payout.currency}`} />
                        <Row label="Event Count" value={payout.event_count || '—'} />
                        <Row label="Event Sum" value={payout.event_sum_units ? `$${convertUnits(payout.event_sum_units)}` : '—'} />
                        <Row label="Created At" value={
                            (payout.created_at || payout.createdAt)
                                ? format(new Date((payout.created_at || payout.createdAt) as string), 'PPP p')
                                : '—'
                        } />
                        <Row label="Release At" value={
                            (payout.holding_release_at || payout.holdingReleaseAt)
                                ? format(new Date((payout.holding_release_at || payout.holdingReleaseAt) as string), 'PPP p')
                                : '—'
                        } />
                        <Row label="Paid At" value={
                            (payout.paid_at || payout.paidAt)
                                ? format(new Date((payout.paid_at || payout.paidAt) as string), 'PPP p')
                                : <span className="text-slate-400">Unpaid</span>
                        } />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>User & Disbursement</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <Row label="User Name" value={payout.user_name || '—'} />
                        <Row label="User Email" value={payout.user_email || '—'} />
                        <Row label="User ID" value={<span className="font-mono text-xs break-all">{payout.user_id || payout.userId || '—'}</span>} />
                        <Row label="Provider" value={payout.payment_provider || payout.paymentProvider || '—'} />
                        <Row label="Transaction Ref" value={payout.transaction_ref || payout.transactionRef || '—'} />
                        <Row label="Held Reason" value={payout.held_reason || payout.heldReason || '—'} />
                        <Row label="Failed Reason" value={payout.failed_reason || payout.failedReason || '—'} />
                        <Row label="Admin Note" value={payout.admin_note || payout.adminNote || '—'} />
                    </CardContent>
                </Card>
            </div>

            {/* Action Dialog */}
            <Dialog open={activeAction !== null} onOpenChange={open => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {activeAction === 'approve' && 'Approve Payout'}
                            {activeAction === 'hold' && 'Hold Payout'}
                            {activeAction === 'release' && 'Release Hold'}
                            {activeAction === 'mark-paid' && 'Mark as Paid'}
                            {activeAction === 'mark-failed' && 'Mark as Failed'}
                            {activeAction === 'retry' && 'Retry Payout'}
                        </DialogTitle>
                        <DialogDescription>
                            {activeAction === 'approve' && 'Move this payout to PROCESSING. Allowed only after the holding release date has passed.'}
                            {activeAction === 'hold' && 'Manually hold this payout. Provide a reason for the hold.'}
                            {activeAction === 'release' && 'Release this payout from hold back to PENDING.'}
                            {activeAction === 'mark-paid' && 'Record a successful disbursement. Provide the payment provider and transaction reference.'}
                            {activeAction === 'mark-failed' && 'Record a failed disbursement. Select a failure reason.'}
                            {activeAction === 'retry' && 'Re-queue this failed payout back to PROCESSING.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {activeAction === 'hold' && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Hold Reason <span className="text-red-500">*</span></label>
                                <Input
                                    value={holdReason}
                                    onChange={e => setHoldReason(e.target.value)}
                                    placeholder="e.g. Suspicious activity — awaiting compliance review"
                                />
                            </div>
                        )}
                        {activeAction === 'mark-paid' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Payment Provider <span className="text-red-500">*</span></label>
                                    <Input
                                        value={providerName}
                                        onChange={e => setProviderName(e.target.value)}
                                        placeholder="e.g. Wise, Stripe"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Transaction Reference <span className="text-red-500">*</span></label>
                                    <Input
                                        value={transactionRef}
                                        onChange={e => setTransactionRef(e.target.value)}
                                        placeholder="e.g. WISE-TXN-001234"
                                    />
                                </div>
                            </>
                        )}
                        {activeAction === 'mark-failed' && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Failure Reason <span className="text-red-500">*</span></label>
                                <Select value={failReason} onValueChange={setFailReason}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INVALID_BANK_DETAILS">INVALID_BANK_DETAILS</SelectItem>
                                        <SelectItem value="ACCOUNT_FROZEN">ACCOUNT_FROZEN</SelectItem>
                                        <SelectItem value="PROVIDER_ERROR">PROVIDER_ERROR</SelectItem>
                                        <SelectItem value="OTHER">OTHER</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Note <span className="text-slate-400">(optional)</span></label>
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
                                activeAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                activeAction === 'hold' || activeAction === 'mark-failed' ? 'bg-red-600 hover:bg-red-700' :
                                activeAction === 'mark-paid' ? 'bg-blue-600 hover:bg-blue-700' :
                                activeAction === 'retry' ? 'bg-indigo-600 hover:bg-indigo-700' : ''
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex gap-4">
            <span className="text-sm font-medium text-slate-500 w-32 shrink-0">{label}</span>
            <span className="text-sm text-slate-800 dark:text-slate-200">{value}</span>
        </div>
    );
}
