"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { useState } from "react";
import { logger } from "@/lib/logger";

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                queryCache: new QueryCache({
                    onError: (error, query) => {
                        logger.error(`Data fetch failed: ${query.queryKey.join(' / ')}`, {
                            context: "ReactQuery.QueryCache",
                            metadata: { error: error instanceof Error ? error.message : String(error), queryKey: query.queryKey }
                        });
                    }
                }),
                mutationCache: new MutationCache({
                    onError: (error, _variables, _context, mutation) => {
                        logger.error(`Data mutation failed`, {
                            context: "ReactQuery.MutationCache",
                            metadata: { error: error instanceof Error ? error.message : String(error), mutationKey: mutation.options.mutationKey }
                        });
                    }
                }),
                defaultOptions: {
                    queries: {
                        // With SSR, we usually want to set some default staleTime
                        // above 0 to avoid refetching immediately on the client
                        staleTime: 60 * 1000,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
