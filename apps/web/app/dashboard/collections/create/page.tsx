import { redirect } from "next/navigation";

export default function CollectionsCreateRedirectPage() {
    redirect("/dashboard/collections/new");
}
