// pdf-parse and officeparser must be dynamically imported
// because pdf-parse references DOMMatrix which isn't available at build time

export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
    try {
        // 1. PDF Handling
        if (mimeType === "application/pdf") {
            const pdfParse: any = await import("pdf-parse");
            const pdf = pdfParse.default ?? pdfParse;
            const data = await pdf(buffer);
            return cleanText(data.text);
        }

        // 2. Text Handling
        if (mimeType === "text/plain") {
            return buffer.toString("utf-8");
        }

        // 3. Office Files (PPTX, DOCX)
        if (
            mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
            mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            const officeParser: any = await import("officeparser");
            const text = await officeParser.parseOffice(buffer) as unknown as string;
            return cleanText(text);
        }

        throw new Error("Unsupported file type: " + mimeType);

    } catch (error) {
        console.error("File Extraction Error:", error);
        throw new Error("Failed to parse document content.");
    }
}

function cleanText(text: string): string {
    return text.replace(/\n\s*\n/g, '\n').trim();
}
