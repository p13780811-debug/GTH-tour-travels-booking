import { NextResponse } from "next/server";
import { authenticatedStorage } from "@/lib/security/auth";
import { readBytes, RequestError, requestError } from "@/lib/security/request";
import sharp from "sharp";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(req: Request) {
  try {
    const { client: supabase, user } = await authenticatedStorage(req);
    const contentType = req.headers.get("content-type");
    if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) throw new RequestError("Multipart image required", 415);
    const bytes = await readBytes(req, MAX_UPLOAD_BYTES + 64 * 1024);
    const formData = await new Response(Buffer.from(bytes), { headers: { "content-type": contentType } }).formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Image must be 8 MB or smaller" }, { status: 413 });
    }

    const input = Buffer.from(await file.arrayBuffer());

    const webpBuffer = await sharp(input, { failOn: "warning", limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();

    const fileName = `${crypto.randomUUID()}.webp`;
    const filePath = `properties/${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from("property-images")
      .upload(filePath, webpBuffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
    }

    const { data } = supabase.storage
      .from("property-images")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestError) return requestError(error);
    return NextResponse.json({ error: "Invalid image upload" }, { status: 400 });
  }
}
