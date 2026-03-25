import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { Link } from "react-router-dom";
import { useUsersStore } from "../store/users.store";
import { formatSize, formatDate, SizeUnits } from "../utils";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Eye, Trash2, Search, RotateCcw, Zap } from "lucide-react";

export const UsersManagement = () => {
    const { users, fetchUsers, loading, deleteUser, restoreUser, hasMore, total } = useUsersStore();

    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterRole, setFilterRole] = useState("ALL");
    const [filterEarningPlan, setFilterEarningPlan] = useState<"ALL" | "HAS_PLAN" | "NO_PLAN">("ALL");
    const debouncedSearch = useDebounce(search, 400);

    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [userToRestore, setUserToRestore] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers(true, {
            search: debouncedSearch,
            withDeleted: filterStatus === "DELETED",
            hasEarningPlan: filterEarningPlan,
        });
    }, [debouncedSearch, filterStatus, filterEarningPlan, fetchUsers]);

    const filteredUsers = useMemo(() => {
        if (filterRole === "ADMIN") return users.filter(u => u.isAdmin);
        if (filterRole === "USER") return users.filter(u => !u.isAdmin);
        return users;
    }, [users, filterRole]);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastUserElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchUsers(false);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore, fetchUsers]);

    // if (loading && users.length === 0) {
    //     return (
    //         <div className="flex items-center justify-center p-12">
    //             <div className="animate-pulse flex flex-col items-center space-y-4">
    //                 <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
    //                 <div className="text-slate-500 font-medium">Loading users...</div>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search by email, name or phone..."
                        className="pl-9 bg-white dark:bg-slate-950"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="w-[130px] bg-white dark:bg-slate-950">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Roles</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="USER">User</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[130px] bg-white dark:bg-slate-950">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="DELETED">Deleted</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterEarningPlan} onValueChange={v => setFilterEarningPlan(v as typeof filterEarningPlan)}>
                        <SelectTrigger className="w-[160px] bg-white dark:bg-slate-950">
                            <SelectValue placeholder="Earning Plan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Plans</SelectItem>
                            <SelectItem value="HAS_PLAN">Has Earning Plan</SelectItem>
                            <SelectItem value="NO_PLAN">No Earning Plan</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {total > 0 && (
                <p className="text-sm text-slate-500">{total} user{total !== 1 ? 's' : ''} found</p>
            )}

            <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                <div className="overflow-auto max-h-[calc(100vh-220px)] relative">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead>User ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Badges</TableHead>
                                <TableHead className="w-[200px]">Storage (Used/Limit)</TableHead>
                                <TableHead>Activity</TableHead>
                                <TableHead>Earning Plan</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && !filteredUsers.length ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
                                            <span className="text-slate-500">Loading users...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : !filteredUsers.length ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                        No users found matching the criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user, index) => {
                                    const storagePercentage = (user.totalUsedStorageBytes / user.storageLimitInBytes) * 100;

                                    const progressColorState = storagePercentage > 90 ? "bg-red-600 dark:bg-red-500" :
                                        storagePercentage > 70 ? "bg-yellow-500 dark:bg-yellow-400" :
                                            "bg-blue-600 dark:bg-blue-500";

                                    return (
                                        <TableRow
                                            ref={filteredUsers.length === index + 1 ? lastUserElementRef : null}
                                            key={user.id}
                                            className={user.deletedAt ? "opacity-60 bg-slate-50 dark:bg-slate-900/20" : ""}
                                        >
                                            <TableCell className="font-medium text-xs text-slate-500">{user.id.split('-')[0]}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{user.name}</div>
                                                {user.isAdmin && <Badge variant="outline" className="mt-1 text-blue-600 border-blue-200 dark:border-blue-800">Admin</Badge>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{user.email}</div>
                                                <div className="text-xs text-slate-500">{user.countryCode} {user.phoneNumber}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start max-w-[70px] min-w-[70px]">
                                                    {user.isEmailVerified ? (
                                                        <Badge variant="secondary" className="bg-green-100/50 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-normal text-[10px]">Email ✓</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-normal text-[10px]">Email ✗</Badge>
                                                    )}
                                                    {user.isPhoneVerified ? (
                                                        <Badge variant="secondary" className="bg-green-100/50 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-normal text-[10px]">Phone ✓</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-normal text-[10px]">Phone ✗</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-medium">{formatSize(user.totalUsedStorageBytes, SizeUnits.Bytes)}</span>
                                                        <span className="text-slate-500">{formatSize(user.storageLimitInBytes, SizeUnits.Bytes)} free</span>
                                                    </div>
                                                    <Progress value={storagePercentage} className="h-1.5" indicatorClassName={progressColorState} />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs space-y-1">
                                                    <div><span className="text-slate-500">Views:</span> {user.totalViews}</div>
                                                    <div><span className="text-slate-500">DLs:</span> {user.totalDownloads}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {user.activeEarningPlan ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                                            <Zap className="w-3 h-3" />
                                                            {user.activeEarningPlan.planName}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">{user.activeEarningPlan.planType}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                                {formatDate(user.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {!user.deletedAt && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20" asChild>
                                                            <Link to={`/user/${user.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    {!user.deletedAt ? (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" onClick={() => setUserToDelete(user.id)}>
                                                            <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" />
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20" title="Restore" onClick={() => setUserToRestore(user.id)}>
                                                            <RotateCcw className="h-4 w-4 text-slate-400 hover:text-green-600" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>

                    {hasMore && filteredUsers.length > 0 && (
                        <div ref={lastUserElementRef} className="flex justify-center py-4 text-slate-500 text-sm space-x-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
                            <span>Loading more users...</span>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? They will be softly deleted and can be restored later.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={async () => {
                            if (userToDelete) {
                                await deleteUser(userToDelete);
                                setUserToDelete(null);
                            }
                        }}>Delete User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!userToRestore} onOpenChange={(open) => !open && setUserToRestore(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Restoration</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to restore this user? They will regain access to their account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserToRestore(null)}>Cancel</Button>
                        <Button onClick={async () => {
                            if (userToRestore) {
                                await restoreUser(userToRestore);
                                setUserToRestore(null);
                            }
                        }}>Restore User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
