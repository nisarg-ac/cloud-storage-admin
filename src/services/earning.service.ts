import { apiClient } from './api';

export interface RevenueEventsByStatus {
    status: string;
    event_count: string;
    total_units: string;
}

export interface PayoutsByStatus {
    status: string;
    payout_count: string;
    total_units: string;
}

export interface OverviewResponse {
    revenueEventsByStatus: RevenueEventsByStatus[];
    payoutsByStatus: PayoutsByStatus[];
}

// Normalized shape (no type filter — currently broken server-side)
// Typed shape (type=VIEW or type=REFERRAL)
// Typed shape (type=PAYOUT)
export interface ActivityFeedItem {
    id: string;
    // normalized (no type filter)
    type?: string;
    user_id?: string;
    units?: string;
    // VIEW / REFERRAL shape
    event_type?: string;
    actor_user_id?: string;
    beneficiary_user_id?: string;
    reward_units?: string;
    // PAYOUT shape
    total_units?: string;
    currency: string;
    status: string;
    timestamp: string;
}

export interface RevenueEvent {
    id: string;
    event_type?: string;
    eventType?: string;
    actor_user_id?: string;
    actorUserId?: string;
    beneficiary_user_id?: string;
    beneficiaryUserId?: string;
    reward_units?: string;
    rewardUnits?: string;
    currency: string;
    status: string;
    inserted_at?: string;
    insertedAt?: string;
    event_timestamp?: string;
    fraud_flags?: string[];
    fraudFlags?: string[];
    fraud_flags_overridden?: string[] | null;
    fraudFlagsOverridden?: string[] | null;
    approved_by?: string | null;
    approvedBy?: string | null;
    approved_at?: string | null;
    approvedAt?: string | null;
    rejected_reason?: string | null;
    rejectedReason?: string | null;
    admin_note?: string | null;
    adminNote?: string | null;
    beneficiary_name?: string;
    actor_name?: string;
    payout_id?: string | null;
    payoutId?: string | null;
}

export interface Payout {
    id: string;
    user_id?: string;
    userId?: string;
    total_units?: string;
    totalUnits?: string;
    currency: string;
    status: string;
    event_ids?: string[];
    eventIds?: string[];
    holding_release_at?: string;
    holdingReleaseAt?: string;
    created_at?: string;
    createdAt?: string;
    paid_at?: string | null;
    paidAt?: string | null;
    approved_by?: string | null;
    approvedBy?: string | null;
    approved_at?: string | null;
    approvedAt?: string | null;
    held_by?: string | null;
    heldBy?: string | null;
    held_at?: string | null;
    heldAt?: string | null;
    held_reason?: string | null;
    heldReason?: string | null;
    released_by?: string | null;
    releasedBy?: string | null;
    released_at?: string | null;
    releasedAt?: string | null;
    transaction_ref?: string | null;
    transactionRef?: string | null;
    payment_provider?: string | null;
    paymentProvider?: string | null;
    failed_reason?: string | null;
    failedReason?: string | null;
    admin_note?: string | null;
    adminNote?: string | null;
    user_name?: string;
    user_email?: string;
    event_count?: string;
    event_sum_units?: string;
    // Period covered by this payout
    period_start?: string | null;
    periodStart?: string | null;
    period_end?: string | null;
    periodEnd?: string | null;
    // Destination bank account snapshot (taken at withdrawal request time)
    payment_method_id?: string | null;
    paymentMethodId?: string | null;
    snapshot_account_number?: string | null;
    snapshotAccountNumber?: string | null;
    snapshot_ifsc_code?: string | null;
    snapshotIfscCode?: string | null;
    snapshot_account_country?: string | null;
    snapshotAccountCountry?: string | null;
    // Set on mark-paid (mirrors transaction_ref)
    payment_reference?: string | null;
    paymentReference?: string | null;
    // Distinct from failed_reason
    rejection_reason?: string | null;
    rejectionReason?: string | null;
}

export interface StatusMetrics {
    count: number;
    totalUnits: string;
    totalUsd: string;
}

