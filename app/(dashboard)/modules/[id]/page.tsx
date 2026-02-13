
import { ModuleDetailClient } from "@/components/module/module-detail-client";

export default function ModuleDetailPage({ params }: { params: { id: string } }) {
    return <ModuleDetailClient moduleId={params.id} />;
}
