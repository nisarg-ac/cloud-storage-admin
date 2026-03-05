import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { Link, useNavigate } from "react-router-dom";
import { useReportedStore } from "../store/reported.store";
import { useAuthStore, isSuperAdmin } from "../store/auth.store";
import { formatDate } from "../utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "../components/ui/tooltip";
import { Input } from "../components/ui/input";
import { Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";

export const ReportedFiles = () => {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const superAdmin = isSuperAdmin(user);
    const { reportedItems, fetchReportedItems, loading, hasMore, error } = useReportedStore();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);

    const filteredItems = useMemo(() => {
        if (!debouncedSearch) return reportedItems;
        const lowerSearch = debouncedSearch.toLowerCase();
        return reportedItems.filter(item =>
            item.fsObject?.name?.toLowerCase().includes(lowerSearch) ||
            item.owner?.email?.toLowerCase().includes(lowerSearch) ||
            item.reportedBy?.email?.toLowerCase().includes(lowerSearch) ||
            item.owner?.name?.toLowerCase().includes(lowerSearch) ||
            item.reportedBy?.name?.toLowerCase().includes(lowerSearch)
        );
    }, [reportedItems, debouncedSearch]);

    useEffect(() => {
        fetchReportedItems(true);
    }, [fetchReportedItems]);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastItemElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchReportedItems(false);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore, fetchReportedItems]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white"></h2>
                <div className="relative flex-1 sm:max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search by file name, owner, or reporter..."
                        className="pl-9 bg-white dark:bg-slate-950"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                    Failed to load reported files: {error}
                </div>
            )}

            <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                <div className="overflow-auto max-h-[calc(100vh-220px)] relative">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead>Report ID</TableHead>
                                <TableHead>File Name/Type</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Reported By</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Report Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && !filteredItems.length ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
                                            <span className="text-slate-500">Loading reported items...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : !filteredItems.length ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        {debouncedSearch ? "No reported items found matching your search." : "No reported items found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item, index) => {
                                    return (
                                        <TableRow
                                            ref={filteredItems.length === index + 1 ? lastItemElementRef : null}
                                            key={item.id}
                                        >
                                            <TableCell className="font-medium text-xs text-slate-500">{item.id.split('-')[0]}</TableCell>
                                            <TableCell>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        {superAdmin ? (
                                                            <button
                                                                onClick={() => {
                                                                    if (!item.fsObject?.id) return;
                                                                    const params = new URLSearchParams({
                                                                        name: item.fsObject.name ?? '',
                                                                        sourceType: item.fsObject.type ?? '',
                                                                        url: item.fsObject.url ?? '',
                                                                    });
                                                                    navigate(`/file/${item.fsObject.id}?${params.toString()}`);
                                                                }}
                                                                className="font-medium block max-w-[200px] sm:max-w-[300px] truncate hover:text-blue-600 hover:underline text-left"
                                                            >
                                                                {item.fsObject?.name}
                                                            </button>
                                                        ) : (
                                                            <span className="font-medium block max-w-[200px] sm:max-w-[300px] truncate">
                                                                {item.fsObject?.name}
                                                            </span>
                                                        )}
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <p className="max-w-[400px] break-all">{item.fsObject?.name}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Badge variant="outline" className="mt-1 text-xs">{item.fsObject?.type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Link to={`/user/${item?.owner?.id}`} className="block hover:bg-slate-50 dark:hover:bg-slate-900/50 -m-2 p-2 rounded-md transition-colors">
                                                    <div className="text-sm font-medium hover:text-blue-600">{item?.owner?.name}</div>
                                                    <div className="text-xs text-slate-500">{item?.owner?.email}</div>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link to={`/user/${item?.reportedBy?.id}`} className="block hover:bg-slate-50 dark:hover:bg-slate-900/50 -m-2 p-2 rounded-md transition-colors">
                                                    <div className="text-sm font-medium hover:text-blue-600">{item?.reportedBy?.name}</div>
                                                    <div className="text-xs text-slate-500">{item?.reportedBy?.email}</div>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="text-sm text-slate-700 dark:text-slate-300 block max-w-[150px] sm:max-w-[250px] md:max-w-[400px] truncate cursor-help">
                                                            {item.reason || <span className="text-slate-400 italic">-</span>}
                                                        </div>
                                                    </TooltipTrigger>
                                                    {item.reason && (
                                                        <TooltipContent side="top">
                                                            <p className="max-w-[300px] whitespace-pre-wrap break-words">{item.reason}</p>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                                {formatDate(item.createdAt)}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>

                    {hasMore && filteredItems.length > 0 && (
                        <div ref={lastItemElementRef} className="flex justify-center py-4 text-slate-500 text-sm space-x-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
                            <span>Loading more items...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