export interface UserEarningProfile {
    user: {
        id: string;
        name: string;
        email: string;
        earningSuspended: boolean;
        earningSuspendedBy: string | null;
        earningSuspendedAt: string | null;
        earningSuspendedReason: string | null;
        payoutBlocked: boolean;
        payoutBlockedBy: string | null;
        payoutBlockedAt: string | null;
        payoutBlockedCategory: string | null;
        earningPlanSwitchCount: number;
        maxEarningPlanSwitches: number;
        createdAt: string;
    };
    earningPlan: {
        id: string;
        userId: string;
        earningPlanId: string;
        selectedAt: string;
        earningPlan: {
            id: string;
            planName: string;
            planType: string;
            rewardPerViewUnits: string;
            rewardPerSignupUnits: string;
            isActive: boolean;
        };
    } | null;
    totalEarned: string;
    totalPaid: string;
    recentEvents: RevenueEvent[];
    payouts: Payout[];
    fraudSummary: {
        totalEvents: number;
        flaggedEvents: number;
        rejectedEvents: number;
        rejectionRate: number;
    };
    earningStatus: {
        pending: StatusMetrics;
        approved: StatusMetrics;
        payable: StatusMetrics;
        inPayout: StatusMetrics;
        paid: StatusMetrics;
        rejected: StatusMetrics;
    };
}

export interface AuditLogItem {
    id: string;
    admin_user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    before_value: unknown;
    after_value: unknown;
    note: string | null;
    created_at: string;
}

export interface EarningConfig {
    id: string;
    minPayoutUnits: string;
    autoProcessPayouts: boolean;
    maxPayoutsPerDay: number;
    maxEventsPerUserPerDay: number;
    fraudScoreThreshold: number;
    payoutHoldDays: number;
    allowManualWithdrawals: boolean;
    updatedAt: string;
    updatedBy: string;
}

export interface SystemConfig {
    HIGH_VELOCITY_THRESHOLD: string;
    IP_CLUSTER_THRESHOLD: string;
    IP_RATE_LIMIT_PER_MIN: string;
    FRAUD_HOLD_DAYS: string;
    PAYOUT_HOLD_DAYS: string;
    [key: string]: string;
}

export interface SystemConfigHistory {
    id: string;
    admin_user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    before_value: unknown;
    after_value: unknown;
    note: string | null;
    created_at: string;
}

export interface SystemConfigResponse {
    config: SystemConfig;
    history: SystemConfigHistory[];
}

export interface SystemConfigUpdatePayload {
    highVelocityThreshold?: number;
    ipClusterThreshold?: number;
    ipRateLimitPerMin?: number;
    fraudHoldDays?: number;
    payoutHoldDays?: number;
}

