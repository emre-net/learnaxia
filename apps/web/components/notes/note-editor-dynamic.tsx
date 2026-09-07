"use client";

import dynamic from "next/dynamic";
import { BrandLoader } from "@/components/ui/brand-loader";

export const NoteEditorDynamic: React.ComponentType<any> = dynamic(
    () => import("./note-editor").then((mod) => mod.NoteEditor),
    { 
        ssr: false,
        loading: () => (
            <div className="flex h-full items-center justify-center">
                <BrandLoader size="lg" label="Editör Yükleniyor..." />
            </div>
        )
    }
);
