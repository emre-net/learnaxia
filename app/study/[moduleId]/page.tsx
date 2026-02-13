"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useStudyStore, StudyMode } from "@/stores/study-store";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Placeholder for the actual study interface (we'll build this next)
function StudyInterface() {
    const { items, currentIndex, mode } = useStudyStore();
    const currentItem = items[currentIndex];

    // Check if finished
    if (!currentItem) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center p-4">
                <h1 className="text-2xl font-bold mb-4">Session Complete! 🎉</h1>
                <p className="text-muted-foreground mb-8">You have reviewed all items in this session.</p>
                <div className="flex gap-4">
                    <Button onClick={() => window.location.href = '/library'}>Back to Library</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen p-4">
            <div className="mb-4 text-sm text-muted-foreground">
                Mode: {mode} | Item {currentIndex + 1} of {items.length}
            </div>
            <div className="p-8 border rounded-lg shadow-lg max-w-md w-full bg-card min-h-[300px] flex items-center justify-center">
                <pre>{JSON.stringify(currentItem, null, 2)}</pre>
            </div>
            {/* Controls will go here */}
        </div>
    );
}

export default function StudyPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const initSession = useStudyStore(state => state.initSession);
    const sessionId = useStudyStore(state => state.sessionId);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const moduleId = params.moduleId as string;
    const mode = (searchParams.get('mode') as StudyMode) || 'NORMAL';

    useEffect(() => {
        // If we already have a session for THIS module, don't restart (unless forced?)
        // For simplicity, we always start fresh on page load for now to ensure sync.

        async function startSession() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/study/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ moduleId, mode })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to start session");
                }

                const data = await res.json();

                if (data.items.length === 0) {
                    setError("No items found for this mode.");
                    setIsLoading(false);
                    return;
                }

                initSession(moduleId, data.items, mode);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Something went wrong");
            } finally {
                setIsLoading(false);
            }
        }

        startSession();
    }, [moduleId, mode, initSession]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Initializing Study Session...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 p-4 text-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <h2 className="text-xl font-semibold">Could not start session</h2>
                <p className="text-muted-foreground max-w-sm">{error}</p>
                <Button variant="outline" onClick={() => router.push(`/modules/${moduleId}`)}>
                    Return to Module
                </Button>
            </div>
        );
    }

    return <StudyInterface />;
}
