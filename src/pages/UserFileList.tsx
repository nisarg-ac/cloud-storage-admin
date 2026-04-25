import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Image, Video, Music, Archive, FileText, File } from "lucide-react";
import { Button } from "../components/ui/button";
import { getUserUploads, Upload } from "../services/user.service";
import { formatSize, SizeUnits } from "../utils";
import { formatDate } from "../utils";

type FileType = "images" | "videos" | "audio" | "zip" | "documents" | "other";

const SOURCE_TYPE_MAP: Record<FileType, string> = {
    images: "IMAGE",
    videos: "VIDEO",
    audio: "AUDIO",
    zip: "ZIP",
    documents: "DOCUMENT",
    other: "OTHER",
};

const TYPE_META: Record<FileType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    images: { label: "Images", icon: <Image className="w-4 h-4" />, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/40" },
    videos: { label: "Videos", icon: <Video className="w-4 h-4" />, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
    audio: { label: "Audio", icon: <Music className="w-4 h-4" />, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/40" },
    zip: { label: "Zip Files", icon: <Archive className="w-4 h-4" />, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/40" },
    documents: { label: "Documents", icon: <FileText className="w-4 h-4" />, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/40" },
    other: { label: "Other", icon: <File className="w-4 h-4" />, color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800" },
};

export const UserFileList = () => {
    const { userId, fileType } = useParams<{ userId: string; fileType: string }>();
    const navigate = useNavigate();

    const type = (fileType as FileType) ?? "images";
    const meta = TYPE_META[type] ?? TYPE_META.images;
    const sourceType = SOURCE_TYPE_MAP[type] ?? "IMAGE";

    const [files, setFiles] = useState<Upload[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPage = useCallback(async (pageNum: number, replace = false) => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getUserUploads({ userId, sourceType, page: pageNum, limit: 20 });
            setFiles(prev => replace ? res.data : [...prev, ...res.data]);
            setTotalPages(res.meta.totalPages);
            setTotal(res.meta.total);
            setPage(pageNum);
        } catch (err: unknown) {
            const error = err as import('axios').AxiosError<{ message?: string }>;
            setError(error?.response?.data?.message || error.message || "Failed to load files");
        } finally {
            setLoading(false);
        }
    }, [userId, sourceType]);

    useEffect(() => {
        fetchPage(1, true);
    }, [fetchPage]);

    // Infinite scroll
    const observer = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && page < totalPages) {
                fetchPage(page + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, page, totalPages, fetchPage]);

    const openPreview = (file: Upload) => {
        const params = new URLSearchParams({
            name: file.name,
            sourceType: file.sourceType,
            url: file.url ?? '',
            userId: userId ?? '',
            fileType: type,
        });
        navigate(`/file/${file.id}?${params.toString()}`);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                        {meta.label}
                    </h2>
                    {!loading && (
                        <p className="text-sm text-slate-500">{total} file{total !== 1 ? "s" : ""}</p>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                    {error}
                </div>
            )}

            {/* File list */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <div />
                    <div>File Name</div>
                    <div className="text-right">Size</div>
                    <div className="text-right">Uploaded</div>
                </div>

                {/* Initial loading skeleton */}
                {loading && files.length === 0 && (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 animate-pulse">
                            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                            <div className="space-y-1.5">
                                <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-700 rounded" />
                            </div>
                            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                    ))
                )}

                {/* Empty state */}
                {!loading && files.length === 0 && !error && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                        <File className="w-10 h-10 opacity-30" />
                        <p className="text-sm">No {meta.label.toLowerCase()} found</p>
                    </div>
                )}

                {/* Rows */}
                {files.map((file, idx) => (
                    <div
                        key={file.id}
                        className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-6 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${idx < files.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""
                            }`}
                        onClick={() => openPreview(file)}
                    >
                        {/* Thumbnail or icon */}
                        <div className={`w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 ${meta.bg} ${meta.color} flex items-center justify-center`}>
                            {file.thumbnail ? (
                                <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
                            ) : (
                                meta.icon
                            )}
                        </div>

                        {/* Name + format */}
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate" title={file.name}>
                                {file.name}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5 uppercase">{file.format}</p>
                        </div>

                        {/* Size */}
                        <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                            {formatSize(file.size, SizeUnits.Bytes)}
                        </div>

                        {/* Date */}
                        <div className="text-sm text-slate-400 text-right whitespace-nowrap">
                            {formatDate(file.createdAt)}
                        </div>
                    </div>
                ))}

                {/* Infinite scroll sentinel */}
                {files.length > 0 && page < totalPages && (
                    <div ref={sentinelRef} className="flex justify-center py-4 gap-2 text-slate-400 text-sm">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                        <span>Loading more...</span>
                    </div>
                )}
            </div>
        </div>
    );
};
