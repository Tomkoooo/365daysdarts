"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import { uploadFileInChunks, getUploadId } from "@/lib/upload-utils"
import { toast } from "sonner"

export type UploadStatus = 'idle' | 'uploading' | 'merging' | 'complete' | 'error' | 'cancelled' | 'paused' | 'interrupted';

export interface BackgroundUpload {
    id: string; // Internal state ID
    serverUploadId?: string; // GridFS/Temp ID
    filename: string;
    progress: number;
    status: UploadStatus;
    error?: string;
    url?: string;
    controller: AbortController;
}

interface UploadContextType {
    uploads: BackgroundUpload[];
    startUploads: (files: File[]) => void;
    startAwaitedUpload: (file: File) => Promise<{ success: boolean; url?: string; message?: string }>;
    pauseUpload: (id: string) => void;
    resumeUpload: (id: string) => void;
    cancelUpload: (id: string, deleteFromServer: boolean) => Promise<void>;
    clearFinished: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
    const [uploads, setUploads] = useState<BackgroundUpload[]>([]);
    const uploadsRef = useRef<BackgroundUpload[]>([]);
    const filesRef = useRef<Map<string, File>>(new Map());

    const updateUploadState = useCallback((id: string, updates: Partial<BackgroundUpload>) => {
        setUploads(prev => {
            const index = prev.findIndex(u => u.id === id);
            if (index === -1) return prev;
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            uploadsRef.current = next;
            return next;
        });
    }, []);

    const fetchRemoteSessions = useCallback(async () => {
        try {
            const res = await fetch('/api/upload/chunk?list=true');
            const data = await res.json();
            if (data.success && data.sessions) {
                const remoteUploads = data.sessions.map((s: any) => ({
                    id: `remote-${s._id}`,
                    serverUploadId: s._id,
                    filename: s.filename,
                    progress: Math.round((s.uploadedCount / s.totalChunks) * 100),
                    status: 'interrupted' as UploadStatus,
                    controller: new AbortController()
                }));

                setUploads(prev => {
                    // Avoid duplicates (already in list)
                    const existingServerIds = new Set(prev.map(u => u.serverUploadId));
                    const filteredRemote = remoteUploads.filter((u: any) => !existingServerIds.has(u.serverUploadId));
                    const next = [...prev, ...filteredRemote];
                    uploadsRef.current = next;
                    return next;
                });
            }
        } catch (err) {
            console.error("Failed to fetch remote sessions", err);
        }
    }, []);

    useEffect(() => {
        fetchRemoteSessions();
    }, [fetchRemoteSessions]);

    const performUpload = useCallback(async (file: File, upload: BackgroundUpload) => {
        updateUploadState(upload.id, { status: 'uploading', controller: new AbortController() });
        
        // Use a 100ms delay to ensure state has settled and controller is accessible
        await new Promise(r => setTimeout(r, 100));
        const currentUpload = uploadsRef.current.find(u => u.id === upload.id);
        const controller = currentUpload?.controller || upload.controller;

        try {
            const result = await uploadFileInChunks(
                file, 
                (progress, status) => {
                    updateUploadState(upload.id, { 
                        progress, 
                        status: status === 'merging' ? 'merging' : 'uploading' 
                    });
                },
                controller.signal
            );

            if (result.success) {
                updateUploadState(upload.id, { 
                    status: 'complete', 
                    progress: 100, 
                    url: result.url 
                });
                toast.success(`${file.name} feltöltve!`);
                filesRef.current.delete(upload.id);
                return result;
            } else {
                throw new Error(result.message || "Ismeretlen hiba");
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                // Done - status handled in pause/cancel
            } else {
                console.error(`Upload failed for ${file.name}:`, err);
                updateUploadState(upload.id, { status: 'error', error: err.message });
                toast.error(`${file.name} hibára futott`, { description: err.message });
            }
            return { success: false, message: err.message };
        }
    }, [updateUploadState]);

