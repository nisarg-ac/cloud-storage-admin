import React, { useEffect, useState } from 'react';
import { OverviewResponse, earningService } from '../services/earning.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Activity, DollarSign, PieChart, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { convertUnits } from '../utils';

export const RevenueOverview = () => {
    const [data, setData] = useState<OverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                setLoading(true);
                const res = await earningService.getOverview();
                setData(res);
            } catch (error) {
                console.error('Failed to fetch revenue overview', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOverview();
    }, []);

    const statusIcons: Record<string, React.ReactNode> = {
        PENDING: <Clock className="w-5 h-5 text-amber-500" />,
        APPROVED: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        REJECTED: <AlertCircle className="w-5 h-5 text-red-500" />,
        PAYABLE: <DollarSign className="w-5 h-5 text-blue-500" />,
        PAID: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
        PROCESSING: <Activity className="w-5 h-5 text-indigo-500" />,
        FAILED: <AlertCircle className="w-5 h-5 text-red-600" />,
    };

    const statusColors: Record<string, string> = {
        PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
        APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
        REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        PAYABLE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        PAID: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
        PROCESSING: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center">Loading overview data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <PieChart className="w-6 h-6 text-blue-500" />
                    Revenue Overview
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Events */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Events</CardTitle>
                        <CardDescription>Platform-wide counts and totals for revenue events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.revenueEventsByStatus.map(status => (
                                <div key={status.status} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        {statusIcons[status.status]}
                                        <div>
                                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">{status.status}</h4>
                                            <p className="text-sm text-slate-500">{status.event_count} events</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                                            ${convertUnits(status.total_units)}
                                        </p>
                                        <Badge variant="secondary" className={statusColors[status.status] || ''}>
                                            {status.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {!data?.revenueEventsByStatus?.length && (
                                <p className="text-slate-500 text-center py-4">No revenue events found</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Payouts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payouts</CardTitle>
                        <CardDescription>Platform-wide counts and totals for user payouts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.payoutsByStatus.map(status => (
                                <div key={status.status} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        {statusIcons[status.status]}
                                        <div>
                                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">{status.status}</h4>
                                            <p className="text-sm text-slate-500">{status.payout_count} payouts</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                                            ${convertUnits(status.total_units)}
                                        </p>
                                        <Badge variant="secondary" className={statusColors[status.status] || ''}>
                                            {status.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {!data?.payoutsByStatus?.length && (
                                <p className="text-slate-500 text-center py-4">No payouts found</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
