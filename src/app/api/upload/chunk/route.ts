import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

// Use a temporary collection to store chunks before merging
// We'll use the native driver for efficiency with GridFS
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const uploadId = searchParams.get('uploadId');
        const listSessions = searchParams.get('list') === 'true';
        
        await connectDB();
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database connection not ready");
        const chunkCollection = db.collection('upload_temp_chunks');

        if (listSessions) {
            const sessions = await chunkCollection.aggregate([
                { $group: { 
                    _id: "$uploadId", 
                    filename: { $first: "$filename" },
                    totalChunks: { $first: "$totalChunks" },
                    uploadedCount: { $sum: 1 },
                    lastUpdate: { $max: "$createdAt" },
                    contentType: { $first: "$contentType" }
                }},
                { $sort: { lastUpdate: -1 } }
            ]).toArray();
            return NextResponse.json({ success: true, sessions });
        }

        if (!uploadId) {
            return NextResponse.json({ success: false, message: 'Missing uploadId' }, { status: 400 });
        }

        // 1. Check if the file is already fully uploaded in GridFS
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
        const existingFiles = await bucket.find({ "metadata.uploadId": uploadId }).toArray();
        if (existingFiles.length > 0) {
            const fileId = existingFiles[0]._id;
            const url = `/api/media/${fileId.toString()}`;
            return NextResponse.json({ success: true, url, completed: true, alreadyExists: true });
        }

        const chunks = await chunkCollection.find({ uploadId }, { projection: { index: 1, _id: 0 } }).toArray();
        const indices = chunks.map(c => c.index);

        return NextResponse.json({ success: true, indices, completed: false });
    } catch (error) {
        console.error("Failed to get chunk info:", error);
        return NextResponse.json({ success: false, message: "Failed to get chunk info" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const uploadId = data.get('uploadId') as string;
    const index = parseInt(data.get('index') as string);
    const totalChunks = parseInt(data.get('totalChunks') as string);
    const filename = data.get('filename') as string;
    const contentType = data.get('contentType') as string;
    const chunkHash = data.get('chunkHash') as string;
    const finalize = data.get('finalize') === 'true';

    if (!uploadId || (isNaN(index) && !finalize)) {
      return NextResponse.json({ success: false, message: 'Invalid chunk data' }, { status: 400 });
    }

    await connectDB();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not ready");

    const chunkCollection = db.collection('upload_temp_chunks');
    await chunkCollection.createIndex({ uploadId: 1, index: 1 });

    // 1. Check if the file is already fully uploaded in GridFS
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    const existingFiles = await bucket.find({ "metadata.uploadId": uploadId }).toArray();
    if (existingFiles.length > 0) {
        const fileId = existingFiles[0]._id;
        const url = `/api/media/${fileId.toString()}`;
        return NextResponse.json({ success: true, url, completed: true, alreadyExists: true });
    }

    if (!finalize) {
        // Handle chunk upload
        const bytes = await file!.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        await chunkCollection.updateOne(
            { uploadId, index },
            { $set: { 
                buffer, 
                chunkHash, 
                createdAt: new Date(),
                filename,
                totalChunks,
                contentType
            } },
            { upsert: true }
        );
        return NextResponse.json({ success: true, completed: false });
    }

    // Handle Finalization (Merging)
    const uploadedCount = await chunkCollection.countDocuments({ uploadId });
    if (uploadedCount < totalChunks) {
        return NextResponse.json({ success: false, message: `Missing chunks: ${uploadedCount}/${totalChunks}` }, { status: 400 });
    }

    // Generate final filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const finalFilename = uniqueSuffix + '-' + filename;

    const uploadStream = bucket.openUploadStream(finalFilename, {
        metadata: {
            originalName: filename,
            contentType: contentType,
            uploadId: uploadId
        }
    });

    // Merge logic
    const cursor = chunkCollection.find({ uploadId }).sort({ index: 1 });
    await new Promise((resolve, reject) => {
        uploadStream.on('finish', () => resolve(true));
        uploadStream.on('error', (err) => reject(err));
        
        async function writeChunks() {
            try {
                // Optimized iteration
                for await (const chunk of cursor) {
                    const b = Buffer.from(chunk.buffer.buffer || chunk.buffer);
                    if (!uploadStream.write(b)) {
                        await new Promise(r => uploadStream.once('drain', r));
                    }
                }
                uploadStream.end();
            } catch (err) {
                uploadStream.destroy(err as any);
                reject(err);
            }
        }
        writeChunks();
    });

    // Clean up
    await chunkCollection.deleteMany({ uploadId });
    const fileId = uploadStream.id;
    const url = `/api/media/${fileId.toString()}`;

    return NextResponse.json({ success: true, url, completed: true });

  } catch (error) {
    console.error("Chunk upload failed:", error);
    return NextResponse.json({ success: false, message: "Chunk upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const uploadId = searchParams.get('uploadId');

        if (!uploadId) {
            return NextResponse.json({ success: false, message: 'Missing uploadId' }, { status: 400 });
        }

        await connectDB();
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database connection not ready");

        const chunkCollection = db.collection('upload_temp_chunks');
        await chunkCollection.deleteMany({ uploadId });

        return NextResponse.json({ success: true, message: "Upload session deleted" });
    } catch (error) {
        console.error("Failed to delete upload session:", error);
        return NextResponse.json({ success: false, message: "Failed to delete upload session" }, { status: 500 });
    }
}
