import { ReportedItem } from "../types";
import { apiClient } from "./api";

interface GetReportedItemsParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const getReportedItems = async (params?: GetReportedItemsParams): Promise<ReportedItem[]> => {
        const response = await apiClient.get('/web/admin/reported-items', {
            params: {
                sortBy: 'createdAt',
                sortOrder: 'desc',
                ...params
            }
        });
        return response.data?.data || [];
    };
    