import { useEffect, useState, useCallback } from 'react';
import {
    appVersionsService,
    AppVersion,
    AppVersionPlatform,
    AddAppVersionPayload,
} from '../services/appVersions.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '../components/ui/tooltip';
import { Smartphone, Plus, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Check, X, Search } from 'lucide-react';
import { formatDate } from '../utils';
import { useDebounce } from '../hooks/useDebounce';

const PAGE_SIZE = 10;

const PLATFORMS: AppVersionPlatform[] = ['ANDROID', 'IOS', 'WEB', 'OTHER'];

const PLATFORM_BADGE: Record<AppVersionPlatform, string> = {
    ANDROID: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    IOS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    WEB: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
    OTHER: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

// ─── Add Version Dialog ───────────────────────────────────────────────────────

interface AddVersionDialogProps {
    open: boolean;
    saving: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (payload: AddAppVersionPayload) => void;
}

const AddVersionDialog = ({ open, saving, error, onClose, onSubmit }: AddVersionDialogProps) => {
    const [appVersion, setAppVersion] = useState('');
    const [platform, setPlatform] = useState<AppVersionPlatform | ''>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [updatesRaw, setUpdatesRaw] = useState('');
    const [isHardUpdate, setIsHardUpdate] = useState(false);

    useEffect(() => {
        if (open) {
            setAppVersion('');
            setPlatform('');
            setTitle('');
            setDescription('');
            setUpdatesRaw('');
            setIsHardUpdate(false);
        }
    }, [open]);

    const canSubmit =
        appVersion.trim().length > 0 &&
        platform !== '' &&
        title.trim().length > 0 &&
        description.trim().length > 0;

    const handleSubmit = () => {
        if (!canSubmit) return;
        const updates = updatesRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        onSubmit({
            appVersion: appVersion.trim(),
            platform: platform as AppVersionPlatform,
            title: title.trim(),
            description: description.trim(),
            isHardUpdate,
            updates: updates.length > 0 ? updates : undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add App Version</DialogTitle>
                    <DialogDescription>
                        The new version will automatically become the latest for its platform.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Version */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Version <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={appVersion}
                                onChange={(e) => setAppVersion(e.target.value)}
                                placeholder="e.g. 1.3.0"
                            />
                        </div>

                        {/* Platform */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Platform <span className="text-red-500">*</span>
                            </label>
                            <Select value={platform} onValueChange={(v) => setPlatform(v as AppVersionPlatform)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PLATFORMS.map((p) => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Performance improvements"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Full release notes shown to the user…"
                            rows={3}
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>

                    {/* Updates */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Updates{' '}
                            <span className="text-slate-400 font-normal">(comma-separated, optional)</span>
                        </label>
                        <Input
                            value={updatesRaw}
                            onChange={(e) => setUpdatesRaw(e.target.value)}
                            placeholder="Fixed crash on login, Improved upload speed"
                        />
                    </div>

                    {/* Force update toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Force Update</p>
                            <p className="text-xs text-slate-400 mt-0.5">Users must update before they can continue using the app</p>
                        </div>
                        <Button
                            type="button"
                            variant={isHardUpdate ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setIsHardUpdate((v) => !v)}
                            className={`w-20 justify-between ${isHardUpdate ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' : ''}`}
                        >
                            {isHardUpdate ? (
                                <><span>ON</span><Check className="w-3.5 h-3.5" /></>
                            ) : (
                                <><span>OFF</span><X className="w-3.5 h-3.5" /></>
                            )}
                        </Button>
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
                        {saving ? 'Adding…' : 'Add Version'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

interface DeleteConfirmDialogProps {
    target: AppVersion | null;
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
                    Delete App Version
                </DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete version{' '}
                    <span className="font-semibold text-slate-800 dark:text-white">
                        {target?.appVersion}
                    </span>{' '}
                    for{' '}
                    <span className="font-semibold text-slate-800 dark:text-white">
                        {target?.platform}
                    </span>
                    ? This cannot be undone.
                    {target?.latestVersion && (
                        <span className="block mt-2 text-amber-600 dark:text-amber-400">
                            This is the latest version — the next-newest release will be promoted automatically.
                        </span>
                    )}
                </DialogDescription>
            </DialogHeader>
            {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                    {error}
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
                <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
                    {deleting ? 'Deleting…' : 'Delete'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AppVersions = () => {
    const [versions, setVersions] = useState<AppVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const [platformFilter, setPlatformFilter] = useState<AppVersionPlatform | ''>('');
    const [searchInput, setSearchInput] = useState('');
    const search = useDebounce(searchInput, 400);

    // Add dialog
    const [addOpen, setAddOpen] = useState(false);
    const [addSaving, setAddSaving] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    // Delete dialog
    const [deletingVersion, setDeletingVersion] = useState<AppVersion | null>(null);
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const fetchVersions = useCallback(async (currentPage: number) => {
        setLoading(true);
        try {
            const result = await appVersionsService.list({
                page: currentPage,
                limit: PAGE_SIZE,
                platform: platformFilter || undefined,
                search: search || undefined,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });
            setVersions(result.data);
            setTotalPages(result.meta.totalPages);
            setTotal(result.meta.total);
        } catch (err) {
            console.error('Failed to fetch app versions', err);
        } finally {
            setLoading(false);
        }
    }, [platformFilter, search]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [platformFilter, search]);

    useEffect(() => {
        fetchVersions(page);
    }, [page, fetchVersions]);

    // ── Add ──
    const handleAdd = async (payload: AddAppVersionPayload) => {
        setAddSaving(true);
        setAddError(null);
        try {
            await appVersionsService.add(payload);
            setAddOpen(false);
            await fetchVersions(1);
            setPage(1);
        } catch (err: unknown) {
            const apiError = err as import('axios').AxiosError<{ error?: string; message?: string }>;
            setAddError(
                apiError?.response?.data?.error ||
                apiError?.response?.data?.message ||
                'Failed to add version'
            );
        } finally {
            setAddSaving(false);
        }
    };

    // ── Delete ──
    const confirmDelete = async () => {
        if (!deletingVersion) return;
        setDeleteInProgress(true);
        setDeleteError(null);
        try {
            await appVersionsService.remove(deletingVersion.id);
            setDeletingVersion(null);
            // Stay on current page; if it becomes empty the list will naturally shrink
            await fetchVersions(page);
        } catch (err: unknown) {
            const apiError = err as import('axios').AxiosError<{ error?: string; message?: string }>;
            setDeleteError(
                apiError?.response?.data?.error ||
                apiError?.response?.data?.message ||
                'Failed to delete version'
            );
        } finally {
            setDeleteInProgress(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl">
            <div>
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <Smartphone className="w-6 h-6 text-indigo-500" />
                    App Versions
                </h1>
                <p className="text-slate-500 mt-1">Manage release history per platform. The newest version becomes the latest automatically.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Version History</CardTitle>
                            <CardDescription className="mt-1">
                                {total > 0 ? `${total} version${total !== 1 ? 's' : ''} across all platforms` : 'No versions yet'}
                            </CardDescription>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => { setAddError(null); setAddOpen(true); }}
                            className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add Version
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search version, title…"
                                className="pl-9"
                            />
                        </div>
                        <Select
                            value={platformFilter || 'ALL'}
                            onValueChange={(v) => setPlatformFilter(v === 'ALL' ? '' : v as AppVersionPlatform)}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All platforms" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All platforms</SelectItem>
                                {PLATFORMS.map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <div className="py-12 text-center text-sm text-slate-400">Loading versions…</div>
                    ) : versions.length === 0 ? (
                        <div className="py-12 text-center space-y-3">
                            <Smartphone className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                            <p className="text-slate-500 text-sm">
                                {search || platformFilter ? 'No versions match your filters.' : 'No app versions yet.'}
                            </p>
                            {!search && !platformFilter && (
                                <Button variant="outline" size="sm" onClick={() => { setAddError(null); setAddOpen(true); }}>
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    Add your first version
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Version</TableHead>
                                        <TableHead>Platform</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Updates</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {versions.map((v) => (
                                        <TableRow key={v.id}>
                                            {/* Version + Latest badge */}
                                            <TableCell>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                                                        {v.appVersion}
                                                    </span>
                                                    {v.latestVersion && (
                                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-xs px-1.5 py-0">
                                                            Latest
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Platform */}
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PLATFORM_BADGE[v.platform]}`}>
                                                    {v.platform}
                                                </span>
                                            </TableCell>

                                            {/* Title */}
                                            <TableCell className="max-w-[180px]">
                                                <span className="text-sm text-slate-700 dark:text-slate-300 truncate block" title={v.title}>
                                                    {v.title}
                                                </span>
                                            </TableCell>

                                            {/* Type */}
                                            <TableCell>
                                                {v.isHardUpdate ? (
                                                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0 text-xs">
                                                        Hard Update
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Soft</span>
                                                )}
                                            </TableCell>

                                            {/* Updates count with tooltip */}
                                            <TableCell>
                                                {v.updates && v.updates.length > 0 ? (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 cursor-default">
                                                                {v.updates.length} change{v.updates.length !== 1 ? 's' : ''}
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-xs" side="left">
                                                            <ul className="space-y-1 text-xs">
                                                                {v.updates.map((u, i) => (
                                                                    <li key={i} className="flex gap-1.5">
                                                                        <span className="text-slate-400 shrink-0">•</span>
                                                                        <span>{u}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">—</span>
                                                )}
                                            </TableCell>

                                            {/* Created At */}
                                            <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                                                {formatDate(v.createdAt)}
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setDeleteError(null); setDeletingVersion(v); }}
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-sm text-slate-500">
                                        Page {page} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => p - 1)}
                                            disabled={page <= 1}
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => p + 1)}
                                            disabled={page >= totalPages}
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <AddVersionDialog
                open={addOpen}
                saving={addSaving}
                error={addError}
                onClose={() => { if (!addSaving) setAddOpen(false); }}
                onSubmit={handleAdd}
            />

            <DeleteConfirmDialog
                target={deletingVersion}
                deleting={deleteInProgress}
                error={deleteError}
                onClose={() => { if (!deleteInProgress) setDeletingVersion(null); }}
                onConfirm={confirmDelete}
            />
        </div>
    );
};
