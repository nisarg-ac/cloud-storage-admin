import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
import { Eye, Trash2, Search, RotateCcw } from "lucide-react";

export const UsersManagement = () => {
    const { users, fetchUsers, loading, deleteUser, restoreUser, hasMore } = useUsersStore();

    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterRole, setFilterRole] = useState("ALL");

    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [userToRestore, setUserToRestore] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers(true);
    }, [search, filterStatus, filterRole, fetchUsers]);

    const filteredUsers = useMemo(() => {
        let result = users;

        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(u =>
                u.email?.toLowerCase().includes(lowerSearch) ||
                u.phoneNumber?.includes(lowerSearch) ||
                u.name.toLowerCase().includes(lowerSearch)
            );
        }

        if (filterRole === "ADMIN") result = result.filter(u => u.isAdmin);
        if (filterRole === "USER") result = result.filter(u => !u.isAdmin);

        if (filterStatus === "ACTIVE") result = result.filter(u => !u.deletedAt);
        if (filterStatus === "DELETED") result = result.filter(u => !!u.deletedAt);

        return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [users, search, filterRole, filterStatus]);

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
                <div className="flex gap-4">
                    <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="w-[140px] bg-white dark:bg-slate-950">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Roles</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="USER">User</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[140px] bg-white dark:bg-slate-950">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="DELETED">Deleted</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

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

                                    // Progress styling wrapper since indicatorClassName isn't passed natively by standard shadcn progress
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
                                                <div className="flex flex-col gap-1 items-start">
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
                                                <div className="space-y-1.5 [&_[data-state]]:bg-slate-100 dark:[&_[data-state]]:bg-slate-800">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-medium">{formatSize(user.totalUsedStorageBytes || 0, SizeUnits.Bytes)}</span>
                                                        <span className="text-slate-500">{formatSize(user.storageLimitInBytes || 0, SizeUnits.Bytes)} free</span>
                                                    </div>
                                                    {/* We apply color by targeting the child indicator, or modify progress component directly later */}
                                                    <div className={`[&_div]:${progressColorState}`}>
                                                        <Progress value={storagePercentage} className="h-1.5" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs space-y-1">
                                                    <div><span className="text-slate-500">Views:</span> {user.totalViews || 0}</div>
                                                    <div><span className="text-slate-500">DLs:</span> {user.totalDownloads || 0}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                                {formatDate(user.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20" asChild>
                                                        <Link to={`/user/${user.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
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
