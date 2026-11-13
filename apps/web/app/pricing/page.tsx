import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { PricingSection } from "@/components/landing/pricing-section";

export const metadata = {
    title: "Fiyatlandırma & Planlar | Learnaxia",
    description: "Learnaxia'nın tüm gücünü ücretsiz deneyimleyin veya Pro plan ile sınırları zorlayın.",
};

export default function PricingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-sky-500/20">
            <Navbar />
            <main className="flex-1 pt-24 pb-12">
                <PricingSection />
            </main>
            <Footer />
        </div>
    );
}

