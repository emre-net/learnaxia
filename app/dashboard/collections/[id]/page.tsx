
import { auth } from "@/auth";
import { CollectionService } from "@/domains/collection/collection.service";
import { redirect, notFound } from "next/navigation";
import { CollectionDetailClient } from "@/app/dashboard/collections/[id]/collection-detail-client";

export default async function CollectionDetailPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !session.user?.id) {
        redirect("/auth/login");
    }

    try {
        const collection = await CollectionService.getById(session.user.id, params.id);
        if (!collection) return notFound();

        return <CollectionDetailClient collection={collection} />;
    } catch (error) {
        console.error("Collection Detail Error:", error);
        return notFound();
    }
}
