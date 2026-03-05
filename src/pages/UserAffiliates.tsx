import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Search, Eye } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { getAffiliateUsers } from "../services/user.service";
import { User } from "../types";
import { formatDate } from "../utils";
import { useDebounce } from "../hooks/useDebounce";

export const UserAffiliates = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();

    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPage = useCallback(async (pageNum: number, searchTerm: string, replace = false) => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getAffiliateUsers({ userId, page: pageNum, limit: 20, search: searchTerm || undefined });
            setUsers(prev => replace ? res.data : [...prev, ...res.data]);
            setTotal(res.meta.total);
            setPage(pageNum);
            setHasMore(pageNum < res.meta.totalPages);
        } catch (err: any) {
            setError(err.message ?? "Failed to load affiliates");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchPage(1, debouncedSearch, true);
    }, [debouncedSearch, fetchPage]);

    const observer = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchPage(page + 1, debouncedSearch);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, page, debouncedSearch, fetchPage]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Affiliates</h2>
                    {!loading && (
                        <p className="text-sm text-slate-500">{total} user{total !== 1 ? "s" : ""}</p>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Search by name, email or phone..."
                    className="pl-9 bg-white dark:bg-slate-950"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                <div className="overflow-auto max-h-[calc(100vh-280px)] relative">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead>User ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Badges</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && !users.length ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-purple-600" />
                                            <span className="text-slate-500">Loading affiliates...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : !users.length ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        No affiliates found{debouncedSearch ? " matching your search" : ""}.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((u, index) => (
                                    <TableRow
                                        ref={users.length === index + 1 ? sentinelRef : null}
                                        key={u.id}
                                        className={u.deletedAt ? "opacity-60 bg-slate-50 dark:bg-slate-900/20" : ""}
                                    >
                                        <TableCell className="font-medium text-xs text-slate-500">
                                            {u.id.split("-")[0]}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{u.name}</div>
                                            {u.isAdmin && (
                                                <Badge variant="outline" className="mt-1 text-blue-600 border-blue-200 dark:border-blue-800">
                                                    Admin
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{u.email}</div>
                                            <div className="text-xs text-slate-500">{u.countryCode} {u.phoneNumber}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 items-start max-w-[70px] min-w-[70px]">
                                                {u.isEmailVerified ? (
                                                    <Badge variant="secondary" className="bg-green-100/50 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-normal text-[10px]">Email ✓</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-normal text-[10px]">Email ✗</Badge>
                                                )}
                                                {u.isPhoneVerified ? (
                                                    <Badge variant="secondary" className="bg-green-100/50 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-normal text-[10px]">Phone ✓</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-normal text-[10px]">Phone ✗</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                            {formatDate(u.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20" asChild>
                                                <Link to={`/user/${u.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {hasMore && users.length > 0 && (
                        <div ref={sentinelRef} className="flex justify-center py-4 text-slate-500 text-sm space-x-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-purple-600" />
                            <span>Loading more...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
