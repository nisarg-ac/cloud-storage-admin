import { useEffect, useState } from 'react';
import { appConfigService } from '../services/appConfig.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Settings, Globe, Monitor, Check, X } from 'lucide-react';

export const AppConfig = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Form state
    const [isWebsurfer, setIsWebsurfer] = useState(false);
    const [isDisplay, setIsDisplay] = useState(false);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const data = await appConfigService.getAppConfig();
            setIsWebsurfer(data.isWebsurfer);
            setIsDisplay(data.isDisplay);
        } catch (error) {
            console.error('Failed to fetch app config', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleToggle = async (fieldId: string, newValue: boolean) => {
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);
        try {
            const updatedConfig = {
                isWebsurfer: fieldId === 'isWebsurfer' ? newValue : isWebsurfer,
                isDisplay: fieldId === 'isDisplay' ? newValue : isDisplay,
            };

            await appConfigService.updateAppConfig(updatedConfig);

            // Update local state
            if (fieldId === 'isWebsurfer') {
                setIsWebsurfer(newValue);
            } else {
                setIsDisplay(newValue);
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error: unknown) {
            const apiError = error as import('axios').AxiosError<{ message?: string }>;
            setSaveError(apiError?.response?.data?.message || 'Failed to update app config');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading app configuration...</div>;

    const fields = [
        {
            id: 'isWebsurfer',
            label: 'Web Surfer',
            description: 'Enables or disables web surfing URLs in the mobile app',
            icon: Globe,
            value: isWebsurfer,
        },
        {
            id: 'isDisplay',
            label: 'Display Banner',
            description: 'Enables or disables the display banner in the mobile app',
            icon: Monitor,
            value: isDisplay,
        },
    ];

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Settings className="w-6 h-6 text-indigo-500" />
                        App Configuration
                    </h1>
                    <p className="text-slate-500 mt-1">Manage mobile app feature flags and global settings</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Feature Flags</CardTitle>
                    <CardDescription>Changes take effect immediately for all mobile users on their next config fetch.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid gap-6">
                        {fields.map((field) => {
                            const Icon = field.icon;
                            return (
                                <div key={field.id} className="flex items-start justify-between p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="flex gap-4">
                                        <div className="mt-1 p-2 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{field.label}</h3>
                                            <p className="text-sm text-slate-500 mt-0.5">{field.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={field.value ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleToggle(field.id, !field.value)}
                                            disabled={saving}
                                            className={`w-24 justify-between transition-all ${field.value ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                                        >
                                            {field.value ? (
                                                <>
                                                    <span>ON</span>
                                                    <Check className="w-3.5 h-3.5" />
                                                </>
                                            ) : (
                                                <>
                                                    <span>OFF</span>
                                                    <X className="w-3.5 h-3.5" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {saveError && (
                        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-4 py-2">
                            {saveError}
                        </div>
                    )}
                    {saveSuccess && (
                        <div className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md px-4 py-2">
                            App configuration saved successfully.
                        </div>
                    )}

                </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 flex gap-3">
                <Globe className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-400">
                    <p className="font-semibold">Important Note</p>
                    <p className="mt-1">All changes made here are recorded in the admin audit log. Feature flags default to <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">Disabled</code> on first deploy.</p>
                </div>
            </div>
        </div>
    );
};
