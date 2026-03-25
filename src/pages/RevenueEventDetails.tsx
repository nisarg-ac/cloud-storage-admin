import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RevenueEvent, earningService } from '../services/earning.service';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { convertUnits } from '../utils';

type ActionType = 'approve' | 'reject' | 'override-fraud' | 'flag' | null;

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
    PAYABLE: 'bg-blue-100 text-blue-800',
    PAID: 'bg-indigo-100 text-indigo-800',
};

export const RevenueEventDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<RevenueEvent | null>(null);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [activeAction, setActiveAction] = useState<ActionType>(null);
    const [submitting, setSubmitting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // Form fields per action
    const [note, setNote] = useState('');
    const [rejectReason, setRejectReason] = useState('FRAUD_CONFIRMED');
    const [justification, setJustification] = useState('');
    const [flagReason, setFlagReason] = useState('SUSPICIOUS_PATTERN');

    const fetchEvent = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await earningService.getEventById(id);
            setEvent(data);
        } catch (error) {
            console.error('Failed to fetch event', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const openAction = (action: ActionType) => {
        setNote('');
        setJustification('');
        setActionError(null);
        setActiveAction(action);
    };

    const closeDialog = () => {
        setActiveAction(null);
        setActionError(null);
    };

    const handleSubmit = async () => {
        if (!event) return;
        setSubmitting(true);
        setActionError(null);
        try {
            if (activeAction === 'approve') {
                await earningService.approveEvent(event.id, note || undefined);
            } else if (activeAction === 'reject') {
                await earningService.rejectEvent(event.id, rejectReason, note || undefined);
            } else if (activeAction === 'override-fraud') {
                if (justification.length < 20) {
                    setActionError('Justification must be at least 20 characters.');
                    setSubmitting(false);
                    return;
                }
                await earningService.overrideFraudFlag(event.id, justification);
            } else if (activeAction === 'flag') {
                await earningService.flagEvent(event.id, flagReason, note || undefined);
            }
            closeDialog();
            fetchEvent();
        } catch (err: any) {
            setActionError(err?.response?.data?.message || 'Action failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading...</div>;
    if (!event) return <div className="p-8 text-slate-500">Event not found</div>;

    const fraudFlags = event.fraud_flags || event.fraudFlags || [];
    const overriddenFlags = event.fraud_flags_overridden || event.fraudFlagsOverridden || [];
    const canAct = ['PENDING', 'APPROVED'].includes(event.status);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/revenue/events')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">Event Details</h1>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {canAct && (
                        <>
                            <Button onClick={() => openAction('approve')} className="bg-emerald-600 hover:bg-emerald-700">
                                Approve
                            </Button>
                            <Button onClick={() => openAction('reject')} variant="destructive">
                                Reject
                            </Button>
                        </>
                    )}
                    {fraudFlags.length > 0 && (
                        <Button
                            onClick={() => openAction('override-fraud')}
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                            Override Fraud Flags
                        </Button>
                    )}
                    {canAct && (
                        <Button onClick={() => openAction('flag')} variant="outline">
                            Flag Manually
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Event Information</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <Row label="ID" value={<span className="font-mono text-xs break-all">{event.id}</span>} />
                        <Row label="Status" value={
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[event.status] || 'bg-slate-100 text-slate-800'}`}>
                                {event.status}
                            </span>
                        } />
                        <Row label="Type" value={event.event_type || event.eventType} />
                        <Row label="Reward" value={`$${convertUnits(event.reward_units || event.rewardUnits)} ${event.currency}`} />
                        <Row label="Date Added" value={
                            event.inserted_at || event.insertedAt
                                ? format(new Date((event.inserted_at || event.insertedAt) as string), 'PPP p')
                                : 'N/A'
                        } />
                        {(event.event_timestamp) && (
                            <Row label="Event Timestamp" value={format(new Date(event.event_timestamp), 'PPP p')} />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <Row label="Actor" value={
                            <div>
                                <div className="font-medium">{event.actor_name || '—'}</div>
                                <div className="font-mono text-xs text-slate-500 break-all">{event.actor_user_id || event.actorUserId || '—'}</div>
                            </div>
                        } />
                        <Row label="Beneficiary" value={
                            <div>
                                <div className="font-medium">{event.beneficiary_name || '—'}</div>
                                <div className="font-mono text-xs text-slate-500 break-all">{event.beneficiary_user_id || event.beneficiaryUserId || '—'}</div>
                            </div>
                        } />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Audit & Fraud</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <Row label="Fraud Flags" value={
                        fraudFlags.length > 0
                            ? <div className="flex gap-1 flex-wrap">{fraudFlags.map(f => <Badge key={f} variant="destructive" className="text-xs">{f}</Badge>)}</div>
                            : <span className="text-slate-400 text-sm">None</span>
                    } />
                    {overriddenFlags.length > 0 && (
                        <Row label="Overridden Flags" value={
                            <div className="flex gap-1 flex-wrap">{overriddenFlags.map(f => <Badge key={f} variant="secondary" className="text-xs line-through">{f}</Badge>)}</div>
                        } />
                    )}
                    <Row label="Approved By" value={event.approved_by || event.approvedBy || '—'} />
                    <Row label="Approved At" value={
                        (event.approved_at || event.approvedAt)
                            ? format(new Date((event.approved_at || event.approvedAt) as string), 'PPP p')
                            : '—'
                    } />
                    <Row label="Rejected Reason" value={event.rejected_reason || event.rejectedReason || '—'} />
                    <Row label="Admin Note" value={event.admin_note || event.adminNote || '—'} />
                </CardContent>
            </Card>

            {/* Action Dialog */}
            <Dialog open={activeAction !== null} onOpenChange={open => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {activeAction === 'approve' && 'Approve Event'}
                            {activeAction === 'reject' && 'Reject Event'}
                            {activeAction === 'override-fraud' && 'Override Fraud Flags'}
                            {activeAction === 'flag' && 'Manually Flag Event'}
                        </DialogTitle>
                        <DialogDescription>
                            {activeAction === 'approve' && 'Approve this revenue event. It will become eligible for payout batching.'}
                            {activeAction === 'reject' && 'Reject this event. Select a reason and optionally add a note.'}
                            {activeAction === 'override-fraud' && 'Clear all fraud flags and immediately approve this event. Requires a justification of at least 20 characters.'}
                            {activeAction === 'flag' && 'Add MANUAL_REVIEW flag and revert status to PENDING if approved.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {activeAction === 'reject' && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Rejection Reason <span className="text-red-500">*</span></label>
                                <Select value={rejectReason} onValueChange={setRejectReason}>
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
                        )}
                        {activeAction === 'flag' && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Flag Reason <span className="text-red-500">*</span></label>
                                <Select value={flagReason} onValueChange={setFlagReason}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SUSPICIOUS_PATTERN">SUSPICIOUS_PATTERN</SelectItem>
                                        <SelectItem value="USER_REPORTED">USER_REPORTED</SelectItem>
                                        <SelectItem value="BULK_ACTIVITY">BULK_ACTIVITY</SelectItem>
                                        <SelectItem value="OTHER">OTHER</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {activeAction === 'override-fraud' ? (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Justification <span className="text-red-500">*</span></label>
                                <textarea
                                    value={justification}
                                    onChange={e => setJustification(e.target.value)}
                                    placeholder="Min 20 characters — explain why fraud flags are being cleared..."
                                    rows={3}
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                                />
                                <p className="text-xs text-slate-400">{justification.length}/20 minimum characters</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Note <span className="text-slate-400">(optional)</span></label>
                                <Input
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Admin note for audit log..."
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
                        <Button variant="outline" onClick={closeDialog} disabled={submitting}>Cancel</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className={
                                activeAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                activeAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                activeAction === 'override-fraud' ? 'bg-orange-600 hover:bg-orange-700' : ''
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
            <span className="text-sm font-medium text-slate-500 w-36 shrink-0">{label}</span>
            <span className="text-sm text-slate-800 dark:text-slate-200">{value}</span>
        </div>
    );
}
