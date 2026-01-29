async function getHash(buffer: ArrayBuffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getUploadId(file: File): Promise<string> {
    const uploadIdSource = `${file.name}-${file.size}-${file.lastModified}`;
    const uploadIdBuffer = new TextEncoder().encode(uploadIdSource);
    return await getHash(uploadIdBuffer.buffer);
}

export async function uploadFileInChunks(
    file: File, 
    onProgress?: (percent: number, status?: 'uploading' | 'merging') => void,
    signal?: AbortSignal
): Promise<{ success: boolean; url?: string; message?: string }> {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    // Stable ID based on file properties
    const uploadId = await getUploadId(file);

    // Resume Probing: Check which chunks already exist on the server
    const probeRes = await fetch(`/api/upload/chunk?uploadId=${uploadId}`, { signal });
    if (!probeRes.ok) throw new Error("Failed to probe upload status");
    const probeData = await probeRes.json();

    if (probeData.success && probeData.completed && probeData.alreadyExists) {
        if (onProgress) onProgress(100);
        return { success: true, url: probeData.url };
    }

    const existingIndices = new Set(probeData.indices || []);
    const totalExisting = existingIndices.size;

    for (let i = 0; i < totalChunks; i++) {
        if (existingIndices.has(i)) {
            if (onProgress) {
                const percent = Math.round(((i + 1) / totalChunks) * 100);
                onProgress(percent, 'uploading');
            }
            continue;
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const chunk = file.slice(start, end);
        const chunkBuffer = await chunk.arrayBuffer();
        const chunkHash = await getHash(chunkBuffer);

        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('uploadId', uploadId);
        formData.append('index', i.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('filename', file.name);
        formData.append('contentType', file.type);
        formData.append('chunkHash', chunkHash);

        let retryCount = 0;
        const maxRetries = 3;
        let success = false;
        let data;

        while (retryCount <= maxRetries && !success) {
            try {
                const res = await fetch('/api/upload/chunk', {
                    method: 'POST',
                    body: formData,
                    signal
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || `Chunk ${i} upload failed`);
                }

                data = await res.json();
                
                // If the server tells us the file already exists (deduplication)
                if (data.success && data.completed && data.alreadyExists) {
                    if (onProgress) onProgress(100);
                    return { success: true, url: data.url };
                }

                success = true;
            } catch (err: any) {
                if (err.name === 'AbortError') throw err;
                retryCount++;
                if (retryCount > maxRetries) throw err;
                // Wait before retrying (exponential backoff or simple delay)
                await new Promise(r => setTimeout(r, 1000 * retryCount));
            }
        }
        
        if (onProgress) {
            const percent = Math.round(((i + 1) / totalChunks) * 100);
            onProgress(percent, 'uploading');
        }
    }

    // Finalize upload
    if (onProgress) onProgress(100, 'merging');
    
    const finalizeData = new FormData();
    finalizeData.append('uploadId', uploadId);
    finalizeData.append('totalChunks', totalChunks.toString());
    finalizeData.append('filename', file.name);
    finalizeData.append('contentType', file.type);
    finalizeData.append('finalize', 'true');

    const finalizeRes = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: finalizeData,
        signal
    });

    if (!finalizeRes.ok) {
        const errorData = await finalizeRes.json();
        throw new Error(errorData.message || "Finalization failed");
    }

    const finalizeResult = await finalizeRes.json();
    return { success: true, url: finalizeResult.url };
}