    const startUploads = useCallback(async (files: File[]) => {
        const newUploads = await Promise.all(files.map(async file => {
            const serverUploadId = await getUploadId(file);
            
            // Re-use existing "interrupted" slot if it exists
            const existing = uploadsRef.current.find(u => u.serverUploadId === serverUploadId);
            if (existing) {
                filesRef.current.set(existing.id, file);
                return { ...existing, isExisting: true };
            }

            const tempId = Math.random().toString(36).substr(2, 9);
            filesRef.current.set(tempId, file);
            
            return {
                id: tempId,
                serverUploadId,
                filename: file.name,
                progress: 0,
                status: 'idle' as UploadStatus,
                controller: new AbortController(),
                isExisting: false
            };
        }));

        const freshUploads = newUploads.filter(u => !u.isExisting);
        
        if (freshUploads.length > 0) {
            setUploads(prev => {
                const next = [...prev, ...freshUploads.map(({isExisting, ...rest}) => rest as BackgroundUpload)];
                uploadsRef.current = next;
                return next;
            });
        }

        newUploads.forEach((u, i) => {
            const file = files[i];
            performUpload(file, u as BackgroundUpload);
        });
    }, [performUpload]);

    const startAwaitedUpload = useCallback(async (file: File) => {
        const serverUploadId = await getUploadId(file);
        const existing = uploadsRef.current.find(u => u.serverUploadId === serverUploadId);
        
        if (existing) {
            filesRef.current.set(existing.id, file);
            return await performUpload(file, existing);
        }

        const tempId = Math.random().toString(36).substr(2, 9);
        filesRef.current.set(tempId, file);
        
        const upload: BackgroundUpload = {
            id: tempId,
            serverUploadId,
            filename: file.name,
            progress: 0,
            status: 'idle',
            controller: new AbortController()
        };

        setUploads(prev => {
            const next = [...prev, upload];
            uploadsRef.current = next;
            return next;
        });

        return await performUpload(file, upload);
    }, [performUpload]);

    const pauseUpload = useCallback((id: string) => {
        const upload = uploadsRef.current.find(u => u.id === id);
        if (!upload || (upload.status !== 'uploading' && upload.status !== 'merging')) return;

        upload.controller.abort();
        updateUploadState(id, { status: 'paused' });
    }, [updateUploadState]);

    const resumeUpload = useCallback((id: string) => {
        const upload = uploadsRef.current.find(u => u.id === id);
        const file = filesRef.current.get(id);
        
        if (!upload) return;
        if (upload.status === 'uploading' || upload.status === 'merging') return;

        if (!file) {
            toast.info("A feltöltés folytatásához válaszd ki újra ugyanazt a fájlt a Médiatárban!", {
                duration: 5000,
            });
            return;
        }

        performUpload(file, upload);
    }, [performUpload]);

    const cancelUpload = useCallback(async (id: string, deleteFromServer: boolean) => {
        const upload = uploadsRef.current.find(u => u.id === id);
        if (!upload) return;

        upload.controller.abort();
        
        if (deleteFromServer && upload.serverUploadId) {
            try {
                updateUploadState(id, { status: 'cancelled' });
                const res = await fetch(`/api/upload/chunk?uploadId=${upload.serverUploadId}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    toast.success(`${upload.filename}: feltöltés véglegesen törölve.`);
                    setUploads(prev => {
                        const next = prev.filter(u => u.id !== id);
                        uploadsRef.current = next;
                        return next;
                    });
                    filesRef.current.delete(id);
                }
            } catch (err) {
                console.error("Cleanup failed", err);
            }
        } else {
            updateUploadState(id, { status: 'cancelled' });
        }
    }, [updateUploadState]);

    const clearFinished = useCallback(() => {
        setUploads(prev => {
            const next = prev.filter(u => u.status !== 'complete' && u.status !== 'cancelled' && u.status !== 'error' && u.status !== 'interrupted');
            uploadsRef.current = next;
            return next;
        });
    }, []);

    return (
        <UploadContext.Provider value={{ 
            uploads, 
            startUploads, 
            startAwaitedUpload, 
            pauseUpload, 
            resumeUpload, 
            cancelUpload, 
            clearFinished 
        }}>
            {children}
        </UploadContext.Provider>
    );
}

export function useUpload() {
    const context = useContext(UploadContext);
    if (context === undefined) {
        throw new Error("useUpload must be used within an UploadProvider");
    }
    return context;
}
