import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import * as userService from "../services/user.service";
import { User } from "../types";
import { formatSize, formatDate, SizeUnits } from "../utils";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Search, Eye, DollarSign, Zap } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

export const RevenueUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);

    const fetchUsers = useCallback(async (reset = false) => {
        setLoading(true);
        const currentPage = reset ? 1 : page;
        try {
            const result = await userService.getUsers({
                page: currentPage,
                limit: 20,
                search: debouncedSearch,
                hasEarningPlan: true,
            });

            if (reset) {
                setUsers(result.users);
                setPage(2);
            } else {
                setUsers(prev => [...prev, ...result.users]);
                setPage(prev => prev + 1);
            }
            setTotal(result.total);
            setHasMore(result.users.length === 20 && (reset ? result.users.length : users.length + result.users.length) < result.total);
        } catch (error) {
            console.error("Failed to fetch revenue users", error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, users.length]);

    useEffect(() => {
        fetchUsers(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastUserElementRef = useCallback((node: HTMLTableRowElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchUsers(false);
            }
        });

            if (node) observer.current.observe(node);
    }, [loading, hasMore, fetchUsers]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-emerald-500" />
                        Revenue Users
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Users currently or previously enrolled in earning plans</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search users..."
                        className="pl-9 bg-white dark:bg-slate-950"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {total > 0 && (
                <p className="text-sm text-slate-500">{total} user{total !== 1 ? 's' : ''} found</p>
            )}

            <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                <div className="overflow-auto max-h-[calc(100vh-250px)]">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Plan Info</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Storage</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
                                            <span className="text-slate-500">Loading revenue users...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                        No users with earning plans found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user, index) => (
                                    <TableRow 
                                        key={user.id} 
                                        ref={index === users.length - 1 ? lastUserElementRef : null}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                                    >
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900 dark:text-white">{user.name}</span>
                                                <span className="text-xs text-slate-500">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.activeEarningPlan ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                        <Zap className="w-3 h-3" />
                                                        {user.activeEarningPlan.planName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{user.activeEarningPlan.planType}</span>
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="text-xs font-normal text-slate-400 border-slate-200">No active plan</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.earningSuspended ? (
                                                    <Badge variant="destructive" className="text-[10px] py-0 px-1.5">Suspended</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 text-[10px] py-0 px-1.5 border-none">Earning active</Badge>
                                                )}
                                                {user.payoutBlocked && (
                                                    <Badge variant="destructive" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-[10px] py-0 px-1.5 border-none">Payout blocked</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                                <span className="font-medium">{formatSize(user.totalUsedStorageBytes, SizeUnits.Bytes)}</span>
                                                <div className="text-[10px] text-slate-500">used of {formatSize(user.storageLimitInBytes, SizeUnits.Bytes)}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {formatDate(user.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild className="h-8 gap-1.5">
                                                <Link to={`/revenue/users/${user.id}`}>
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View Profile
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            {hasMore && users.length > 0 && !loading && (
                <div className="flex justify-center p-4">
                    <Button variant="ghost" size="sm" onClick={() => fetchUsers(false)}>
                        Load More
                    </Button>
                </div>
            )}
        </div>
    );
};
