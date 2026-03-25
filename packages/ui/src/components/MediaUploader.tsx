"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { cn } from "../lib/utils";

interface MediaUploaderProps {
    value?: string | null;  // URL to display
    blurhash?: string | null;
    onChange?: (mediaId: string, url: string, blurhash: string | null) => void;
    uploadAction?: (formData: FormData) => Promise<{ mediaId: string, url: string, blurhash: string | null }>;
    contextType?: "entity_avatar" | "entity_header" | "entity_thumbnail" | "artifact_cover" | "artifact_poster" | "artifact_asset" | "work_asset" | "work_poster" | "platform_icon" | "general";
    onFileSelect?: (file: File, objectUrl: string) => void;
    onUrlSelect?: (url: string) => void;
    onRemove?: () => void;
    className?: string;
    label?: string;
    contextId?: string;
}

export function MediaUploader({ 
    value, 
    onChange, 
    uploadAction, 
    contextType = "general", 
    onFileSelect, 
    onUrlSelect, 
    onRemove, 
    className, 
    label = "UPLOAD_AVATAR",
    contextId 
}: MediaUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(value || null);
    const [urlInput, setUrlInput] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (value !== undefined) {
            setPreview(value || null);
        }
    }, [value]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Optimistic preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        if (onFileSelect) {
            onFileSelect(file, objectUrl);
            return;
        }

        if (!uploadAction || !onChange) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("context", contextType);
        if (contextId) formData.append("contextId", contextId);

        setUploading(true);
        setProgress(30); // Simulated progress

        try {
            const result = await uploadAction(formData);
            setProgress(100);
            onChange(result.mediaId, result.url, result.blurhash);
            setPreview(result.url); // Set the real R2 URL
        } catch (error) {
            console.error("Upload failed", error);
            setPreview(value || null); // Revert
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const handleUrlUpload = async () => {
        if (!urlInput) return;
        setPreview(urlInput); // Optimistic naive preview

        if (onUrlSelect) {
            onUrlSelect(urlInput);
            setUrlInput("");
            return;
        }

        if (!uploadAction || !onChange) return;

        const formData = new FormData();
        formData.append("url", urlInput);
        formData.append("context", contextType);
        if (contextId) formData.append("contextId", contextId);

        setUploading(true);
        setProgress(30);

        try {
            const result = await uploadAction(formData);
            setProgress(100);
            onChange(result.mediaId, result.url, result.blurhash);
            setPreview(result.url);
            setUrlInput("");
        } catch (error) {
            console.error("Upload failed", error);
            setPreview(value || null);
            alert("Failed to download image from URL. It might be protected or invalid.");
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <div
                className={cn(
                    "group relative bg-zinc-950 border border-zinc-900 rounded-sm overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-violet-600 transition-colors shrink-0",
                    className || "w-24 h-24 md:w-32 md:h-32"
                )}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
                {preview ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="Preview" className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-50' : 'opacity-100'}`} />
                        {onRemove && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreview(null);
                                    setUrlInput("");
                                    onRemove();
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-rose-600 block rounded-full text-white backdrop-blur-md transition-colors z-30 shadow-lg"
                            >
                                <Icon icon="lucide:x" width={14} />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-600 group-hover:text-violet-500 transition-colors p-4 text-center">
                        <Icon icon="lucide:upload-cloud" width={24} />
                        <span className="text-[10px] font-mono mt-2 tracking-widest uppercase">{label}</span>
                        <span className="text-[8px] font-mono mt-1 text-zinc-800 group-hover:text-violet-700 transition-colors uppercase tracking-widest">[ Click_to_Browse ]</span>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-zinc-900 z-10">
                        <div
                            className="h-full bg-violet-600 transition-all duration-300 relative overflow-hidden"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                        <span className="text-[10px] sm:text-xs font-mono font-black text-violet-400 uppercase tracking-widest animate-pulse">
                            [ PROCESSING ]
                        </span>
                    </div>
                )}
            </div>

            <div className="flex gap-1 w-full">
                <input
                    type="url"
                    placeholder="Or paste URL..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlUpload())}
                    className="flex-1 bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 focus:border-violet-600 outline-none transition-colors rounded-sm"
                />
                <button
                    type="button"
                    onClick={handleUrlUpload}
                    disabled={!urlInput || uploading}
                    className="bg-zinc-900 text-zinc-500 border border-zinc-800 px-2 text-[9px] font-black uppercase hover:bg-violet-600 hover:text-white transition-all disabled:opacity-50"
                >
                    FETCH
                </button>
            </div>
        </div>
    );
}
