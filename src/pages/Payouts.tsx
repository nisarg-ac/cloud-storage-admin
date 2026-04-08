import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Payout, earningService, PaginatedResult } from '../services/earning.service';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Filter, X } from 'lucide-react';
import { convertUnits } from '../utils';

const STATUS_OPTIONS = ['PENDING', 'ON_HOLD', 'PROCESSING', 'PAID', 'FAILED'];
const SORT_OPTIONS = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'total_units', label: 'Amount' },
    { value: 'status', label: 'Status' },
    { value: 'holding_release_at', label: 'Release Date' },
];

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    ON_HOLD: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export const Payouts = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<PaginatedResult<Payout> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [userIdFilter, setUserIdFilter] = useState('');
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const res = await earningService.getPayouts({
                page,
                limit: 100,
                status: statusFilter || undefined,
                userId: userIdFilter || undefined,
                amountMin: amountMin && !isNaN(parseFloat(amountMin)) ? Math.round(parseFloat(amountMin) * 1_000_000).toString() : undefined,
                amountMax: amountMax && !isNaN(parseFloat(amountMax)) ? Math.round(parseFloat(amountMax) * 1_000_000).toString() : undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                sortBy,
                sortDir,
            });
            setData(res);
        } catch (error) {
            console.error('Failed to fetch payouts', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusFilter, userIdFilter, amountMin, amountMax, dateFrom, dateTo, sortBy, sortDir]);

    const clearFilters = () => {
        setStatusFilter('');
        setUserIdFilter('');
        setAmountMin('');
        setAmountMax('');
        setDateFrom('');
        setDateTo('');
        setSortBy('created_at');
        setSortDir('desc');
        setPage(1);
    };

    const hasActiveFilters = statusFilter || userIdFilter || amountMin || amountMax || dateFrom || dateTo;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">Payouts Management</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <CardTitle>Payouts List</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(v => !v)}
                                className="flex items-center gap-1"
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                                {hasActiveFilters && <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-blue-600">!</Badge>}
                            </Button>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1 text-slate-500">
                                    <X className="w-3 h-3" /> Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Status</label>
                                <Select value={statusFilter || 'ALL'} onValueChange={v => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1); }}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Statuses</SelectItem>
                                        {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Sort By</label>
                                <Select value={sortBy} onValueChange={v => { setSortBy(v); setPage(1); }}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Sort Direction</label>
                                <Select value={sortDir} onValueChange={v => { setSortDir(v); setPage(1); }}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="desc">Newest First</SelectItem>
                                        <SelectItem value="asc">Oldest First</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Date From</label>
                                <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="h-8 text-xs" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Date To</label>
                                <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="h-8 text-xs" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Min Amount (USD)</label>
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="0.00"
                                    value={amountMin}
                                    onChange={e => { setAmountMin(e.target.value); setPage(1); }}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Max Amount (USD)</label>
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="No limit"
                                    value={amountMax}
                                    onChange={e => { setAmountMax(e.target.value); setPage(1); }}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">User ID</label>
                                <Input
                                    placeholder="UUID..."
                                    value={userIdFilter}
                                    onChange={e => { setUserIdFilter(e.target.value); setPage(1); }}
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Created</th>
                                            <th className="px-4 py-3 font-medium">User</th>
                                            <th className="px-4 py-3 font-medium text-right">Amount</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium">Release Date</th>
                                            <th className="px-4 py-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {data?.data?.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                    {item.created_at || item.createdAt
                                                        ? format(new Date((item.created_at || item.createdAt) as string), 'MMM dd, yyyy')
                                                        : 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                                                    {item.user_name || item.userId || item.user_id}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                                                    ${convertUnits(item.total_units || item.totalUnits)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || 'bg-slate-100 text-slate-800'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                                                    {item.holding_release_at || item.holdingReleaseAt
                                                        ? format(new Date((item.holding_release_at || item.holdingReleaseAt) as string), 'MMM dd, yyyy')
                                                        : 'N/A'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Button variant="outline" size="sm" onClick={() => navigate(`/revenue/payouts/${item.id}`)}>
                                                        Review
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {data?.data?.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                    No payouts found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {data && data.total > 0 && (
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-sm text-slate-500">
                                        Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, data.total)} of {data.total}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                                        <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page * 50 >= data.total}>Next</Button>
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
