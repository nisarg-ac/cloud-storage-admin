import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RevenueEvent, earningService, PaginatedResult } from '../services/earning.service';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Filter, X } from 'lucide-react';
import { convertUnits } from '../utils';

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED', 'PAYABLE', 'PAID'];
const TYPE_OPTIONS = ['FILE_VIEW', 'SIGNUP_REFERRAL'];
const SORT_OPTIONS = [
    { value: 'inserted_at', label: 'Date Added' },
    { value: 'event_timestamp', label: 'Event Date' },
    { value: 'reward_units', label: 'Reward Amount' },
    { value: 'status', label: 'Status' },
];

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    PAYABLE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    PAID: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
};

export const RevenueEvents = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [data, setData] = useState<PaginatedResult<RevenueEvent> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkError, setBulkError] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [hasFraudFlags, setHasFraudFlags] = useState('');
    const [userIdFilter, setUserIdFilter] = useState('');
    const [sortBy, setSortBy] = useState('inserted_at');
    const [sortDir, setSortDir] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            if (activeTab === 'fraud') {
                const res = await earningService.getFraudQueue({ page, limit: 50 });
                setData(res);
            } else {
                const res = await earningService.getEvents({
                    page,
                    limit: 50,
                    status: statusFilter || undefined,
                    type: typeFilter || undefined,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                    hasFraudFlags: hasFraudFlags === 'true' ? true : hasFraudFlags === 'false' ? false : undefined,
                    userId: userIdFilter || undefined,
                    sortBy,
                    sortDir,
                });
                setData(res);
            }
        } catch (error) {
            console.error('Failed to fetch revenue events', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        setSelectedIds([]);
    }, [page, activeTab, statusFilter, typeFilter, dateFrom, dateTo, hasFraudFlags, userIdFilter, sortBy, sortDir]);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkAction = async (action: 'APPROVE' | 'REJECT') => {
        if (!selectedIds.length) return;
        setBulkError(null);
        try {
            const result = await earningService.bulkActionEvents(selectedIds, action);
            if (result.failed > 0) {
                setBulkError(`${result.succeeded} succeeded, ${result.failed} failed.`);
            }
            fetchEvents();
            setSelectedIds([]);
        } catch (err: any) {
            setBulkError(err?.response?.data?.message || 'Bulk action failed');
        }
    };

    const clearFilters = () => {
        setStatusFilter('');
        setTypeFilter('');
        setDateFrom('');
        setDateTo('');
        setHasFraudFlags('');
        setUserIdFilter('');
        setSortBy('inserted_at');
        setSortDir('desc');
        setPage(1);
    };

    const hasActiveFilters = statusFilter || typeFilter || dateFrom || dateTo || hasFraudFlags || userIdFilter;

    const renderTable = () => (
        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                        <th className="px-4 py-3 font-medium w-10">
                            <input
                                type="checkbox"
                                checked={data?.data?.length ? selectedIds.length === data.data.length : false}
                                onChange={(e) => {
                                    if (e.target.checked && data?.data) {
                                        setSelectedIds(data.data.map(i => i.id));
                                    } else {
                                        setSelectedIds([]);
                                    }
                                }}
                            />
                        </th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Beneficiary</th>
                        <th className="px-4 py-3 font-medium text-right">Reward</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Fraud Flags</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {data?.data?.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(item.id)}
                                    onChange={() => toggleSelection(item.id)}
                                />
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {item.inserted_at || item.insertedAt
                                    ? format(new Date((item.inserted_at || item.insertedAt) as string), 'MMM dd, yyyy HH:mm')
                                    : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                                {item.event_type || item.eventType}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                                {item.beneficiary_name || item.beneficiary_user_id || item.beneficiaryUserId || '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                                ${convertUnits(item.reward_units || item.rewardUnits)}
                            </td>
                            <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || 'bg-slate-100 text-slate-800'}`}>
                                    {item.status}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                {(item.fraud_flags || item.fraudFlags || []).length > 0 ? (
                                    <span className="text-red-500 font-medium text-xs">{(item.fraud_flags || item.fraudFlags)?.join(', ')}</span>
                                ) : (
                                    <span className="text-slate-400 text-xs">None</span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <Button variant="outline" size="sm" onClick={() => navigate(`/revenue/events/${item.id}`)}>
                                    Details
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {data?.data?.length === 0 && (
                        <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                No events found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">Revenue Events</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <CardTitle>Events List</CardTitle>
                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <>
                                    <Button size="sm" onClick={() => handleBulkAction('APPROVE')} className="bg-emerald-600 hover:bg-emerald-700">
                                        Approve ({selectedIds.length})
                                    </Button>
                                    <Button size="sm" onClick={() => handleBulkAction('REJECT')} variant="destructive">
                                        Reject ({selectedIds.length})
                                    </Button>
                                </>
                            )}
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
                                <label className="text-xs font-medium text-slate-500">Type</label>
                                <Select value={typeFilter || 'ALL'} onValueChange={v => { setTypeFilter(v === 'ALL' ? '' : v); setPage(1); }}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Types</SelectItem>
                                        {TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Fraud Flags</label>
                                <Select value={hasFraudFlags || 'ALL'} onValueChange={v => { setHasFraudFlags(v === 'ALL' ? '' : v); setPage(1); }}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Any" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Any</SelectItem>
                                        <SelectItem value="true">Has Fraud Flags</SelectItem>
                                        <SelectItem value="false">No Fraud Flags</SelectItem>
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
                                <label className="text-xs font-medium text-slate-500">Beneficiary User ID</label>
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
                    {bulkError && (
                        <div className="mb-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-4 py-2">
                            {bulkError}
                        </div>
                    )}

                    <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                        <Button
                            variant={activeTab === 'all' ? 'default' : 'ghost'}
                            onClick={() => { setActiveTab('all'); setPage(1); }}
                        >
                            All Events
                        </Button>
                        <Button
                            variant={activeTab === 'fraud' ? 'default' : 'ghost'}
                            onClick={() => { setActiveTab('fraud'); setPage(1); }}
                        >
                            Fraud Queue
                        </Button>
                    </div>

                    {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : renderTable()}

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
                </CardContent>
            </Card>
        </div>
    );
};
