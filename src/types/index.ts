export interface User {
    id: string;
    email: string | null;
    countryCode: string | null;
    phoneNumber: string | null;
    name: string;
    firebaseUid: string | null;
    telegramId: string | null;
    profilePic: string | null;
    otp: string | null;
    otpExpiry: string | null;
    isAdmin: boolean;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    sizeLimit: number;
    termsAndConditionApply: boolean;
    referenceById: string | null;
    referenceLinkId: string | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    referenceUserCount: number;
    totalUsedStorageBytes: number;
    storageLimitInBytes: number;
    planName: string;
    totalDownloads: number;
    totalViews: number;
    activeEarningPlan?: {
        planId: string;
        planName: string;
        planType: string;
        selectedAt: string;
    } | null;
    storageLimit: {
        usedImageStorageBytes: number;
        usedVideoStorageBytes: number;
        usedAudioStorageBytes: number;
        usedZipStorageBytes: number;
        usedDocumentStorageBytes: number;
        trashImageStorageBytes: number;
        trashVideoStorageBytes: number;
        trashAudioStorageBytes: number;
        trashZipStorageBytes: number;
        trashDocumentStorageBytes: number;
    }
}

export interface UserStorageLimit {
    id: string;
    usedImageStorageBytes: number;
    usedVideoStorageBytes: number;
    usedAudioStorageBytes: number;
    usedZipStorageBytes: number;
    usedDocumentStorageBytes: number;
    trashImageStorageBytes: number;
    trashVideoStorageBytes: number;
    trashAudioStorageBytes: number;
    trashZipStorageBytes: number;
    trashDocumentStorageBytes: number;
    userId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface FSObjectView {
    id: string;
    userId: string;
    objectId: string;
    createdAt: string;
    fileType?: string;
}

export interface FSObjectDownload {
    id: string;
    userId: string;
    objectId: string;
    createdAt: string;
    fileType?: string;
}

export interface TopUser {
    userId: string;
    name: string;
    email: string;
    totalStorageBytes: number;
    imageStorageBytes: number;
    videoStorageBytes: number;
    audioStorageBytes: number;
    zipStorageBytes: number;
    documentStorageBytes: number;
    trashImageStorageBytes: number;
    trashVideoStorageBytes: number;
    trashAudioStorageBytes: number;
    trashZipStorageBytes: number;
    trashDocumentStorageBytes: number;
}

export interface ReportedItem {
    id: string;
    reason: string | null;
    createdAt: string;
    fsObject: {
        id: string;
        name: string;
        type: string;
        url?: string;
    };
    owner: {
        id: string;
        name: string;
        email: string | null;
    };
    reportedBy: {
        id: string;
        name: string;
        email: string | null;
    };
}
