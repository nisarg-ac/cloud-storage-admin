import { User } from "../types";
import { apiClient } from "./api";


interface GetUsersParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    withDeleted?: boolean;
    hasEarningPlan?: boolean;
}

export interface GetUsersResult {
    users: User[];
    total: number;
}

export const getUsers = async (params?: GetUsersParams): Promise<GetUsersResult> => {
    try {
        const { search, ...otherParams } = params || {};
        const response = await apiClient.get('/web/admin/users', {
            params: {
                sortBy: 'createdAt',
                sortOrder: 'desc',
                ...otherParams,
                ...(search ? { search } : {}),
            }
        });
        const data = response.data?.data;
        // Support both array response and paginated { users, total } response
        if (Array.isArray(data)) {
            return { users: data, total: data.length };
        }
        return {
            users: data?.users ?? data?.items ?? [],
            total: response.data?.meta?.total ?? response.data?.total ?? 0,
        };
    } catch (error) {
        console.error("Failed to fetch users", error);
        return { users: [], total: 0 };
    }
};

export const getUserById = async (id: string): Promise<User | undefined> => {
    try {
        const response = await apiClient.get(`/web/admin/user/${id}`);
        return response.data?.data;
    } catch (error) {
        console.error(`Failed to fetch user with id ${id}`, error);
        return undefined;
    }
};

export const deleteUser = async (id: string): Promise<boolean> => {
    try {
        await apiClient.delete(`/web/admin/users/${id}`);
        return true;
    } catch (error) {
        console.error(`Failed to delete user with id ${id}`, error);
        return false;
    }
};

export const restoreUser = async (id: string): Promise<boolean> => {
    try {
        await apiClient.patch(`/web/admin/users/${id}/restore`);
        return true;
    } catch (error) {
        console.error(`Failed to restore user with id ${id}`, error);
        return false;
    }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// export const blockUser = async (id: string): Promise<boolean> => {
//     return new Promise((resolve) => setTimeout(() => {
//         resolve(true);
//     }, 300));
// }

export interface Upload {
    id: string;
    userId: string;
    name: string;
    sourceType: string;
    format: string;
    url: string;
    thumbnail: string;
    size: number;
    sizeIn: string;
    status: string;
    createdAt: string;
}

export interface UploadsResponse {
    data: Upload[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface AffiliatesResponse {
    data: import("../types").User[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const getAffiliateUsers = async (params: {
    userId: string;
    page?: number;
    limit?: number;
    search?: string;
}): Promise<AffiliatesResponse> => {
    const response = await apiClient.get('/web/analytics/get-reference-users', {
        params: {
            userId: params.userId,
            page: params.page ?? 1,
            limit: params.limit ?? 20,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            ...(params.search ? { search: params.search } : {}),
        },
    });
    return response.data;
};

export const getUserUploads = async (params: {
    userId: string;
    sourceType: string;
    page?: number;
    limit?: number;
}): Promise<UploadsResponse> => {
    const response = await apiClient.get('/web/admin/uploads', {
        params: {
            userId: params.userId,
            sourceType: params.sourceType,
            page: params.page ?? 1,
            limit: params.limit ?? 20,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            status: 'PENDING,PROCESSING,COMPLETED',
        },
    });
    return response.data;
};
