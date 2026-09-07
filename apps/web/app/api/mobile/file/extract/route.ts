import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { extractTextFromFile } from "@/lib/file/extractor";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"   // .docx
];

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Sometimes Expo DocumentPicker sends 'application/octet-stream' or other mime types
        // So we might need to be slightly lenient or check the extension if type is missing,
        // but let's stick to ALLOWED_TYPES for security.
        if (file.type && !ALLOWED_TYPES.includes(file.type)) {
            console.warn(`[Mobile Extract] Unsupported file type: ${file.type}`);
            // Let's still try to process it if it's a PDF by extension
            if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.txt') && !file.name.toLowerCase().endsWith('.pptx')) {
                return NextResponse.json({ error: `Geçersiz dosya türü: ${file.type}. Desteklenenler: PDF, TXT, PPTX.` }, { status: 400 });
            }
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "Dosya çok büyük. Maksimum 10MB." }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const text = await extractTextFromFile(buffer, file.type || 'application/pdf'); // Fallback to pdf if type is empty but extension was okay

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("Mobile File Upload Error:", error);
        return NextResponse.json({ error: "Dosya işlenemedi. Lütfen tekrar deneyin." }, { status: 500 });
    }
}
