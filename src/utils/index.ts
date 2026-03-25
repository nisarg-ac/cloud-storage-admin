import { format } from "date-fns";
import { User, FSObjectView, FSObjectDownload } from "../types";

export const bytesToGB = (bytes: number): number => {
    return Number((bytes / (1024 * 1024 * 1024)).toFixed(2));
};

export const formatDate = (dateString: string): string => {
    try {
        return format(new Date(dateString), "MMM dd, yyyy");
    } catch (e) {
        return dateString;
    }
};

export enum SizeUnits {
    Bytes = 'Bytes',
    KB = 'KB',
    MB = 'MB',
    GB = 'GB',
    TB = 'TB'
}
export function convertSizeUnites(size: number, sourceSizeUnits: SizeUnits, targetSizeUnits: SizeUnits) {
    const i = Object.keys(SizeUnits).indexOf(sourceSizeUnits);
    const sizeInBytes = size * Math.pow(1024, i);
    const j = Object.keys(SizeUnits).indexOf(targetSizeUnits);
    return sizeInBytes / Math.pow(1024, j);
}
export function formatSize(size: number, measureUnit: SizeUnits, decimals = 2) {
    if (size === 0) return '0 Bytes';
    const sizeInBytes = convertSizeUnites(size, measureUnit, SizeUnits.Bytes);
    const dm = decimals < 0 ? 0 : decimals;
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
    return parseFloat((sizeInBytes / Math.pow(1024, i)).toFixed(dm)) + ' ' +
        Object.keys(SizeUnits)[i];
}

export const calculateUserStorage = (user?: User | null) => {
    const storageLimit = user?.storageLimit;
    if (!user || !storageLimit) {
        return {
            usedBytes: 0,
            usedGB: 0,
            remainingGB: 0,
            percentage: 0,
            breakdown: { images: 0, videos: 0, audio: 0, zip: 0, documents: 0 },
            trashBreakdown: { images: 0, videos: 0, audio: 0, zip: 0, documents: 0 },
            trashBytes: 0,
            totalBytesWithTrash: 0,
        };
    }

    const {
        usedImageStorageBytes, usedVideoStorageBytes, usedAudioStorageBytes, usedZipStorageBytes, usedDocumentStorageBytes,
        trashImageStorageBytes, trashVideoStorageBytes, trashAudioStorageBytes, trashZipStorageBytes, trashDocumentStorageBytes
    } = storageLimit;

    const usedBytes = usedImageStorageBytes + usedVideoStorageBytes + usedAudioStorageBytes + usedZipStorageBytes + usedDocumentStorageBytes;
    const trashBytes = trashImageStorageBytes + trashVideoStorageBytes + trashAudioStorageBytes + trashZipStorageBytes + trashDocumentStorageBytes;

    const totalBytesWithTrash = usedBytes + trashBytes;

    const usedGB = bytesToGB(totalBytesWithTrash);

    const sizeLimitBytes = user.storageLimitInBytes || 0;
    const sizeLimitGB = bytesToGB(sizeLimitBytes);
    const remainingGB = Math.max(0, sizeLimitGB - usedGB);
    const percentage = sizeLimitBytes > 0 ? (totalBytesWithTrash / sizeLimitBytes) * 100 : 0;

    return {
        usedBytes,
        usedGB,
        remainingGB,
        percentage,
        breakdown: {
            images: usedImageStorageBytes,
            videos: usedVideoStorageBytes,
            audio: usedAudioStorageBytes,
            zip: usedZipStorageBytes,
            documents: usedDocumentStorageBytes,
        },
        trashBreakdown: {
            images: trashImageStorageBytes,
            videos: trashVideoStorageBytes,
            audio: trashAudioStorageBytes,
            zip: trashZipStorageBytes,
            documents: trashDocumentStorageBytes,
        },
        trashBytes,
        totalBytesWithTrash,
    };
};

export const convertUnits = (units?: string | null): string => {
    if (!units) return '0.000000';
    try {
        return (Number(BigInt(units)) / 1_000_000).toFixed(6);
    } catch {
        return '0.000000';
    }
};

export const calculateUserDownloads = (userId: string, downloads: FSObjectDownload[]): number => {
    return downloads.filter((d) => d.userId === userId).length;
};

export const calculateUserViews = (userId: string, views: FSObjectView[]): number => {
    return views.filter((v) => v.userId === userId).length;
};
