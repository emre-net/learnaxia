
import { auth } from "@/auth";
import { CollectionService } from "@/domains/collection/collection.service";
import { redirect, notFound } from "next/navigation";
import { CollectionDetailClient } from "@/app/dashboard/collections/[id]/collection-detail-client";

export default async function CollectionDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session || !session.user?.id) {
        redirect("/auth/login");
    }

    let collection;
    try {
        const { id } = await params;
        collection = await CollectionService.getById(session.user.id, id);
    } catch (error) {
        console.error("Collection Detail Error:", error);
        return notFound();
    }

    if (!collection) return notFound();
    return <CollectionDetailClient collection={collection} />;
}
