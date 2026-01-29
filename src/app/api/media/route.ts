import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database connection not ready");

        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
        
        // Find all files in the uploads bucket
        const files = await bucket.find({}).toArray();
        
        // Transform to a cleaner format
        const mediaList = files.map(file => ({
            id: file._id.toString(),
            filename: file.filename,
            originalName: file.metadata?.originalName || file.filename,
            contentType: file.metadata?.contentType || 'application/octet-stream',
            size: file.length,
            uploadDate: file.uploadDate,
            uploadId: file.metadata?.uploadId,
            url: `/api/media/${file._id.toString()}`
        }));

        // Sort by upload date descending
        mediaList.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

        return NextResponse.json({ success: true, media: mediaList });
    } catch (error) {
        console.error("Failed to fetch media list:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch media list" }, { status: 500 });
    }
}
