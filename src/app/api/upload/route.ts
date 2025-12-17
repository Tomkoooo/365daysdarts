import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    await connectDB();
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Initialize GridFSBucket
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("Database connection not ready");
    }
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '-' + file.name;

    // Write buffer to stream and wait for finish
    const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
            originalName: file.name,
            contentType: file.type
        }
    });

    await new Promise((resolve, reject) => {
        uploadStream.on('finish', () => resolve(true));
        uploadStream.on('error', (err) => reject(err)); // @ts-ignore
        uploadStream.end(buffer);
    });

    // Return the media URL
    // We use the ID to retrieve it
    const fileId = uploadStream.id;
    const url = `/api/media/${fileId.toString()}`;

    return NextResponse.json({ success: true, url });

  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}
