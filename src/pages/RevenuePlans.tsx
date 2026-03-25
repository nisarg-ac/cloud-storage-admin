import { useEffect, useState } from 'react';
import { earningService, EarningPlan } from '../services/earning.service';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { format } from 'date-fns';
import { AlertTriangle, Plus, Pencil } from 'lucide-react';

type DialogMode = 'create' | 'edit' | null;

const EMPTY_FORM = {
    planName: '',
    planType: 'VIEW_BASED',
    description: '',
    rewardPerViewUnits: '',
    rewardPerSignupUnits: '',
    tierThreshold: '',
    tierRewardPerViewUnits: '',
    tierRewardPerSignupUnits: '',
    isActive: true,
};

type PlanForm = typeof EMPTY_FORM;

export const RevenuePlans = () => {
    const [plans, setPlans] = useState<EarningPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogMode, setDialogMode] = useState<DialogMode>(null);
    const [editingPlan, setEditingPlan] = useState<EarningPlan | null>(null);
    const [form, setForm] = useState<PlanForm>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const data = await earningService.getPlans();
            setPlans(data);
        } catch (error) {
            console.error('Failed to fetch plans', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const toUnits = (usd: string) => {
        const val = parseFloat(usd);
        if (isNaN(val)) return '0';
        return Math.round(val * 1_000_000).toString();
    };

    const fromUnits = (units?: string) => {
        if (!units) return '';
        return (Number(BigInt(units)) / 1_000_000).toString();
    };

    const convertUnits = (units?: string) => {
        if (!units) return '0.000000';
        return (Number(BigInt(units)) / 1_000_000).toFixed(6);
    };

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setFormError(null);
        setEditingPlan(null);
        setDialogMode('create');
    };

    const openEdit = (plan: EarningPlan) => {
        setForm({
            planName: plan.planName,
            planType: plan.planType,
            description: plan.description || '',
            rewardPerViewUnits: fromUnits(plan.rewardPerViewUnits),
            rewardPerSignupUnits: fromUnits(plan.rewardPerSignupUnits),
            tierThreshold: (plan as any).tierThreshold ?? '',
            tierRewardPerViewUnits: fromUnits((plan as any).tierRewardPerViewUnits),
            tierRewardPerSignupUnits: fromUnits((plan as any).tierRewardPerSignupUnits),
            isActive: plan.isActive,
        });
        setFormError(null);
        setEditingPlan(plan);
        setDialogMode('edit');
    };

    const closeDialog = () => {
        setDialogMode(null);
        setEditingPlan(null);
        setFormError(null);
    };

    const setField = (key: keyof PlanForm, value: string | boolean) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!form.planName.trim()) { setFormError('Plan name is required.'); return; }
        setSubmitting(true);
        setFormError(null);
        try {
            const payload: Partial<EarningPlan> & Record<string, any> = {
                planName: form.planName,
                planType: form.planType,
                description: form.description || undefined,
                rewardPerViewUnits: toUnits(form.rewardPerViewUnits || '0'),
                rewardPerSignupUnits: toUnits(form.rewardPerSignupUnits || '0'),
                isActive: form.isActive,
            };
            if (form.tierThreshold !== '') payload.tierThreshold = parseInt(form.tierThreshold) || 0;
            if (form.tierRewardPerViewUnits !== '') payload.tierRewardPerViewUnits = toUnits(form.tierRewardPerViewUnits);
            if (form.tierRewardPerSignupUnits !== '') payload.tierRewardPerSignupUnits = toUnits(form.tierRewardPerSignupUnits);

            if (dialogMode === 'create') {
                await earningService.createPlan(payload);
            } else if (dialogMode === 'edit' && editingPlan) {
                await earningService.updatePlan(editingPlan.id, payload);
            }
            closeDialog();
            fetchPlans();
        } catch (err: any) {
            setFormError(err?.response?.data?.message || 'Failed to save plan.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await earningService.updatePlanStatus(id, !currentStatus);
            fetchPlans();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading plans...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">Earning Plans</h1>
                <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create New Plan
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <Card key={plan.id} className={plan.isActive ? 'border-emerald-200 shadow-sm' : 'opacity-70 bg-slate-50 dark:bg-slate-900'}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="min-w-0 flex-1">
                                    <CardTitle className="text-lg truncate">{plan.planName}</CardTitle>
                                    <p className="text-xs text-slate-500 font-mono mt-1">{plan.planType}</p>
                                </div>
                                <Badge variant={plan.isActive ? 'default' : 'secondary'} className={`ml-2 shrink-0 ${plan.isActive ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                                    {plan.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {plan.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400">{plan.description}</p>
                            )}

                            <div className="space-y-2 text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Reward / View</span>
                                    <span className="font-semibold text-emerald-600">${convertUnits(plan.rewardPerViewUnits)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Reward / Signup</span>
                                    <span className="font-semibold text-emerald-600">${convertUnits(plan.rewardPerSignupUnits)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                                    <span className="text-slate-500">Min Views</span>
                                    <span className="font-medium">{plan.minViewsForReward}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Max Rewards/Day</span>
                                    <span className="font-medium">{plan.maxRewardsPerDay}</span>
                                </div>
                                {(plan as any).tierThreshold && (
                                    <>
                                        <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                                            <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Tier (after {(plan as any).tierThreshold} referrals)</p>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Tier / View</span>
                                                <span className="font-semibold text-blue-600">${convertUnits((plan as any).tierRewardPerViewUnits)}</span>
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-slate-500">Tier / Signup</span>
                                                <span className="font-semibold text-blue-600">${convertUnits((plan as any).tierRewardPerSignupUnits)}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                                <span className="text-xs text-slate-400">Updated {format(new Date(plan.updatedAt), 'MMM dd, yyyy')}</span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEdit(plan)}
                                        className="flex items-center gap-1"
                                    >
                                        <Pencil className="w-3 h-3" /> Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleStatus(plan.id, plan.isActive)}
                                        className={plan.isActive ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}
                                    >
                                        {plan.isActive ? 'Deactivate' : 'Activate'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {plans.length === 0 && (
                    <div className="p-8 text-center col-span-full text-slate-500">No plans available.</div>
                )}
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogMode !== null} onOpenChange={open => !open && closeDialog()}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{dialogMode === 'create' ? 'Create New Earning Plan' : 'Edit Earning Plan'}</DialogTitle>
                        <DialogDescription>
                            {dialogMode === 'create'
                                ? 'Define a new reward plan. Amounts are entered in USD and converted to micro-units.'
                                : 'Update the earning plan. Changes take effect immediately for new events.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 col-span-2">
                                <label className="text-sm font-medium">Plan Name <span className="text-red-500">*</span></label>
                                <Input value={form.planName} onChange={e => setField('planName', e.target.value)} placeholder="e.g. Standard View Plan" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Plan Type <span className="text-red-500">*</span></label>
                                <Select value={form.planType} onValueChange={v => setField('planType', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="VIEW_BASED">VIEW_BASED</SelectItem>
                                        <SelectItem value="SIGNUP_REFERRAL">SIGNUP_REFERRAL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Status</label>
                                <Select value={form.isActive ? 'true' : 'false'} onValueChange={v => setField('isActive', v === 'true')}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Optional description" />
                            </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Base Rewards (USD)</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Reward / View (USD)</label>
                                    <Input type="number" min={0} step="0.000001" value={form.rewardPerViewUnits} onChange={e => setField('rewardPerViewUnits', e.target.value)} placeholder="0.001" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Reward / Signup (USD)</label>
                                    <Input type="number" min={0} step="0.01" value={form.rewardPerSignupUnits} onChange={e => setField('rewardPerSignupUnits', e.target.value)} placeholder="2.00" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Tier Rewards (optional)</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2">
                                    <label className="text-sm font-medium">Tier Threshold (referral count)</label>
                                    <Input type="number" min={0} value={form.tierThreshold} onChange={e => setField('tierThreshold', e.target.value)} placeholder="e.g. 10 (leave blank to disable)" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Tier Reward / View (USD)</label>
                                    <Input type="number" min={0} step="0.000001" value={form.tierRewardPerViewUnits} onChange={e => setField('tierRewardPerViewUnits', e.target.value)} placeholder="0.0015" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Tier Reward / Signup (USD)</label>
                                    <Input type="number" min={0} step="0.01" value={form.tierRewardPerSignupUnits} onChange={e => setField('tierRewardPerSignupUnits', e.target.value)} placeholder="3.00" />
                                </div>
                            </div>
                        </div>

                        {formError && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {formError}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog} disabled={submitting}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                            {submitting ? 'Saving...' : dialogMode === 'create' ? 'Create Plan' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
