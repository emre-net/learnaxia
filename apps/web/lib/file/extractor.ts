// pdf-parse and officeparser must be dynamically imported
// because pdf-parse references DOMMatrix which isn't available at build time

export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
    try {
        let text = "";

        // 1. PDF Handling
        if (mimeType === "application/pdf") {
            const pdfParse: any = await import("pdf-parse");
            const pdf = pdfParse.default ?? pdfParse;
            const data = await pdf(buffer);
            text = cleanText(data.text);
            
            // Heuristic for image-only PDFs: Very little text but large file size
            if (text.length < 100 && buffer.length > 300 * 1024) {
                throw new Error("Bu PDF salt resimden oluşuyor gibi görünüyor. Metin tabakası olmayan dosyalar işlenememektedir.");
            }
        }
        // 2. Text Handling
        else if (mimeType === "text/plain") {
            text = buffer.toString("utf-8");
        }
        // 3. Office Files (PPTX, DOCX)
        else if (
            mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
            mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            const officeParser: any = await import("officeparser");
            const extracted = await officeParser.parseOffice(buffer) as unknown as string;
            text = cleanText(extracted);
        } else {
            throw new Error("Unsupported file type: " + mimeType);
        }

        if (!text || text.length < 10) {
            throw new Error("Belgede okunabilir metin bulunamadı.");
        }

        return text;

    } catch (error: any) {
        console.error("File Extraction Error:", error);
        if (error.message.includes("resimden oluşuyor") || error.message.includes("okunabilir metin")) {
            throw error;
        }
        throw new Error("Belge içeriği çözümlenemedi.");
    }
}

function cleanText(text: string): string {
    return text.replace(/\n\s*\n/g, '\n').trim();
}
