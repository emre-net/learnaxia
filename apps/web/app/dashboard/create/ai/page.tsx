import { AICreationWizard } from "@/components/create/ai-creation-wizard";

export const metadata = {
    title: "AI Generation | Learnaxia",
    description: "Generate learning content with AI."
};

export default function AICreatePage() {
    return (
        <div className="container mx-auto px-4">
            <div className="mb-6 mt-8">
                <h1 className="text-3xl font-bold tracking-tight">AI Content Generator</h1>
                <p className="text-muted-foreground">Turn any topic into interactive study materials in seconds.</p>
            </div>
            <AICreationWizard />
        </div>
    );
}
