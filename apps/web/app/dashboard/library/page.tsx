import { Suspense } from "react";
import { LibraryClient } from "./library-client";
import { BrandLoader } from "@/components/ui/brand-loader";

export default function LibraryPage() {
    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Suspense fallback={<div className="flex justify-center py-20"><BrandLoader size="lg" /></div>}>
                <LibraryClient />
            </Suspense>
        </div>
    );
}
