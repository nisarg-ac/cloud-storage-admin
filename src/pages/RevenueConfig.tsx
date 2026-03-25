import { useEffect, useState } from 'react';
import { earningService, SystemConfig, SystemConfigHistory } from '../services/earning.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Settings, History, Save } from 'lucide-react';

export const RevenueConfig = () => {
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [history, setHistory] = useState<SystemConfigHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Form state — store as strings for inputs, convert on save
    const [highVelocityThreshold, setHighVelocityThreshold] = useState('');
    const [ipClusterThreshold, setIpClusterThreshold] = useState('');
    const [ipRateLimitPerMin, setIpRateLimitPerMin] = useState('');
    const [fraudHoldDays, setFraudHoldDays] = useState('');
    const [payoutHoldDays, setPayoutHoldDays] = useState('');

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const data = await earningService.getConfig();
            setConfig(data.config);
            setHistory(data.history);
            setHighVelocityThreshold(data.config.HIGH_VELOCITY_THRESHOLD ?? '100');
            setIpClusterThreshold(data.config.IP_CLUSTER_THRESHOLD ?? '5');
            setIpRateLimitPerMin(data.config.IP_RATE_LIMIT_PER_MIN ?? '60');
            setFraudHoldDays(data.config.FRAUD_HOLD_DAYS ?? '1');
            setPayoutHoldDays(data.config.PAYOUT_HOLD_DAYS ?? '3');
        } catch (error) {
            console.error('Failed to fetch config', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);
        try {
            await earningService.updateConfig({
                highVelocityThreshold: parseInt(highVelocityThreshold) || undefined,
                ipClusterThreshold: parseInt(ipClusterThreshold) || undefined,
                ipRateLimitPerMin: parseInt(ipRateLimitPerMin) || undefined,
                fraudHoldDays: parseInt(fraudHoldDays) || undefined,
                payoutHoldDays: parseInt(payoutHoldDays) || undefined,
            });
            setSaveSuccess(true);
            fetchConfig();
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error: any) {
            setSaveError(error?.response?.data?.message || 'Failed to update config');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading configuration...</div>;

    const configFields = [
        {
            key: 'highVelocityThreshold',
            label: 'High Velocity Threshold',
            description: 'Max views from one IP within 1 hour before HIGH_VELOCITY fraud flag triggers',
            value: highVelocityThreshold,
            setValue: setHighVelocityThreshold,
            current: config?.HIGH_VELOCITY_THRESHOLD,
        },
        {
            key: 'ipClusterThreshold',
            label: 'IP Cluster Threshold',
            description: 'Max unique users per IP within 24 hours before IP_CLUSTER fraud flag triggers',
            value: ipClusterThreshold,
            setValue: setIpClusterThreshold,
            current: config?.IP_CLUSTER_THRESHOLD,
        },
        {
            key: 'ipRateLimitPerMin',
            label: 'IP Rate Limit Per Minute',
            description: 'Max view events per IP per minute before rate-limiting kicks in',
            value: ipRateLimitPerMin,
            setValue: setIpRateLimitPerMin,
            current: config?.IP_RATE_LIMIT_PER_MIN,
        },
        {
            key: 'fraudHoldDays',
            label: 'Fraud Hold Days',
            description: 'Days a flagged event stays in fraud hold before the worker re-processes it',
            value: fraudHoldDays,
            setValue: setFraudHoldDays,
            current: config?.FRAUD_HOLD_DAYS,
        },
        {
            key: 'payoutHoldDays',
            label: 'Payout Hold Days',
            description: 'Holding period (days) before a payout can be approved for disbursement',
            value: payoutHoldDays,
            setValue: setPayoutHoldDays,
            current: config?.PAYOUT_HOLD_DAYS,
        },
    ];

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Settings className="w-6 h-6 text-blue-500" />
                        Revenue Configuration
                    </h1>
                    <p className="text-slate-500 mt-1">Manage fraud detection thresholds and payout hold rules</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>Changes take effect immediately for new events and payouts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {configFields.map(field => (
                        <div key={field.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {field.label}
                                </label>
                                <p className="text-xs text-slate-500">{field.description}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="number"
                                    min={0}
                                    value={field.value}
                                    onChange={e => field.setValue(e.target.value)}
                                    className="w-full"
                                />
                                {field.current && field.value !== field.current && (
                                    <span className="text-xs text-amber-500 whitespace-nowrap">was {field.current}</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {saveError && (
                        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-4 py-2">
                            {saveError}
                        </div>
                    )}
                    {saveSuccess && (
                        <div className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md px-4 py-2">
                            Configuration saved successfully.
                        </div>
                    )}

                    <div className="pt-2 flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {history.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="w-5 h-5 text-slate-400" />
                            Recent Changes
                        </CardTitle>
                        <CardDescription>Last 20 configuration updates</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 font-medium">Config Key</th>
                                        <th className="px-4 py-3 font-medium">Before</th>
                                        <th className="px-4 py-3 font-medium">After</th>
                                        <th className="px-4 py-3 font-medium">Admin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {history.map(entry => (
                                        <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                                {format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">
                                                <Badge variant="outline">{entry.entity_id}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {entry.before_value?.value ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                                {entry.after_value?.value ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                                {entry.admin_user_id.split('-')[0]}…
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
