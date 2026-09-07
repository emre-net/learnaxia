
import { ManualCreationWizard } from "@/components/create/manual-creation-wizard";

import { Suspense } from "react";
import { BrandLoader } from "@/components/ui/brand-loader";

export default function ManualCreatePage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><BrandLoader size="lg" /></div>}>
            <ManualCreationWizard />
        </Suspense>
    );
}
