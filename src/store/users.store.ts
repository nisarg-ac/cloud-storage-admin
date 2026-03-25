import { create } from "zustand";
import { User, UserStorageLimit } from "../types";
import * as userService from "../services/user.service";
// import * as storageService from "../services/storage.service";
// import * as viewsService from "../services/views.service";
// import * as downloadsService from "../services/downloads.service";

export interface UsersFilters {
    search: string;
    withDeleted: boolean;
    hasEarningPlan: 'ALL' | 'HAS_PLAN' | 'NO_PLAN';
}

interface UsersState {
    users: User[];
    loading: boolean;
    error: string | null;
    selectedUser: User | null;
    storageLimits: Record<string, UserStorageLimit>;
    userViewsCount: Record<string, number>;
    userDownloadsCount: Record<string, number>;
    hasMore: boolean;
    page: number;
    total: number;
    filters: UsersFilters;
    fetchUsers: (reset?: boolean, filters?: Partial<UsersFilters>) => Promise<void>;
    fetchUserDetails: (userId: string) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    restoreUser: (userId: string) => Promise<void>;
    blockUser: (userId: string) => Promise<void>;
}

const DEFAULT_FILTERS: UsersFilters = {
    search: '',
    withDeleted: false,
    hasEarningPlan: 'ALL',
};

export const useUsersStore = create<UsersState>((set, get) => ({
    users: [],
    loading: false,
    error: null,
    selectedUser: null,
    storageLimits: {},
    userViewsCount: {},
    userDownloadsCount: {},
    hasMore: true,
    page: 1,
    total: 0,
    filters: { ...DEFAULT_FILTERS },

    fetchUsers: async (reset = false, filters?: Partial<UsersFilters>) => {
        const currentFilters = reset ? { ...DEFAULT_FILTERS, ...filters } : get().filters;
        const currentPage = reset ? 1 : get().page;
        if (reset) {
            set({ loading: true, error: null, users: [], page: 1, hasMore: true, filters: currentFilters });
        } else {
            set({ loading: true, error: null });
        }

        try {
            const result = await userService.getUsers({
                page: currentPage,
                limit: 20,
                ...(currentFilters.search ? { search: currentFilters.search } : {}),
                ...(currentFilters.withDeleted ? { withDeleted: true } : {}),
                ...(currentFilters.hasEarningPlan === 'HAS_PLAN' ? { hasEarningPlan: true } : {}),
                ...(currentFilters.hasEarningPlan === 'NO_PLAN' ? { hasEarningPlan: false } : {}),
            });

            const currentUsers = reset ? [] : get().users;
            const newUsers = [...currentUsers, ...result.users];
            const total = result.total || newUsers.length;
            const hasMore = result.users.length === 20 && newUsers.length < total;

            set({
                users: newUsers,
                total,
                loading: false,
                hasMore,
                page: currentPage + 1,
            });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    fetchUserDetails: async (userId: string) => {
        set({ loading: true, error: null, selectedUser: null });
        try {
            const user = await userService.getUserById(userId);
            if (user) {
                set({
                    selectedUser: user,
                    loading: false
                });
            } else {
                set({ error: "User not found", loading: false });
            }
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    deleteUser: async (userId: string) => {
        try {
            const success = await userService.deleteUser(userId);
            if (success) {
                const updatedUsers = get().users.map(u => u.id === userId ? { ...u, deletedAt: new Date().toISOString(), status: "Soft Deleted" as const } : u);
                set({ users: updatedUsers });
            }
        } catch (err) {
            console.error(err);
        }
    },

    restoreUser: async (userId: string) => {
        try {
            const success = await userService.restoreUser(userId);
            if (success) {
                const updatedUsers = get().users.map(u => u.id === userId ? { ...u, deletedAt: null, status: "Active" as const } : u);
                set({ users: updatedUsers });
            }
        } catch (err) {
            console.error(err);
        }
    },

    blockUser: async (userId: string) => {
        try {
            await userService.blockUser(userId);
            const updatedUsers = get().users.map(u => u.id === userId ? { ...u, status: "Soft Deleted" as const, deletedAt: new Date().toISOString() } : u);
            set({ users: updatedUsers });
        } catch (err) {
            console.error(err);
        }
    }
}));
