import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Params is a promise in Next.js 15+ but usually object in 14. We'll handle it carefully or type it as any for now to be safe.
) {
  // Await params if needed or treat as object
  // Next 15 changes param behavior but for 14 it is synchronous usually.
  // Using 'any' for params to bypass strict type checking variations in dev environment
  const { id } = await params;

  if (!id) {
      return new NextResponse("Missing ID", { status: 400 });
  }

  try {
      await connectDB();
      const db = mongoose.connection.db;
      if (!db) {
          throw new Error("Database connection not ready");
      }

      const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
      const _id = new mongoose.Types.ObjectId(id);

      // Check if file exists
      const files = await bucket.find({ _id }).toArray();
      if (!files || files.length === 0) {
          return new NextResponse("File not found", { status: 404 });
      }
      
      const file = files[0] as any;
      const contentType = file.metadata?.contentType || file.contentType || 'application/octet-stream';

      // Create a ReadableStream from the GridFS download stream
      // We need to convert Node stream to Web Stream for NextResponse
      const downloadStream = bucket.openDownloadStream(_id);
      
      const stream = new ReadableStream({
          start(controller) {
              downloadStream.on('data', (chunk) => {
                  controller.enqueue(chunk);
              });
              downloadStream.on('end', () => {
                  controller.close();
              });
              downloadStream.on('error', (err) => {
                  controller.error(err);
              });
          }
      });

      return new NextResponse(stream, {
          headers: {
              'Content-Type': contentType,
              'Content-Length': file.length.toString(),
              'Cache-Control': 'public, max-age=31536000, immutable'
          }
      });

  } catch (error) {
      console.error("Media error:", error);
      return new NextResponse("Internal Error", { status: 500 });
  }
}
