import { useEffect, useState } from 'react';
import { earningService, AuditLogItem } from '../services/earning.service';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Download, Filter, X } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

const ACTION_OPTIONS = [
    'APPROVE_EVENT',
    'REJECT_EVENT',
    'MANUAL_FLAG',
    'OVERRIDE_FRAUD_FLAG',
    'APPROVE_PAYOUT',
    'HOLD_PAYOUT',
    'RELEASE_PAYOUT',
    'MARK_PAYOUT_PAID',
    'MARK_PAYOUT_FAILED',
    'RETRY_PAYOUT',
    'SUSPEND_EARNING',
    'REINSTATE_EARNING',
    'ADMIN_PLAN_OVERRIDE',
    'BLOCK_PAYOUTS',
    'UNBLOCK_PAYOUTS',
    'UPDATE_CONFIG',
    'CREATE_PLAN',
    'UPDATE_PLAN',
];

const ENTITY_OPTIONS = [
    { value: 'revenue_event', label: 'Revenue Event' },
    { value: 'payout', label: 'Payout' },
    { value: 'user', label: 'User' },
    { value: 'system_config', label: 'System Config' },
    { value: 'earning_plan', label: 'Earning Plan' },
];

export const AuditLog = () => {
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [adminUserIdFilter, setAdminUserIdFilter] = useState('');
    const [entityIdFilter, setEntityIdFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await earningService.getAuditLog({
                page,
                limit: 50,
                action: actionFilter || undefined,
                entityType: entityFilter || undefined,
                adminUserId: adminUserIdFilter || undefined,
                entityId: entityIdFilter || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
            });
            setLogs(data.data);
            setTotal(data.total);
        } catch (error) {
            console.error('Failed to fetch audit log', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, entityFilter, adminUserIdFilter, entityIdFilter, dateFrom, dateTo]);

    const clearFilters = () => {
        setActionFilter('');
        setEntityFilter('');
        setAdminUserIdFilter('');
        setEntityIdFilter('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const hasActiveFilters = actionFilter || entityFilter || adminUserIdFilter || entityIdFilter || dateFrom || dateTo;

    const handleExportCSV = () => {
        const token = useAuthStore.getState().token;
        const url = new URL(`${import.meta.env.VITE_API_URL}/web/earning/audit-log`);
        url.searchParams.append('format', 'csv');
        url.searchParams.append('limit', '200');
        if (actionFilter) url.searchParams.append('action', actionFilter);
        if (entityFilter) url.searchParams.append('entityType', entityFilter);
        if (adminUserIdFilter) url.searchParams.append('adminUserId', adminUserIdFilter);
        if (entityIdFilter) url.searchParams.append('entityId', entityIdFilter);
        if (dateFrom) url.searchParams.append('dateFrom', dateFrom);
        if (dateTo) url.searchParams.append('dateTo', dateTo);

        fetch(url.toString(), {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `audit_log_${format(new Date(), 'yyyyMMdd')}.csv`;
                a.click();
            });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">System Audit Log</h1>
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
                    <Button onClick={handleExportCSV} variant="outline" className="flex gap-2 items-center">
                        <Download className="w-4 h-4" /> Export CSV
                    </Button>
                </div>
            </div>

            {showFilters && (
                <Card>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Action</label>
                                <select
                                    value={actionFilter}
                                    onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                                    className="w-full border border-slate-200 dark:border-slate-700 rounded-md p-2 bg-white dark:bg-slate-900 text-sm"
                                >
                                    <option value="">All Actions</option>
                                    {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Entity Type</label>
                                <select
                                    value={entityFilter}
                                    onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
                                    className="w-full border border-slate-200 dark:border-slate-700 rounded-md p-2 bg-white dark:bg-slate-900 text-sm"
                                >
                                    <option value="">All Entities</option>
                                    {ENTITY_OPTIONS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Date From</label>
                                <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="h-9 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Date To</label>
                                <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="h-9 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Admin User ID</label>
                                <Input
                                    placeholder="UUID..."
                                    value={adminUserIdFilter}
                                    onChange={e => { setAdminUserIdFilter(e.target.value); setPage(1); }}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Entity ID</label>
                                <Input
                                    placeholder="UUID..."
                                    value={entityIdFilter}
                                    onChange={e => { setEntityIdFilter(e.target.value); setPage(1); }}
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading audit logs...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-4 py-3">Timestamp</th>
                                        <th className="px-4 py-3">Admin</th>
                                        <th className="px-4 py-3">Action</th>
                                        <th className="px-4 py-3">Entity</th>
                                        <th className="px-4 py-3">Change</th>
                                        <th className="px-4 py-3">Note</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                                                {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                                {log.admin_user_id.split('-')[0]}…
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="text-xs">{log.action}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                <div className="text-slate-500">{log.entity_type}</div>
                                                <div className="font-mono text-slate-400">{log.entity_id.split('-')[0]}…</div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">
                                                {log.before_value && log.after_value ? (
                                                    <span>
                                                        <span className="text-red-500">{JSON.stringify(log.before_value)}</span>
                                                        {' → '}
                                                        <span className="text-emerald-600">{JSON.stringify(log.after_value)}</span>
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-3 max-w-xs truncate text-xs text-slate-600 dark:text-slate-400">
                                                {log.note || <span className="text-slate-400">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-500">No logs found matching criteria</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {total > 0 && (
                                <div className="p-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-sm text-slate-500">
                                        Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                                        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 50 >= total}>Next</Button>
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
