import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireUser, handleApiError, ApiError } from "@/lib/require-session";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(request: Request) {
  try {
    await requireUser();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError("No file provided.");
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new ApiError("Unsupported file type.");
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new ApiError("File is too large (max 8MB).");
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    return handleApiError(error);
  }
}
