import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseImportFromText, parseImportFromImage } from "@/lib/openai/chat";

// POST /api/ai/import-records
// Body: { text?: string } or multipart form with "image" file
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      // Image upload path
      const form = await req.formData();
      const file = form.get("image") as File | null;
      if (!file) return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });

      const buffer     = await file.arrayBuffer();
      const base64     = Buffer.from(buffer).toString("base64");
      const mimeType   = file.type || "image/jpeg";

      const records = await parseImportFromImage(base64, mimeType);
      return NextResponse.json({ success: true, data: records });
    } else {
      // Text path
      const body = await req.json();
      const text: string = body?.text ?? "";
      if (!text.trim()) return NextResponse.json({ success: false, error: "text required" }, { status: 400 });

      const records = await parseImportFromText(text);
      return NextResponse.json({ success: true, data: records });
    }
  } catch (err) {
    console.error("POST /api/ai/import-records", err);
    return NextResponse.json({ success: false, error: "Failed to parse records" }, { status: 500 });
  }
}
