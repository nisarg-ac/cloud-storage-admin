import { useEffect, useState } from 'react';
import { ActivityFeedItem, earningService } from '../services/earning.service';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { convertUnits } from '../utils';

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
    PAYABLE: 'bg-blue-100 text-blue-800',
    PAID: 'bg-indigo-100 text-indigo-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    FAILED: 'bg-red-100 text-red-800',
};

// Normalize the two response shapes into one display shape
function normalizeItem(item: ActivityFeedItem) {
    return {
        id: item.id,
        type: item.type || item.event_type || '—',
        userId: item.user_id || item.actor_user_id || '—',
        amount: item.units || item.reward_units || item.total_units || '0',
        currency: item.currency,
        status: item.status,
        timestamp: item.timestamp,
    };
}

export const ActivityFeed = () => {
    const [items, setItems] = useState<ActivityFeedItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [type, setType] = useState<string>('VIEW');
    const [date, setDate] = useState('');

    const fetchFeed = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await earningService.getActivityFeed({
                page,
                limit: 1000,
                type: type !== 'ALL' ? type : undefined,
                date: date || undefined,
            });
            setItems(res.data);
            setTotal(res.total);
        } catch (err: unknown) {
            const error = err as import('axios').AxiosError<{ error?: string }>;
            const status = error?.response?.status;
            if (status === 500 && type === 'ALL') {
                setError('The "All Types" combined feed is not yet available on the server. Please filter by a specific type.');
            } else {
                setError(error?.response?.data?.error || 'Failed to load activity feed.');
            }
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, type, date]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">Activity Feed</h1>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="space-y-0.5">
                        <label className="text-xs text-slate-500 font-medium">Date</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={e => { setDate(e.target.value); setPage(1); }}
                            className="h-9 text-sm w-40"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-xs text-slate-500 font-medium">Type</label>
                        <Select value={type} onValueChange={val => { setType(val); setPage(1); }}>
                            <SelectTrigger className="w-[160px] h-9">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Types</SelectItem>
                                <SelectItem value="VIEW">View</SelectItem>
                                <SelectItem value="REFERRAL">Referral</SelectItem>
                                <SelectItem value="PAYOUT">Payout</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {(date || type !== 'VIEW') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 mt-4"
                            onClick={() => { setDate(''); setType('VIEW'); setPage(1); }}
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        Recent Activities
                        {date && <span className="ml-2 text-sm text-slate-500 font-normal">— {format(new Date(date + 'T00:00:00'), 'MMMM d, yyyy')}</span>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="flex items-start gap-3 text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-3">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            {error}
                        </div>
                    ) : loading ? (
                        <div className="flex justify-center p-8 text-slate-500">Loading...</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Date</th>
                                            <th className="px-4 py-3 font-medium">Type</th>
                                            <th className="px-4 py-3 font-medium">User ID</th>
                                            <th className="px-4 py-3 font-medium text-right">Amount</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {items.map((item, idx) => {
                                            const n = normalizeItem(item);
                                            return (
                                                <tr key={n.id + idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                        {format(new Date(n.timestamp), 'MMM dd, yyyy HH:mm')}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{n.type}</td>
                                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{n.userId}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                                                        ${convertUnits(n.amount)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[n.status] || 'bg-slate-100 text-slate-800'}`}>
                                                            {n.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {items.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                                    No activities found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {total > 0 && (
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-sm text-slate-500">
                                        Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                            Previous
                                        </Button>
                                        <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page * 50 >= total}>
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
