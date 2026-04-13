import { useEffect, useState } from 'react';
import { appConfigService, AdConfigRow, AdConfigUpsertPayload } from '../services/appConfig.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '../components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
import { Settings, Globe, Check, X, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { formatDate } from '../utils';

// Known slugs for datalist suggestions
const VENDOR_SLUGS = ['admob', 'facebook', 'unity', 'applovin'];
const FORMAT_SLUGS = ['banner', 'interstitial', 'rewarded', 'native', 'app_open'];

// ─── Ad Config Form Dialog ────────────────────────────────────────────────────

interface AdConfigFormDialogProps {
    open: boolean;
    initial: AdConfigRow | null;
    saving: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (vendor: string, format: string, payload: AdConfigUpsertPayload) => void;
}

const AdConfigFormDialog = ({ open, initial, saving, error, onClose, onSubmit }: AdConfigFormDialogProps) => {
    const isEdit = initial !== null;
    const [vendor, setVendor] = useState('');
    const [format, setFormat] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [metadataRaw, setMetadataRaw] = useState('');
    const [metadataError, setMetadataError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setVendor(initial?.vendor ?? '');
            setFormat(initial?.format ?? '');
            setEnabled(initial?.enabled ?? true);
            setMetadataRaw(initial?.metadata ? JSON.stringify(initial.metadata, null, 2) : '');
            setMetadataError(null);
        }
    }, [open, initial]);

    const handleSubmit = () => {
        setMetadataError(null);
        let metadata: Record<string, unknown> | undefined;
        if (metadataRaw.trim()) {
            try {
                metadata = JSON.parse(metadataRaw);
            } catch {
                setMetadataError('Invalid JSON — please fix the metadata before saving.');
                return;
            }
        }
        onSubmit(vendor.trim(), format.trim(), { enabled, metadata });
    };

    const canSubmit = vendor.trim().length > 0 && format.trim().length > 0;

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Ad Config Entry' : 'Add Ad Config Entry'}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? `Editing ${initial!.vendor} / ${initial!.format}`
                            : 'Configure a new vendor and ad format combination.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Vendor */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Vendor <span className="text-red-500">*</span>
                        </label>
                        <Input
                            list="vendor-slugs"
                            value={vendor}
                            onChange={(e) => setVendor(e.target.value)}
                            placeholder="e.g. admob"
                            disabled={isEdit}
                        />
                        <datalist id="vendor-slugs">
                            {VENDOR_SLUGS.map((s) => <option key={s} value={s} />)}
                        </datalist>
                        {isEdit && (
                            <p className="text-xs text-slate-400">Vendor cannot be changed — delete and re-add to change it.</p>
                        )}
                    </div>

                    {/* Format */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Format <span className="text-red-500">*</span>
                        </label>
                        <Input
                            list="format-slugs"
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            placeholder="e.g. banner"
                            disabled={isEdit}
                        />
                        <datalist id="format-slugs">
                            {FORMAT_SLUGS.map((s) => <option key={s} value={s} />)}
                        </datalist>
                        {isEdit && (
                            <p className="text-xs text-slate-400">Format cannot be changed — delete and re-add to change it.</p>
                        )}
                    </div>

                    {/* Enabled toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Enabled</p>
                            <p className="text-xs text-slate-400 mt-0.5">Whether this vendor/format combination is active</p>
                        </div>
                        <Button
                            type="button"
                            variant={enabled ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setEnabled((v) => !v)}
                            className={`w-20 justify-between ${enabled ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                        >
                            {enabled ? (
                                <><span>ON</span><Check className="w-3.5 h-3.5" /></>
                            ) : (
                                <><span>OFF</span><X className="w-3.5 h-3.5" /></>
                            )}
                        </Button>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Metadata <span className="text-slate-400 font-normal">(optional JSON)</span>
                        </label>
                        <textarea
                            value={metadataRaw}
                            onChange={(e) => { setMetadataRaw(e.target.value); setMetadataError(null); }}
                            placeholder={'{\n  "unitId": "ca-app-pub-xxx/yyy"\n}'}
                            rows={5}
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        {metadataError && (
                            <p className="text-xs text-red-500">{metadataError}</p>
                        )}
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving || !canSubmit}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Entry'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

interface DeleteConfirmDialogProps {
    target: AdConfigRow | null;
    deleting: boolean;
    error: string | null;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteConfirmDialog = ({ target, deleting, error, onClose, onConfirm }: DeleteConfirmDialogProps) => (
    <Dialog open={target !== null} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="sm:max-w-sm">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Delete Ad Config Entry
                </DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete{' '}
                    <span className="font-semibold text-slate-800 dark:text-white">
                        {target?.vendor}/{target?.format}
                    </span>
                    ? This cannot be undone.
                </DialogDescription>
            </DialogHeader>
            {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                    {error}
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
                <Button
                    variant="destructive"
                    onClick={onConfirm}
                    disabled={deleting}
                >
                    {deleting ? 'Deleting…' : 'Delete'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

// ─── Metadata preview ─────────────────────────────────────────────────────────

const MetadataPreview = ({ metadata }: { metadata: Record<string, unknown> | null }) => {
    if (!metadata) return <span className="text-slate-400">—</span>;
    const entries = Object.entries(metadata);
    if (entries.length === 0) return <span className="text-slate-400">—</span>;
    return (
        <div className="space-y-0.5">
            {entries.map(([k, v]) => (
                <p key={k} className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    <span className="text-slate-400">{k}:</span> {String(v)}
                </p>
            ))}
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AppConfig = () => {
    // ── App Config state ──
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isWebsurfer, setIsWebsurfer] = useState(false);

    // ── Ad Config state ──
    const [adRows, setAdRows] = useState<AdConfigRow[]>([]);
    const [adLoading, setAdLoading] = useState(true);

    // Form dialog
    const [formOpen, setFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<AdConfigRow | null>(null);
    const [formSaving, setFormSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Delete dialog
    const [deletingRow, setDeletingRow] = useState<AdConfigRow | null>(null);
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Inline enable toggle per row
    const [togglingKey, setTogglingKey] = useState<string | null>(null);

    // ── Fetch ──
    const fetchAppConfig = async () => {
        try {
            const data = await appConfigService.getAppConfig();
            setIsWebsurfer(data.isWebsurfer);
        } catch (err) {
            console.error('Failed to fetch app config', err);
        }
    };

    const fetchAdConfig = async () => {
        setAdLoading(true);
        try {
            const rows = await appConfigService.getAdConfig();
            setAdRows(rows);
        } catch (err) {
            console.error('Failed to fetch ad config', err);
        } finally {
            setAdLoading(false);
        }
    };

    useEffect(() => {
        Promise.all([fetchAppConfig(), fetchAdConfig()]).finally(() => setLoading(false));
    }, []);

    // ── App Config toggle ──
    const handleWebsurferToggle = async () => {
        const newValue = !isWebsurfer;
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);
        try {
            await appConfigService.updateAppConfig({ isWebsurfer: newValue });
            setIsWebsurfer(newValue);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (err: unknown) {
            const apiError = err as import('axios').AxiosError<{ message?: string }>;
            setSaveError(apiError?.response?.data?.message || 'Failed to update app config');
        } finally {
            setSaving(false);
        }
    };

    // ── Ad Config: open add/edit form ──
    const openAdd = () => {
        setEditingRow(null);
        setFormError(null);
        setFormOpen(true);
    };

    const openEdit = (row: AdConfigRow) => {
        setEditingRow(row);
        setFormError(null);
        setFormOpen(true);
    };

    const closeForm = () => {
        if (!formSaving) setFormOpen(false);
    };

    // ── Ad Config: upsert ──
    const handleFormSubmit = async (vendor: string, format: string, payload: AdConfigUpsertPayload) => {
        setFormSaving(true);
        setFormError(null);
        try {
            await appConfigService.upsertAdConfig(vendor, format, payload);
            setFormOpen(false);
            await fetchAdConfig();
        } catch (err: unknown) {
            const apiError = err as import('axios').AxiosError<{ message?: string }>;
            setFormError(apiError?.response?.data?.message || 'Failed to save entry');
        } finally {
            setFormSaving(false);
        }
    };

    // ── Ad Config: inline enabled toggle ──
    const handleRowToggle = async (row: AdConfigRow) => {
        const key = `${row.vendor}/${row.format}`;
        setTogglingKey(key);
        try {
            await appConfigService.upsertAdConfig(row.vendor, row.format, {
                enabled: !row.enabled,
                metadata: row.metadata ?? undefined,
            });
            await fetchAdConfig();
        } catch (err) {
            console.error('Failed to toggle ad config entry', err);
        } finally {
            setTogglingKey(null);
        }
    };

    // ── Ad Config: delete ──
    const confirmDelete = async () => {
        if (!deletingRow) return;
        setDeleteInProgress(true);
        setDeleteError(null);
        try {
            await appConfigService.deleteAdConfig(deletingRow.vendor, deletingRow.format);
            setDeletingRow(null);
            await fetchAdConfig();
        } catch (err: unknown) {
            const apiError = err as import('axios').AxiosError<{ message?: string }>;
            setDeleteError(apiError?.response?.data?.message || 'Failed to delete entry');
        } finally {
            setDeleteInProgress(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading app configuration...</div>;

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <Settings className="w-6 h-6 text-indigo-500" />
                    App Configuration
                </h1>
                <p className="text-slate-500 mt-1">Manage mobile app feature flags and ad network settings</p>
            </div>

            {/* ── Feature Flags ── */}
            <Card>
                <CardHeader>
                    <CardTitle>Feature Flags</CardTitle>
                    <CardDescription>Changes take effect immediately for all mobile users on their next config fetch.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start justify-between p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex gap-4">
                            <div className="mt-1 p-2 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                                <Globe className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Web Surfer</h3>
                                <p className="text-sm text-slate-500 mt-0.5">Enables or disables web surfing URLs in the mobile app</p>
                            </div>
                        </div>
                        <Button
                            variant={isWebsurfer ? 'default' : 'outline'}
                            size="sm"
                            onClick={handleWebsurferToggle}
                            disabled={saving}
                            className={`w-24 justify-between transition-all ${isWebsurfer ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                        >
                            {isWebsurfer ? (
                                <><span>ON</span><Check className="w-3.5 h-3.5" /></>
                            ) : (
                                <><span>OFF</span><X className="w-3.5 h-3.5" /></>
                            )}
                        </Button>
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

            {/* ── Ad Configuration ── */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle>Ad Configuration</CardTitle>
                            <CardDescription className="mt-1">
                                Manage ad vendor and format combinations served to mobile users.
                            </CardDescription>
                        </div>
                        <Button
                            size="sm"
                            onClick={openAdd}
                            className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add Entry
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {adLoading ? (
                        <div className="py-8 text-center text-sm text-slate-400">Loading ad config...</div>
                    ) : adRows.length === 0 ? (
                        <div className="py-10 text-center space-y-2">
                            <p className="text-slate-500 text-sm">No ad config entries yet.</p>
                            <Button variant="outline" size="sm" onClick={openAdd}>
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add your first entry
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Format</TableHead>
                                    <TableHead>Enabled</TableHead>
                                    <TableHead>Metadata</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adRows.map((row) => {
                                    const key = `${row.vendor}/${row.format}`;
                                    const isToggling = togglingKey === key;
                                    return (
                                        <TableRow key={key}>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {row.vendor}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {row.format}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant={row.enabled ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => handleRowToggle(row)}
                                                    disabled={isToggling}
                                                    className={`w-20 justify-between transition-all ${row.enabled ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                                                >
                                                    {row.enabled ? (
                                                        <><span>ON</span><Check className="w-3.5 h-3.5" /></>
                                                    ) : (
                                                        <><span>OFF</span><X className="w-3.5 h-3.5" /></>
                                                    )}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <MetadataPreview metadata={row.metadata} />
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                                                {formatDate(row.updated_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEdit(row)}
                                                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => { setDeleteError(null); setDeletingRow(row); }}
                                                        className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 flex gap-3">
                <Globe className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-400">
                    <p className="font-semibold">Important Note</p>
                    <p className="mt-1">All changes are recorded in the admin audit log. Feature flags default to <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">Disabled</code> on first deploy.</p>
                </div>
            </div>

            {/* ── Dialogs ── */}
            <AdConfigFormDialog
                open={formOpen}
                initial={editingRow}
                saving={formSaving}
                error={formError}
                onClose={closeForm}
                onSubmit={handleFormSubmit}
            />

            <DeleteConfirmDialog
                target={deletingRow}
                deleting={deleteInProgress}
                error={deleteError}
                onClose={() => { if (!deleteInProgress) setDeletingRow(null); }}
                onConfirm={confirmDelete}
            />
        </div>
    );
};
