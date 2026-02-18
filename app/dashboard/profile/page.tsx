
import { Metadata } from "next";
import { ProfileClient } from "./profile-client";

export const metadata: Metadata = {
    title: "Profilim | Learnaxia",
    description: "Kullanıcı profili ve istatistikleri.",
};

export default function ProfilePage() {
    return <ProfileClient />;
}
