"use client";

import { BlockEditor } from "@/components/notes/block-editor";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";

export default function MobileEditor() {
    const { setTheme } = useTheme();
    const [initialContent, setInitialContent] = useState("");
    const [isReady, setIsReady] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Default to dark mode for the app
        setTheme("dark");

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "INIT") {
                    setInitialContent(data.content || "");
                    setIsReady(true);
                }
            } catch (e) {
                console.error("Error parsing message from React Native:", e);
            }
        };

        // Listen for messages from React Native WebView
        window.addEventListener("message", handleMessage);

        // Let React Native know the WebView is ready to receive data
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "READY" }));
        }

        return () => window.removeEventListener("message", handleMessage);
    }, [setTheme]);

    const handleChange = (content: string) => {
        if (!isReady || !window.ReactNativeWebView) return;

        // Debounce sending updates back to React Native to avoid overwhelming the bridge
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: "CONTENT_CHANGED",
                    content
                }));
            }
        }, 500);
    };

    if (!isReady) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#04101A]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            </div>
        );
    }

    // A completely blank canvas that fills the WebView
    return (
        <div className="min-h-screen bg-[#04101A] px-4 py-4 sm:px-0 text-white">
            <BlockEditor
                initialContent={initialContent}
                onChange={handleChange}
            />
            {/* 
              We add extra padding at the bottom so the user can scroll 
              past the last block when the keyboard is open in native.
            */}
            <div className="h-64" />
        </div>
    );
}

// Ensure TypeScript knows about ReactNativeWebView on the window object
declare global {
    interface Window {
        ReactNativeWebView?: {
            postMessage: (message: string) => void;
        };
    }
}
