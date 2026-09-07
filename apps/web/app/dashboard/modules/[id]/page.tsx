
import { ModuleDetailClient } from "@/components/module/module-detail-client";

export default async function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ModuleDetailClient moduleId={id} />;
}