export interface EarningPlan {
    id: string;
    planName: string;
    planType: string;
    description: string;
    rewardPerViewUnits: string;
    rewardPerSignupUnits: string;
    minViewsForReward: number;
    maxRewardsPerDay: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

// Actual envelope the backend sends for every response
interface ApiResponse<T> {
    success: boolean;
    status: string;
    data: T;
    meta: {
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
    } | null;
    error: null | string;
}

// Helper — unwraps a list response into a consistent PaginatedResult.
// The server currently doesn't return total/page/limit in meta, so we
// infer hasMore from whether we received a full page of results.
function toPaginated<T>(items: T[], page: number, limit: number, response?: ApiResponse<T[]>): PaginatedResult<T> {
    // Priority: 1. Server metadata total, 2. Server root total (fallback), 3. Inferred total
    const serverTotal = response?.meta?.total;
    
    // If we have a server total, use it.
    if (typeof serverTotal === 'number') {
        return { data: items, total: serverTotal, page, limit };
    }

    // Inferred logic for backward compatibility or simple endpoints:
    // If we got a full page, assume there may be more (next page will return empty if not).
    const inferredTotal = items.length === limit ? page * limit + 1 : (page - 1) * limit + items.length;
    return { data: items, total: inferredTotal, page, limit };
}

export interface ActivityFeedResponse {
    data: ActivityFeedItem[];
    total: number;
    page: number;
    limit: number;
}

export const earningService = {
    getOverview: async () => {
        const response = await apiClient.get<{ status: number; message: string; data: OverviewResponse }>('/web/earning/overview');
        return response.data.data;
    },

    getActivityFeed: async (params: { page?: number; limit?: number; date?: string; type?: string }) => {
        const response = await apiClient.get<ApiResponse<ActivityFeedItem[]>>('/web/earning/activity-feed', { params });
        return toPaginated(response.data.data ?? [], params.page ?? 1, params.limit ?? 50, response.data);
    },

    // Revenue Events
    getEvents: async (params: { page?: number; limit?: number; status?: string; type?: string; userId?: string; hasFraudFlags?: boolean; dateFrom?: string; dateTo?: string; sortBy?: string; sortDir?: string }) => {
        const response = await apiClient.get<ApiResponse<RevenueEvent[]>>('/web/earning/events', { params });
        return toPaginated(response.data.data ?? [], params.page ?? 1, params.limit ?? 50, response.data);
    },

    getFraudQueue: async (params: { page?: number; limit?: number }) => {
        const response = await apiClient.get<ApiResponse<RevenueEvent[]>>('/web/earning/events/fraud-queue', { params });
        return toPaginated(response.data.data ?? [], params.page ?? 1, params.limit ?? 50, response.data);
    },

    getEventById: async (id: string) => {
        const response = await apiClient.get<{ data: RevenueEvent }>(`/web/earning/events/${id}`);
        return response.data.data;
    },

    approveEvent: async (id: string, note?: string) => {
        const response = await apiClient.patch<{ data: RevenueEvent }>(`/web/earning/events/${id}/approve`, { note });
        return response.data.data;
    },

    rejectEvent: async (id: string, reason: string, note?: string) => {
        const response = await apiClient.patch<{ data: RevenueEvent }>(`/web/earning/events/${id}/reject`, { reason, note });
        return response.data.data;
    },

    overrideFraudFlag: async (id: string, justification: string) => {
        const response = await apiClient.patch<{ data: RevenueEvent }>(`/web/earning/events/${id}/override-fraud`, { justification });
        return response.data.data;
    },

    flagEvent: async (id: string, reason: string, note?: string) => {
        const response = await apiClient.patch<{ data: RevenueEvent }>(`/web/earning/events/${id}/flag`, { reason, note });
        return response.data.data;
    },

    bulkActionEvents: async (ids: string[], action: 'APPROVE' | 'REJECT', reason?: string, note?: string) => {
        const response = await apiClient.post<{ data: { succeeded: number; failed: number; errors: unknown[] } }>('/web/earning/events/bulk-action', { ids, action, reason, note });
        return response.data.data;
    },

    // Payouts
    getPayouts: async (params: { page?: number; limit?: number; status?: string; userId?: string; amountMin?: string; amountMax?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortDir?: string }) => {
        const response = await apiClient.get<ApiResponse<Payout[]>>('/web/earning/payouts', { params });
        return toPaginated(response.data.data ?? [], params.page ?? 1, params.limit ?? 50, response.data);
    },

    getPayoutById: async (id: string) => {
        const response = await apiClient.get<{ data: Payout }>(`/web/earning/payouts/${id}`);
        return response.data.data;
    },

    approvePayout: async (id: string, note?: string, forceApprove: boolean = false) => {
        const response = await apiClient.patch<{ data: Payout }>(`/web/earning/payouts/${id}/approve`, { note, forceApprove });
        return response.data.data;
    },

    holdPayout: async (id: string, reason: string) => {
        const response = await apiClient.patch<{ data: Payout }>(`/web/earning/payouts/${id}/hold`, { reason });
        return response.data.data;
    },

    releasePayoutHold: async (id: string, note?: string) => {
        const response = await apiClient.patch<{ data: Payout }>(`/web/earning/payouts/${id}/release`, { note });
        return response.data.data;
    },

    markPayoutPaid: async (id: string, providerName: string, transactionRef: string, note?: string) => {
        const response = await apiClient.patch<{ data: Payout }>(`/web/earning/payouts/${id}/mark-paid`, { providerName, transactionRef, note });
        return response.data.data;
    },

    markPayoutFailed: async (id: string, reason: string, note?: string) => {
        const response = await apiClient.patch<{ data: Payout }>(`/web/earning/payouts/${id}/mark-failed`, { reason, note });
        return response.data.data;
    },

    retryPayout: async (id: string, note?: string) => {
        const response = await apiClient.post<{ data: Payout }>(`/web/earning/payouts/${id}/retry`, { note });
        return response.data.data;
    },

    // User Earning Profile
    getUserEarningProfile: async (userId: string, params?: { page?: number; limit?: number; payoutsPage?: number }) => {
        const response = await apiClient.get<{ data: UserEarningProfile }>(`/web/earning/users/${userId}`, { params });
        return response.data.data;
    },

    suspendEarning: async (userId: string, reason: string) => {
        const response = await apiClient.patch<{ data: unknown }>(`/web/earning/users/${userId}/suspend`, { reason });
        return response.data.data;
    },

    reinstateEarning: async (userId: string, note: string) => {
        const response = await apiClient.patch<{ data: unknown }>(`/web/earning/users/${userId}/reinstate`, { note });
        return response.data.data;
    },

    overrideEarningPlan: async (userId: string, planId: string, resetSwitchCount: boolean, note: string) => {
        const response = await apiClient.patch<{ data: unknown }>(`/web/earning/users/${userId}/plan-override`, { planId, resetSwitchCount, note });
        return response.data.data;
    },

    blockPayouts: async (userId: string, reason: string, category: string) => {
        const response = await apiClient.patch<{ data: unknown }>(`/web/earning/users/${userId}/block-payouts`, { reason, category });
        return response.data.data;
    },

    unblockPayouts: async (userId: string, note: string) => {
        const response = await apiClient.patch<{ data: unknown }>(`/web/earning/users/${userId}/unblock-payouts`, { note });
        return response.data.data;
    },

    rejectPendingByPercentage: async (userId: string, payload: { percentage: number; reason: string; note?: string }) => {
        const response = await apiClient.patch<{
            status: number;
            message: string;
            data: {
                totalPending: number;
                percentage: number;
                rejected: number;
                remaining: number;
            }
        }>(`/web/earning/users/${userId}/reject-pending-by-percentage`, payload);
        return response.data.data;
    },

    // Config
    getConfig: async () => {
        const response = await apiClient.get<{ data: SystemConfigResponse }>('/web/earning/config');
        return response.data.data;
    },

    updateConfig: async (configData: SystemConfigUpdatePayload) => {
        const response = await apiClient.patch<{ data: { updatedKeys: string[] } }>('/web/earning/config', configData);
        return response.data.data;
    },

    // Plans
    getPlans: async () => {
        const response = await apiClient.get<{ data: EarningPlan[] }>('/web/earning/plans');
        return response.data.data;
    },

    createPlan: async (planData: Partial<EarningPlan>) => {
        const response = await apiClient.post<{ data: EarningPlan }>('/web/earning/plans', planData);
        return response.data.data;
    },

    updatePlan: async (id: string, planData: Partial<EarningPlan>) => {
        const response = await apiClient.patch<{ data: EarningPlan }>(`/web/earning/plans/${id}`, planData);
        return response.data.data;
    },

    updatePlanStatus: async (id: string, isActive: boolean) => {
        const response = await apiClient.patch<{ data: EarningPlan }>(`/web/earning/plans/${id}/status`, { isActive });
        return response.data.data;
    },

    // Audit Log
    getAuditLog: async (params?: { page?: number; limit?: number; adminUserId?: string; action?: string; entityType?: string; entityId?: string; dateFrom?: string; dateTo?: string; format?: string }) => {
        const response = await apiClient.get<ApiResponse<AuditLogItem[]>>('/web/earning/audit-log', { params });
        return toPaginated(response.data.data ?? [], params?.page ?? 1, params?.limit ?? 50, response.data);
    }
};
