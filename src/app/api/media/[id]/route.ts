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
      
      let isClosed = false;
      const stream = new ReadableStream({
          start(controller) {
              downloadStream.on('data', (chunk) => {
                  if (!isClosed) {
                      try {
                          controller.enqueue(chunk);
                      } catch (e) {
                          isClosed = true;
                          downloadStream.destroy();
                      }
                  }
              });
              downloadStream.on('end', () => {
                  if (!isClosed) {
                      try {
                          controller.close();
                      } catch (e) {}
                      isClosed = true;
                  }
              });
              downloadStream.on('error', (err) => {
                  if (!isClosed) {
                      controller.error(err);
                      isClosed = true;
                  }
              });
          },
          cancel() {
              isClosed = true;
              downloadStream.destroy();
          }
      });

      return new NextResponse(stream, {
          headers: {
              'Content-Type': contentType,
              'Content-Length': file.length.toString(),
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET',
              'Content-Disposition': 'inline'
          }
      });

  } catch (error) {
      console.error("Media error:", error);
      return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ success: false, message: 'Missing file ID' }, { status: 400 });
        }

        await connectDB();
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database connection not ready");

        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
        
        try {
            const _id = new mongoose.Types.ObjectId(id);
            await bucket.delete(_id);
            return NextResponse.json({ success: true, message: "File deleted successfully" });
        } catch (err) {
            console.error("Delete failed:", err);
            return NextResponse.json({ success: false, message: "File not found or delete failed" }, { status: 404 });
        }
    } catch (error) {
        console.error("Media delete failed:", error);
        return NextResponse.json({ success: false, message: "Media delete failed" }, { status: 500 });
    }
}
