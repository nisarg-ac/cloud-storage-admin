import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft, FileQuestion, Image, Video, Music, FileText, Play } from "lucide-react";
import { getUserUploads, Upload } from "../services/user.service";
import { formatSize, SizeUnits, formatDate } from "../utils";

const sourceTypeIcon: Record<string, React.ReactNode> = {
    IMAGE: <Image className="h-6 w-6 text-blue-500" />,
    VIDEO: <Video className="h-6 w-6 text-purple-500" />,
    AUDIO: <Music className="h-6 w-6 text-amber-500" />,
};

export const FilePreview = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const url = searchParams.get("url") ?? "";
    const name = searchParams.get("name") ?? id ?? "";
    const sourceType = (searchParams.get("sourceType") ?? "").toUpperCase();
    const userId = searchParams.get("userId") ?? "";
    const fileType = searchParams.get("fileType") ?? "";

    const hasPlaylist = !!(userId && fileType);

    // Playlist state
    const [playlist, setPlaylist] = useState<Upload[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingList, setLoadingList] = useState(false);

    const sourceTypeForApi = sourceType || "VIDEO";

    const fetchPage = useCallback(async (pageNum: number, replace = false) => {
        if (!hasPlaylist) return;
        setLoadingList(true);
        try {
            const res = await getUserUploads({ userId, sourceType: sourceTypeForApi, page: pageNum, limit: 20 });
            setPlaylist(prev => replace ? res.data : [...prev, ...res.data]);
            setTotalPages(res.meta.totalPages);
            setPage(pageNum);
        } finally {
            setLoadingList(false);
        }
    }, [hasPlaylist, userId, sourceTypeForApi]);

    useEffect(() => {
        if (hasPlaylist) fetchPage(1, true);
    }, [fetchPage, hasPlaylist]);

    // Infinite scroll for playlist
    const observer = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useCallback((node: HTMLDivElement | null) => {
        if (loadingList) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && page < totalPages) fetchPage(page + 1);
        });
        if (node) observer.current.observe(node);
    }, [loadingList, page, totalPages, fetchPage]);

    // Auto-scroll active item into view
    const activeRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [id, playlist]);

    const openFile = (file: Upload) => {
        const params = new URLSearchParams({
            name: file.name,
            sourceType: file.sourceType,
            url: file.url ?? '',
            userId,
            fileType,
        });
        navigate(`/file/${file.id}?${params.toString()}`);
    };

    const renderMedia = () => {
        if (!url) return null;
        if (sourceType === "IMAGE") {
            return <img src={url} alt={name} className="max-w-full max-h-[70vh] rounded-lg object-contain shadow" />;
        }
        if (sourceType === "VIDEO") {
            return (
                <video key={url} src={url} controls autoPlay className="max-w-full max-h-full object-contain">
                    Your browser does not support video playback.
                </video>
            );
        }
        if (sourceType === "AUDIO") {
            return <audio key={url} src={url} controls autoPlay className="w-full mt-4" />;
        }
        return null;
    };

    const media = renderMedia();

    // YouTube-style layout when playlist is available
    if (hasPlaylist) {
        return (
            <div className="space-y-4 pb-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Media Preview</h2>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-start">
                    {/* Player — left */}
                    <div className="w-full lg:flex-1 min-w-0">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                            {/* File info */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg shrink-0">
                                    {sourceTypeIcon[sourceType] ?? <FileText className="h-5 w-5 text-slate-400" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-sm" title={name}>{name}</p>
                                    <p className="text-xs text-slate-400">{sourceType.toLowerCase()} &middot; {id}</p>
                                </div>
                            </div>

                            {/* Media — fixed 16:9 box, portrait videos letterboxed */}
                            <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                                {media ?? (
                                    <div className="flex flex-col items-center text-slate-400 gap-3">
                                        <FileQuestion className="h-10 w-10" />
                                        <p className="text-sm">No preview available.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Playlist — right */}
                    <div className="w-full lg:w-80 xl:w-96 shrink-0">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Up next</p>
                                <p className="text-xs text-slate-400">{playlist.length} file{playlist.length !== 1 ? "s" : ""}</p>
                            </div>

                            <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
                                {loadingList && playlist.length === 0 && (
                                    [...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 animate-pulse">
                                            <div className="w-16 h-10 rounded bg-slate-200 dark:bg-slate-800 shrink-0" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                                                <div className="h-2 w-20 bg-slate-100 dark:bg-slate-700 rounded" />
                                            </div>
                                        </div>
                                    ))
                                )}

                                {playlist.map(file => {
                                    const isActive = file.id === id;
                                    return (
                                        <div
                                            key={file.id}
                                            ref={isActive ? activeRef : null}
                                            onClick={() => !isActive && openFile(file)}
                                            className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 transition-colors
                                                ${isActive
                                                    ? "bg-purple-50 dark:bg-purple-900/20 cursor-default"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer"
                                                }`}
                                        >
                                            {/* Thumbnail */}
                                            <div className="relative w-16 h-10 rounded overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                {file.thumbnail ? (
                                                    <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Video className="w-4 h-4 text-slate-400" />
                                                )}
                                                {isActive && (
                                                    <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                                                        <Play className="w-4 h-4 text-white fill-white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-xs font-medium truncate ${isActive ? "text-purple-700 dark:text-purple-300" : "text-slate-800 dark:text-slate-100"}`} title={file.name}>
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {formatSize(file.size, SizeUnits.Bytes)} &middot; {formatDate(file.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Infinite scroll sentinel */}
                                {playlist.length > 0 && page < totalPages && (
                                    <div ref={sentinelRef} className="flex justify-center py-3 text-slate-400 text-xs gap-2">
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-purple-500" />
                                        Loading more...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Fallback: single-file view (no playlist context)
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Media Preview</h2>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        {sourceTypeIcon[sourceType] ?? <FileText className="h-6 w-6 text-slate-400" />}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate" title={name}>{name}</p>
                        <p className="text-xs text-slate-500 capitalize">{sourceType.toLowerCase() || "File"} &middot; {id}</p>
                    </div>
                </div>

                <div className="flex items-center justify-center min-h-[300px]">
                    {media ?? (
                        <div className="flex flex-col items-center text-slate-400 gap-3">
                            <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                <FileQuestion className="h-10 w-10 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500">No preview available for this file type.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
