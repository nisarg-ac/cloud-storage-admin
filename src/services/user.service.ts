import { User } from "../types";
import { apiClient } from "./api";


interface GetUsersParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const getUsers = async (params?: GetUsersParams): Promise<User[]> => {
    try {
        const response = await apiClient.get('/web/admin/users', {
            params: {
                sortBy: 'createdAt',
                sortOrder: 'asc',
                ...params
            }
        });
        const apiUsers = response.data?.data || [];
        return apiUsers;
    } catch (error) {
        console.error("Failed to fetch users", error);
        return [];
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

export const blockUser = async (id: string): Promise<boolean> => {
    try {
        await apiClient.patch(`/web/admin/users/${id}/block`);
        return true;
    } catch (error) {
        console.error(`Failed to block user with id ${id}`, error);
        return false;
    }
}
