"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.critical("UI Crash - React Error Boundary caught an error", {
            metadata: {
                error: error.toString(),
                componentStack: errorInfo.componentStack,
            },
            context: "ErrorBoundary"
        });
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-900/30 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="h-20 w-20 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-6">
                        <AlertCircle className="h-10 w-10 text-rose-600 dark:text-rose-400" />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Eyvah, bir şeyler ters gitti!</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8 font-medium">
                        Beklenmedik bir hata ile karşılaştık. Merak etmeyin, mühendislerimiz konu hakkında bilgilendirildi.
                    </p>
                    <Button
                        onClick={() => this.setState({ hasError: false })}
                        className="rounded-2xl h-12 px-8 font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-95"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" /> Tekrar Dene
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
